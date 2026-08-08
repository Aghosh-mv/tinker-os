#!/bin/bash
set -e

# Tinker OS Build Script
# Builds a complete Ubuntu 24.04-based desktop ISO with web desktop environment

BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOTFS="$BUILD_DIR/rootfs"
ISO_DIR="$BUILD_DIR/minimal-iso"
PACKAGES=(
    # Core
    systemd systemd-sysv openssh-server sudo iputils-ping net-tools
    # Kernel modules
    linux-modules-$(uname -r | sed 's/-generic//') linux-image-generic linux-generic
    # Desktop
    xfce4 xfce4-goodies xfwm4 xfdesktop4 xfce4-panel xfce4-session
    # Themes & Icons
    arc-theme papirus-icon-theme
    # Applications
    google-chrome-stable chromium-browser firefox
    # Audio
    alsa-utils pulseaudio pavucontrol
    # Network
    network-manager network-manager-gnome
    # Bluetooth
    bluez bluetooth
    # Utilities
    gparted file-roller synaptic xdotool x11-utils
    # Display Server
    xserver-xorg-core xserver-xorg xserver-xorg-video-all
    # LightDM
    lightdm lightdm-gtk-greeter
    # Other
    accountsservice udisks2 openssh-server
    # Live boot
    casper lsof
    # Fonts
    fonts-dejavu fonts-liberation
)

build_rootfs() {
    echo "[*] Building rootfs with debootstrap..."
    sudo rm -rf "$ROOTFS"
    sudo debootstrap --arch=amd64 noble "$ROOTFS" http://archive.ubuntu.com/ubuntu/
    
    echo "[*] Installing packages..."
    sudo chroot "$ROOTFS" apt-get update
    sudo chroot "$ROOTFS" apt-get install -y "${PACKAGES[@]}"
    
    echo "[*] Installing Google Chrome..."
    sudo cp "$BUILD_DIR/google-chrome.deb" "$ROOTFS/tmp/" 2>/dev/null || true
    sudo chroot "$ROOTFS" dpkg -i /tmp/google-chrome.deb 2>/dev/null || \
    sudo chroot "$ROOTFS" apt-get install -f -y || true
    
    echo "[*] Applying custom configurations..."
    apply_configs
    
    echo "[*] Cleaning up..."
    sudo chroot "$ROOTFS" apt-get clean
    sudo rm -rf "$ROOTFS/var/cache/apt/archives/"*
    sudo rm -rf "$ROOTFS/var/lib/apt/lists/"*
    sudo rm -rf "$ROOTFS/tmp/"*
}

apply_configs() {
    # Copy source files into rootfs
    sudo cp "$BUILD_DIR/src/tinkeros-install" "$ROOTFS/usr/local/bin/"
    sudo cp "$BUILD_DIR/src/tinkeros-desktop-start" "$ROOTFS/usr/local/bin/"
    sudo chmod +x "$ROOTFS/usr/local/bin/tinkeros-install"
    sudo chmod +x "$ROOTFS/usr/local/bin/tinkeros-desktop-start"
    
    # Systemd services
    sudo cp "$BUILD_DIR/src/tinkeros-server.service" "$ROOTFS/etc/systemd/system/"
    sudo cp "$BUILD_DIR/src/tinkeros-desktop.service" "$ROOTFS/etc/systemd/system/"
    
    # XFCE configs
    sudo mkdir -p "$ROOTFS/etc/xdg/xfce4/xfconf/xfce-perchannel-xml/"
    sudo cp "$BUILD_DIR/src/xfce4-keyboard-shortcuts.xml" "$ROOTFS/etc/xdg/xfce4/xfconf/xfce-perchannel-xml/"
    sudo cp "$BUILD_DIR/src/xfce4-session.xml" "$ROOTFS/etc/xdg/xfce4/xfconf/xfce-perchannel-xml/"
    sudo cp "$BUILD_DIR/src/xsettings.xml" "$ROOTFS/etc/xdg/xfce4/xfconf/xfce-perchannel-xml/"
    
    # Panel config
    sudo mkdir -p "$ROOTFS/etc/xdg/xfce4/panel/"
    sudo cp "$BUILD_DIR/src/panel-default.xml" "$ROOTFS/etc/xdg/xfce4/panel/default.xml"
    
    # XFCE session
    sudo mkdir -p "$ROOTFS/usr/share/xsessions/"
    sudo cp "$BUILD_DIR/src/xfce.desktop" "$ROOTFS/usr/share/xsessions/"
    
    # Autostart
    sudo mkdir -p "$ROOTFS/etc/xdg/autostart/"
    sudo cp "$BUILD_DIR/src/xscreensaver.desktop" "$ROOTFS/etc/xdg/autostart/"
    
    # Skel files
    sudo cp "$BUILD_DIR/src/skel-bashrc" "$ROOTFS/etc/skel/.bashrc"
    sudo cp "$BUILD_DIR/src/skel-profile" "$ROOTFS/etc/skel/.profile"
    
    # Wallpaper
    sudo mkdir -p "$ROOTFS/usr/share/backgrounds/"
    sudo cp "$BUILD_DIR/src/tinkeros.png" "$ROOTFS/usr/share/backgrounds/tinkeros.png"
    
    # GRUB config
    sudo mkdir -p "$ROOTFS/boot/grub/"
    sudo cp "$BUILD_DIR/src/grub.cfg" "$ROOTFS/boot/grub/grub.cfg"
    
    # Hostname
    echo "TinkerOS" | sudo tee "$ROOTFS/etc/hostname" > /dev/null
    
    # Enable services
    sudo chroot "$ROOTFS" systemctl enable tinkeros-server
    sudo chroot "$ROOTFS" systemctl enable tinkeros-desktop
    sudo chroot "$ROOTFS" systemctl enable lightdm
    sudo chroot "$ROOTFS" systemctl enable ssh
    
    echo "[*] Configuration applied"
}

build_squashfs() {
    echo "[*] Creating squashfs..."
    sudo rm -f "$ISO_DIR/casper/filesystem.squashfs"
    sudo mksquashfs "$ROOTFS" "$ISO_DIR/casper/filesystem.squashfs" -comp xz -b 1M -noappend
    
    # Calculate size
    SIZE=$(sudo du -sm "$ROOTFS" | cut -f1)
    sudo chroot "$ROOTFS" du -sx -m / | tail -1 | cut -f1 | sudo tee "$ISO_DIR/casper/filesystem.size"
    echo "[*] Squashfs created: $(sudo du -sh "$ISO_DIR/casper/filesystem.squashfs")
}

build_iso() {
    echo "[*] Building ISO..."
    # Copy kernel and initrd if not already present
    if [ ! -f "$ISO_DIR/boot/vmlinuz-6.8.0-137-generic" ]; then
        echo "[!] Kernel not found in $ISO_DIR/boot/"
    fi
    
    # Build ISO
    sudo grub-mkrescue -o "$BUILD_DIR/tinkeros.iso" "$ISO_DIR/" 2>&1
    echo "[*] ISO created: $BUILD_DIR/tinkeros.iso"
}

build_all() {
    build_rootfs
    build_squashfs
    build_iso
    echo "[+] Build complete!"
    ls -lh "$BUILD_DIR/tinkeros.iso"
}

# Main
case "${1:-all}" in
    rootfs) build_rootfs ;;
    squashfs) build_squashfs ;;
    iso) build_iso ;;
    all) build_all ;;
    *) echo "Usage: $0 {all|rootfs|squashfs|iso}"; exit 1 ;;
esac
