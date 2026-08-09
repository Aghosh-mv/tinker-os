// Tinker OS Desktop JavaScript

let activeWindows = [];
let windowCounter = 0;
let lockScreenUnlocked = false;
let searchActive = false;
let appGridActive = false;

// ===== Lock Screen =====
function initLockScreen() {
    const lockInput = document.getElementById('lockInput');
    const lockError = document.getElementById('lockError');
    
    function updateLockTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('lockTime').textContent = `${hours}:${minutes}`;
        document.getElementById('lockDate').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    setInterval(updateLockTime, 1000);
    updateLockTime();
    
    if (lockInput) {
        lockInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const password = lockInput.value;
                if (password === 'tinkeros' || password === 'password' || password === '') {
                    document.getElementById('lockScreen').style.opacity = '0';
                    setTimeout(() => {
                        document.getElementById('lockScreen').style.display = 'none';
                        lockScreenUnlocked = true;
                    }, 300);
                } else {
                    lockInput.classList.add('shake');
                    lockError.style.opacity = '1';
                    setTimeout(() => {
                        lockInput.classList.remove('shake');
                        lockInput.value = '';
                    }, 500);
                }
            }
        });
        
        lockInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                lockInput.value = '';
            }
        });
    }
}

// ===== Desktop Widgets =====
function initWidgets() {
    function updateWidgetTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        const element = document.getElementById('widgetTime');
        if (element) element.textContent = timeStr;
        const dateElement = document.getElementById('widgetDate');
        if (dateElement) dateElement.textContent = dateStr;
    }
    
    function updateTaskbarTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const element = document.getElementById('taskbarTime');
        if (element) element.textContent = timeStr;
    }
    
    setInterval(() => {
        updateWidgetTime();
        updateTaskbarTime();
    }, 1000);
    
    updateWidgetTime();
    updateTaskbarTime();
}

// ===== Spotlight Search =====
function toggleSearch() {
    const spotlight = document.getElementById('spotlight');
    if (!spotlight) return;
    
    if (searchActive) {
        spotlight.classList.remove('active');
        searchActive = false;
        setTimeout(() => {
            spotlight.style.opacity = '0';
        }, 300);
    } else {
        spotlight.classList.add('active');
        spotlight.style.opacity = '1';
        searchActive = true;
        const input = document.getElementById('spotlightInput');
        if (input) {
            input.focus();
            input.value = '';
            updateSearchResults('');
        }
    }
}

function updateSearchResults(query) {
    const results = document.getElementById('spotlightResults');
    if (!results) return;
    
    const allApps = getApps();
    const filtered = query 
        ? allApps.filter(app => app.name.toLowerCase().includes(query.toLowerCase()))
        : allApps.slice(0, 6);
    
    results.innerHTML = filtered.map(app => `
        <div class="spotlight-result" onclick="openApp('${app.id}'); toggleSearch();">
            <span class="result-icon">${app.icon}</span>
            <span class="result-info">${app.name}</span>
        </div>
    `).join('');
}

// ===== App Grid =====
function openAppGrid() {
    const grid = document.getElementById('appGrid');
    if (!grid) return;
    
    grid.classList.add('active');
    grid.style.opacity = '1';
    appGridActive = true;
}

function closeAppGrid() {
    const grid = document.getElementById('appGrid');
    if (!grid) return;
    
    grid.classList.remove('active');
    setTimeout(() => {
        grid.style.opacity = '0';
    }, 300);
    appGridActive = false;
}

// ===== App Management =====
function getApps() {
    return [
        { id: 'finder', name: 'Files', icon: '📁' },
        { id: 'browser', name: 'Chrome', icon: '🌐' },
        { id: 'terminal', name: 'Terminal', icon: '💻' },
        { id: 'settings', name: 'Settings', icon: '⚙️' },
    ];
}

function openApp(appId) {
    const app = getApps().find(a => a.id === appId);
    if (!app) return;
    
    // Close app grid if open
    closeAppGrid();
    toggleSearch();
    
    switch(appId) {
        case 'finder':
            openWindow('Files', '📁', 200, 150, 800, 500, 'files');
            break;
        case 'browser':
            openWindow('Chrome', '🌐', 100, 100, 1000, 600, 'browser');
            break;
        case 'terminal':
            openWindow('Terminal', '💻', 150, 150, 600, 400, 'terminal');
            break;
        case 'settings':
            openWindow('Settings', '⚙️', 300, 200, 600, 400, 'settings');
            break;
    }
}

