/**
 * Video Player Application
 * Handles video playback with Windows Media Player-like interface
 */

export class VideoPlayerWindow {
    constructor(filename, title, desktop) {
        this.filename = filename;
        this.title = title;
        this.desktop = desktop;
        this.isMinimized = false;
        this.videoElement = null;
        this.window = null;
        this.taskbarItem = null;
        
        this.createWindow();
        this.setupEventListeners();
    }

    createWindow() {
        const windowId = `video-player-${this.filename.replace(/[^a-zA-Z0-9]/g, '-')}-${++this.desktop.windowCounter}`;
        
        this.window = document.createElement('div');
        this.window.className = 'window video-player-window';
        this.window.id = windowId;
        this.window.dataset.windowType = 'video-player';
        this.window.dataset.videoFilename = this.filename;
        this.window.style.cssText = `
            position: absolute;
            top: 100px;
            left: 200px;
            width: 850px;
            height: 550px;
            background: #ece9d8;
            border: 2px outset #ece9d8;
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            display: flex;
            flex-direction: column;
        `;

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'window-title-bar';
        titleBar.style.cssText = `
            background: linear-gradient(to bottom, #0a246a, #a6caf0);
            color: white;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
        `;
        
        const titleText = document.createElement('span');
        titleText.textContent = `${this.title} - Windows Media Player`;
        titleText.style.flex = '1';
        
        const titleBarButtons = document.createElement('div');
        titleBarButtons.style.display = 'flex';
        titleBarButtons.style.gap = '2px';
        
        // Minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.innerHTML = '−';
        minimizeBtn.style.cssText = `
            width: 16px;
            height: 14px;
            border: 1px solid #666;
            background: #ece9d8;
            color: black;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            this.minimize();
        };
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            width: 16px;
            height: 14px;
            border: 1px solid #666;
            background: #ece9d8;
            color: black;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.close();
        };
        
        titleBarButtons.appendChild(minimizeBtn);
        titleBarButtons.appendChild(closeBtn);
        titleBar.appendChild(titleText);
        titleBar.appendChild(titleBarButtons);
        
        // Content area
        const content = document.createElement('div');
        content.className = 'window-content';
        content.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #ece9d8;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;
        
        // Video element
        this.videoElement = document.createElement('video');
        this.videoElement.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            width: 800px;
            height: 450px;
            background: black;
            border: 1px solid #999;
        `;
        this.videoElement.controls = true;
        this.videoElement.preload = 'metadata';
        this.videoElement.src = `./videos/${this.filename}`;
        
        // Error handling
        this.videoElement.onerror = () => {
            this.showError();
        };
        
        content.appendChild(this.videoElement);
        
        this.window.appendChild(titleBar);
        this.window.appendChild(content);
        
        document.body.appendChild(this.window);
    }

    setupEventListeners() {
        // Make window draggable
        const titleBar = this.window.querySelector('.window-title-bar');
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(this.window.style.left);
            startTop = parseInt(this.window.style.top);
            this.desktop.bringToFront(this.window);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            this.window.style.left = (startLeft + deltaX) + 'px';
            this.window.style.top = (startTop + deltaY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Keyboard controls
        this.window.addEventListener('keydown', (e) => {
            if (!this.videoElement) return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.videoElement.paused) {
                        this.videoElement.play();
                    } else {
                        this.videoElement.pause();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.videoElement.currentTime = Math.max(0, this.videoElement.currentTime - 5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.videoElement.currentTime = Math.min(this.videoElement.duration, this.videoElement.currentTime + 5);
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
            }
        });

        // Focus management
        this.window.addEventListener('click', () => {
            this.desktop.bringToFront(this.window);
        });
    }

    minimize() {
        this.isMinimized = true;
        this.window.style.display = 'none';
        if (this.taskbarItem) {
            this.taskbarItem.classList.add('minimized');
        }
    }

    restore() {
        this.isMinimized = false;
        this.window.style.display = 'flex';
        if (this.taskbarItem) {
            this.taskbarItem.classList.remove('minimized');
        }
        this.desktop.bringToFront(this.window);
    }

    close() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
        }
        
        // Remove from desktop windows array (remove the player instance, not the window)
        const index = this.desktop.windows.indexOf(this);
        if (index > -1) {
            this.desktop.windows.splice(index, 1);
        }
        
        // Remove taskbar item
        if (this.taskbarItem) {
            this.taskbarItem.remove();
        }
        
        // Remove window
        this.window.remove();
        
        // Update active window if this was active
        if (this.desktop.activeWindow === this.window) {
            this.desktop.activeWindow = this.desktop.windows[this.desktop.windows.length - 1]?.window || this.desktop.windows[this.desktop.windows.length - 1] || null;
        }
    }

    showError() {
        const content = this.window.querySelector('.window-content');
        content.innerHTML = `
            <div style="text-align: center; color: #d00; font-family: 'MS Sans Serif', sans-serif;">
                <div style="font-size: 16px; margin-bottom: 10px;">⚠️</div>
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">Windows Media Player</div>
                <div style="font-size: 12px;">Cannot play this file. The file may be corrupted or in an unsupported format.</div>
                <div style="font-size: 11px; margin-top: 10px; color: #666;">File: ${this.filename}</div>
                <button onclick="this.parentElement.parentElement.parentElement.querySelector('.close-btn').click()" 
                        style="margin-top: 15px; padding: 4px 12px; border: 1px solid #999; background: #ece9d8; cursor: pointer;">
                    OK
                </button>
            </div>
        `;
    }
}
