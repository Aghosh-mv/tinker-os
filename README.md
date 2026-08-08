# Tinker OS

A custom Ubuntu-based desktop OS that boots from a live USB, installs to internal disk via GRUB, and runs a local web server (port 4040) serving a custom web-based desktop environment.

## Features

- **Live USB** - Boot from any USB stick, try without installing
- **Installer** - Partitions disk, copies rootfs, installs GRUB bootloader
- **Web Desktop** - Custom web-based desktop at localhost:4040 (anime wallpaper, glassmorphism widgets, menubar, taskbar, app grid, lock screen, spotlight search)
- **XFCE Underneath** - Window manager (xfwm4), panel (taskbar/system tray/clock), desktop icons, right-click menu, Alt+Tab, workspace switching
- **Chrome** - Opens localhost:4040 as homepage in normal mode
- **Serial Console** - Kernel serial console output on ttyS0
- **Full Desktop** - Bluetooth, WiFi, audio, Firefox, Synaptic, GParted, File Roller

## Quick Start

1. Download `tinkeros.iso` (see Releases)
2. Flash to USB: `dd if=tinkeros.iso of=/dev/sdX bs=4M status=progress && sync`
3. Boot from USB
4. Run `tinkeros-install` to install to internal disk
5. Reboot (remove USB) — GRUB loads Tinker OS automatically
6. XFCE desktop loads with Chrome open to localhost:4040

## Building from Source

### Prerequisites

- Ubuntu 24.04 host (or any Debian-based system)
- ~25GB free disk space
- Tools: `debootstrap`, `mksquashfs`, `grub-mkrescue`, `git-lfs`

```bash
# Install build dependencies
sudo apt-get install debootstrap squashfs-tools grub2-common grub-pc-bin git-lfs

# Initialize LFS
git lfs install
```

### Build Steps

```bash
# 1. Run the full build (creates rootfs, squashfs, and ISO)
sudo ./build.sh all

# OR build in stages:
./build.sh rootfs      # Debootstrap + package install + config
./build.sh squashfs    # Create filesystem.squashfs
./build.sh iso         # Build tinkeros.iso
```

### Testing in QEMU

```bash
# Create target disk and boot ISO
qemu-system-x86_64 -cdrom tinkeros.iso -hda disk.img -m 4G \
  -serial mon:stdio -enable-kvm -cpu Penryn \
  -kernel /boot/vmlinuz-6.8.0-137-generic \
  -initrd /boot/initrd.img-6.8.0-137-generic \
  -append "console=ttyS0,115200n8 boot=casper quiet"
```

## File Structure

```
.
├── build.sh                    # Complete build script
├── README.md                   # This file
├── minimal-iso/                # ISO directory structure
│   ├── boot/
│   │   ├── grub/
│   │   │   └── grub.cfg        # GRUB config (serial console, timeout)
│   │   ├── initrd.img-6.8.0-137-generic
│   │   └── vmlinuz-6.8.0-137-generic
│   └── casper/
│       ├── filesystem.size     # Size of squashfs
│       └── filesystem.squashfs # Root filesystem (LFS, ~700MB)
├── src/                        # Source configs (copied into rootfs)
│   ├── tinkeros-install        # Installer script
│   ├── tinkeros-desktop-start  # Desktop startup (Xorg + XFCE + Chrome)
│   ├── tinkeros-server.service # Node.js server systemd service
│   ├── tinkeros-desktop.service
│   ├── xfce.desktop            # XFCE session file
│   ├── xscreensaver.desktop    # Screensaver autostart
│   ├── skel-bashrc             # Default .bashrc
│   ├── skel-profile            # Default .profile
│   ├── xfce4-keyboard-shortcuts.xml
│   ├── xfce4-session.xml
│   ├── xsettings.xml
│   ├── panel-default.xml
│   ├── grub.cfg
│   └── tinkeros.png            # Wallpaper
└── tinkeros.iso                # Final ISO (~2.1GB, LFS)
```

## Packages Installed

| Category | Packages |
|----------|----------|
| Base | Ubuntu 24.04 (Noble), systemd, ssh |
| Desktop | xfce4, xfce4-goodies, xfwm4, xfdesktop4, xfce4-panel |
| Theme | arc-theme, papirus-icon-theme |
| Browser | google-chrome-stable, firefox, chromium-browser |
| Audio | alsa-utils, pulseaudio, pavucontrol |
| Network | network-manager, network-manager-gnome, bluez |
| Utils | gparted, file-roller, synaptic, xdotool, x11-utils |
| Display | xserver-xorg-core, lightdm, lightdm-gtk-greeter |
| Live | casper, lsof |

## Key Customizations

1. **Web Desktop Server** - Node.js server running on port 4040, accessed via Chrome as homepage
2. **XFCE Desktop** - Arc-Dark theme, glassmorphism wallpaper, custom panel
3. **Keyboard Shortcuts**:
   - Alt+Tab - Window switching
   - Ctrl+Alt+Left/Right - Workspace switching
   - Super+Up/Down - Window maximize/restore
   - Super+Left/Right - Window tiling
4. **Chrome Policies**: Homepage set to localhost:4040, restore on startup
5. **GRUB**: Serial console (ttyS0), 3-second timeout, boots casper
6. **Installer**: Partitions disk (GPT + ext4), copies rootfs, regenerates initramfs, installs GRUB

## License

MIT