// ===== Window Manager =====
function openWindow(title, icon, x, y, width, height, type) {
    const windows = document.getElementById('windows');
    if (!windows) return;
    
    windowCounter++;
    const winId = 'win-' + windowCounter;
    
    const win = document.createElement('div');
    win.className = 'window';
    win.id = winId;
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.dataset.winType = type;
    win.style.zIndex = String(10 + windowCounter);
    
    win.innerHTML = `
        <div class="window-header" id="${winId}-header">
            <div class="window-title">${icon} ${title}</div>
            <div class="window-controls">
                <div class="window-button" onclick="minimizeWindow('${winId}')">_</div>
                <div class="window-button" onclick="maximizeWindow('${winId}')">□</div>
                <div class="window-button" onclick="closeWindow('${winId}')">×</div>
            </div>
        </div>
        <div class="window-body" id="${winId}-body"></div>
    `;
    
    windows.appendChild(win);
    activeWindows.push({ id: winId, title, type });
    
    // Render window content based on type
    setTimeout(() => renderWindowContent(winId, type), 50);
    
    // Setup drag
    let isDragging = false;
    let offsetX, offsetY;
    
    const header = document.getElementById(`${winId}-header`);
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - parseInt(win.style.left);
        offsetY = e.clientY - parseInt(win.style.top);
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            win.style.left = (e.clientX - offsetX) + 'px';
            win.style.top = (e.clientY - offsetY) + 'px';
            win.style.zIndex = String(100 + windowCounter);
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    win.addEventListener('mousedown', () => {
        win.style.zIndex = String(100 + windowCounter);
    });
    
    // Add to taskbar
    updateTaskbar();
}

function renderWindowContent(winId, type) {
    const body = document.getElementById(`${winId}-body`);
    if (!body) return;
    
    body.classList.add(`${type}-window`);
    
    switch(type) {
        case 'files':
            body.innerHTML = `
                <div class="files-toolbar">
                    <input type="text" class="files-toolbar-input" placeholder="Search files..." readonly>
                </div>
                <div class="files-content">
                    <p style="opacity:0.5">📂 No files to show. This is a desktop simulation.</p>
                </div>
            `;
            break;
        case 'browser':
            body.innerHTML = `
                <div class="browser-toolbar">
                    <button onclick="window.history.back()">◀</button>
                    <button onclick="window.history.forward()">▶</button>
                    <button onclick="location.reload()">↻</button>
                    <input type="text" class="browser-url" value="https://google.com" readonly>
                </div>
                <iframe class="browser-frame" src="https://google.com"></iframe>
            `;
            break;
        case 'terminal':
            body.innerHTML = `
                <div class="terminal-output" id="terminal-output">
                    <div>tinkerspace@tinker-os:~$ </div>
                    <div>Welcome to Tinker OS v1.0</div>
                    <div>Type 'help' for available commands.</div>
                    <div>tinkerspace@tinker-os:~$ </div>
                </div>
                <input type="text" class="terminal-input" id="terminal-input" placeholder="tinkerspace@tinker-os:~$" autofocus>
            `;
            const terminalInput = body.querySelector('#terminal-input');
            const terminalOutput = body.querySelector('#terminal-output');
            if (terminalInput) {
                terminalInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const cmd = e.target.value;
                        terminalOutput.innerHTML += `<div>tinkerspace@tinker-os:~$ ${cmd}</div>`;
                        if (cmd === 'help') {
                            terminalOutput.innerHTML += `<div>Available: help, clear, whoami, uname, date</div>`;
                        } else if (cmd === 'whoami') {
                            terminalOutput.innerHTML += `<div>tinkerspace</div>`;
                        } else if (cmd === 'uname') {
                            terminalOutput.innerHTML += `<div>Linux tinker-os 6.8.0-137-generic</div>`;
                        } else if (cmd === 'date') {
                            terminalOutput.innerHTML += `<div>${new Date().toUTCString()}</div>`;
                        } else if (cmd === 'clear') {
                            terminalOutput.innerHTML = '';
                        }
                        terminalOutput.innerHTML += `<div>tinkerspace@tinker-os:~$ </div>`;
                        e.target.value = '';
                    }
                });
            }
            // Make terminal output scrollable
            const terminalWin = document.getElementById(winId);
            if (terminalWin) {
                const termBody = terminalWin.querySelector('.window-body');
                if (termBody) {
                    termBody.style.overflow = 'hidden';
                }
            }
            break;
        case 'settings':
            body.innerHTML = `
                <div class="settings-grid">
                    <div class="settings-item" onclick="alert('Sound Settings')">🔊 Sound</div>
                    <div class="settings-item" onclick="alert('Network Settings')">🌐 Network</div>
                    <div class="settings-item" onclick="alert('Display Settings')">🖥️ Display</div>
                    <div class="settings-item" onclick="alert('Keyboard Settings')">⌨️ Keyboard</div>
                    <div class="settings-item" onclick="alert('Bluetooth Settings')">🔵 Bluetooth</div>
                    <div class="settings-item" onclick="alert('About Tinker OS')">ℹ️ About</div>
                </div>
            `;
            break;
    }
}

