/**
 * Window Management Utilities
 * Handles window creation, positioning, and management
 */

export class WindowManager {
    constructor() {
        this.windowCounter = 0;
    }

    createWindow(type, id, desktop) {
        const win = document.createElement('div');
        win.className = 'window';
        win.id = id;
        
        // Set initial size and position based on window type
        if (type === 'paint') {
            // Paint window with fixed size and centered position
            const windowWidth = 760;
            const windowHeight = 640;
            const centerX = (globalThis.innerWidth - windowWidth) / 2;
            const centerY = (globalThis.innerHeight - windowHeight) / 2;
            win.style.left = Math.max(0, centerX) + 'px';
            win.style.top = Math.max(0, centerY) + 'px';
            win.style.width = windowWidth + 'px';
            win.style.height = windowHeight + 'px';
        } else if (type === 'nft-builder') {
            // Weirdos Builder window with fixed size and centered position
            const windowWidth = 760;
            const windowHeight = 640;
            const centerX = (globalThis.innerWidth - windowWidth) / 2;
            const centerY = (globalThis.innerHeight - windowHeight) / 2;
            win.style.left = Math.max(0, centerX) + 'px';
            win.style.top = Math.max(0, centerY) + 'px';
            win.style.width = windowWidth + 'px';
            win.style.height = windowHeight + 'px';
        } else if (type === 'internet-explorer') {
            // Center the Explorer window with larger size for better readability
            const windowWidth = 520; // 400px * 1.3 = 520px (30% larger)
            const windowHeight = 390; // 300px * 1.3 = 390px (30% larger)
            const centerX = (globalThis.innerWidth - windowWidth) / 2;
            const centerY = (globalThis.innerHeight - windowHeight) / 2;
            win.style.left = Math.max(0, centerX) + 'px';
            win.style.top = Math.max(0, centerY) + 'px';
            win.style.width = windowWidth + 'px';
            win.style.height = windowHeight + 'px';
        } else if (type === 'image-174') {
            // Size window to fit the image with padding
            const windowWidth = 850; // 791 + padding
            const windowHeight = 600; // Fit to screen while showing image
            const centerX = (globalThis.innerWidth - windowWidth) / 2;
            const centerY = (globalThis.innerHeight - windowHeight) / 2;
            win.style.left = Math.max(0, centerX) + 'px';
            win.style.top = Math.max(0, centerY) + 'px';
            win.style.width = windowWidth + 'px';
            win.style.height = windowHeight + 'px';
        } else {
            win.style.left = '150px';
            win.style.top = '100px';
            win.style.width = '400px';
            win.style.height = '300px';
        }

        return win;
    }

    setupWindowControls(win, desktop) {
        // Add window controls
        const minimizeBtn = win.querySelector('.minimize');
        const maximizeBtn = win.querySelector('.maximize');
        const closeBtn = win.querySelector('.close');

        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            desktop.minimizeWindow(win);
        });

        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            desktop.toggleMaximize(win);
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            desktop.closeWindow(win);
        });

        // Make window draggable
        const header = win.querySelector('.window-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-control')) return;
            desktop.startDragging(e, win);
        });

        // Make window clickable to bring to front
        win.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            desktop.bringToFront(win);
        });
    }

    getNextWindowId() {
        return `window-${++this.windowCounter}`;
    }
}
