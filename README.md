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

## Building

### Prerequisites

- Ubuntu 24.04 host
- ~5GB free disk space
- `squashfs-tools`, `grub-pc-bin`, `grub-common`, `grub2-common`

### Build Steps

```bash
# 1. Build the rootfs
sudo bash build-rootfs.sh   # Debootstrap + package install + config

# 2. Create squashfs
sudo mksquashfs rootfs/ filesystem.squashfs -comp xz -b 1M

# 3. Create ISO
grub-mkrescue -o tinkeros.iso minimal-iso/
```

### Testing

```bash
# Boot ISO in QEMU
qemu-system-x86_64 -cdrom tinkeros.iso -hda disk.img -m 4G \
  -serial mon:stdio -kernel /boot/vmlinuz-6.8.0-137-generic \
  -initrd /boot/initrd.img-6.8.0-137-generic \
  -append "console=ttyS0,115200n8 boot=casper quiet"
```

## File Structure

```
src/
├── tinkeros-install          # Installer script (run on live USB)
├── tinkeros-desktop-start    # Desktop startup script (Xorg + XFCE + Chrome)
├── tinkeros-server.service   # Node.js server systemd service
├── tinkeros-desktop.service  # Desktop systemd service
├── xfce.desktop              # XFCE session file
├── xscreensaver.desktop      # Screensaver autostart
├── skel-bashrc               # Default .bashrc
├── skel-profile              # Default .profile
└── tinkeros.png              # Wallpaper
```

## Usage

1. Flash `tinkeros.iso` to USB using `dd` or Etcher
2. Boot from USB
3. Run `tinkeros-install` to install to internal disk
4. Reboot — GRUB will load Tinker OS automatically
5. XFCE desktop loads with Chrome open to localhost:4040

## License

MIT