function minimizeWindow(winId) {
    const win = document.getElementById(winId);
    if (win) win.style.display = 'none';
}

function maximizeWindow(winId) {
    const win = document.getElementById(winId);
    if (!win) return;
    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
    } else {
        win.classList.add('maximized');
    }
}

function closeWindow(winId) {
    const win = document.getElementById(winId);
    if (win) win.remove();
    activeWindows = activeWindows.filter(w => w.id !== winId);
    updateTaskbar();
}

function updateTaskbar() {
    const center = document.getElementById('taskbarCenter');
    if (!center) return;
    
    center.innerHTML = activeWindows.map(w => `
        <div class="taskbar-app active" onclick="bringToFront('${w.id}')">${getAppIcon(w.type)} ${w.title}</div>
    `).join('');
}

function bringToFront(winId) {
    const win = document.getElementById(winId);
    if (win) {
        win.style.zIndex = String(200 + windowCounter);
        win.style.display = 'block';
    }
}

function getAppIcon(type) {
    const icons = {
        'files': '📁',
        'browser': '🌐',
        'terminal': '💻',
        'settings': '⚙️'
    };
    return icons[type] || '📱';
}

// ===== WiFi & Audio Toggle =====
let wifiOpen = false;
let powerOpen = false;

function toggleWifi() {
    if (wifiOpen) {
        wifiOpen = false;
        // Simple toggle notification
        alert('WiFi: Connected to TinkerNet');
    } else {
        wifiOpen = true;
        alert('WiFi: Connected to TinkerNet');
    }
}

function toggleAudio() {
    alert('Audio: 75%');
}

function togglePower() {
    const power = confirm('Power options:\n\nRestart / Shutdown / Lock');
    if (power) {
        alert('System will lock in demo mode');
    }
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
    // Spotlight: Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }
    
    // App Grid: Cmd+Space or Alt+Home
    if ((e.metaKey || e.altKey) && (e.key === ' ' || e.key === 'Home')) {
        e.preventDefault();
        openAppGrid();
    }
    
    // Close App: Cmd+W
    if (e.metaKey && e.key === 'w') {
        if (activeWindows.length > 0) {
            closeWindow(activeWindows[activeWindows.length - 1].id);
        }
    }
    
    // Minimize: Cmd+M
    if (e.metaKey && e.key === 'm') {
        if (activeWindows.length > 0) {
            minimizeWindow(activeWindows[activeWindows.length - 1].id);
        }
    }
    
    // Lock: Cmd+L
    if (e.metaKey && e.key === 'l') {
        lockScreen();
    }
    
    // Escape: Close search/grid
    if (e.key === 'Escape') {
        if (searchActive) toggleSearch();
        else if (appGridActive) closeAppGrid();
    }
});

function lockScreen() {
    const lockScreen = document.getElementById('lockScreen');
    if (lockScreen) {
        lockScreen.style.display = 'block';
        setTimeout(() => {
            lockScreen.style.opacity = '1';
        }, 10);
        const input = document.getElementById('lockInput');
        if (input) input.focus();
    }
}

// ===== Spotlight Input Handler =====
document.addEventListener('DOMContentLoaded', () => {
    const spotlightInput = document.getElementById('spotlightInput');
    if (spotlightInput) {
        spotlightInput.addEventListener('input', (e) => {
            updateSearchResults(e.target.value);
        });
    }
    
    // Initialize
    initLockScreen();
    initWidgets();
    
    // Auto-unlock for demo
    setTimeout(() => {
        document.getElementById('lockScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('lockScreen').style.display = 'none';
        }, 300);
    }, 100);
});

// Export for global access
window.openApp = openApp;
window.openAppGrid = openAppGrid;
window.closeAppGrid = closeAppGrid;
window.toggleSearch = toggleSearch;
window.toggleWifi = toggleWifi;
window.toggleAudio = toggleAudio;
window.togglePower = togglePower;
window.lockScreen = lockScreen;
window.minimizeWindow = minimizeWindow;
window.maximizeWindow = maximizeWindow;
window.closeWindow = closeWindow;
window.bringToFront = bringToFront;
