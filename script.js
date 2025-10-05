class WindowsXPDesktop {
    constructor() {
        this.windows = [];
        this.activeWindow = null;
        this.windowCounter = 0;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isResizing = false;
        this.resizeHandle = null;
        
        this.init();
        this.createAlwaysOpenChatWindow();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.setupDesktopIcons();
        this.setupStartMenu();
        this.setupContextMenu();
        
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
    }

    createAlwaysOpenChatWindow() {
        // Create the Chat window that's always open and can't be closed
        const windowId = `window-chat-always-open`;
        const chatWindow = this.createWindow('chat', windowId);
        chatWindow.dataset.windowType = 'chat';
        chatWindow.dataset.alwaysOpen = 'true'; // Mark as always open
        
        // Position it in the top-right corner
        chatWindow.style.left = (globalThis.innerWidth - 400) + 'px'; // 400px is default window width
        chatWindow.style.top = '50px';
        chatWindow.style.zIndex = '50'; // Lower z-index to keep it in background
        
        // Remove the close button
        const closeBtn = chatWindow.querySelector('.close');
        if (closeBtn) {
            closeBtn.style.display = 'none';
        }
        
        // Add to windows array and taskbar
        this.windows.push(chatWindow);
        this.addToTaskbar(chatWindow);
        
        // Initialize the Chat application
        setTimeout(() => {
            const chatApp = new ChatApplication();
            chatApp.init(chatWindow);
        }, 100);
    }

    setupEventListeners() {
        // Start button
        document.getElementById('start-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStartMenu();
        });

        // Desktop click to close menus
        document.getElementById('desktop').addEventListener('click', () => {
            this.hideStartMenu();
            this.hideContextMenu();
            this.deselectAllIcons();
        });

        // Prevent context menu on desktop
        document.getElementById('desktop').addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Window management
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    setupDesktopIcons() {
        const icons = document.querySelectorAll('.desktop-icon');
        icons.forEach(icon => {
            icon.addEventListener('dblclick', () => {
                const windowType = icon.dataset.window;
                this.openWindow(windowType);
            });

            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectIcon(icon);
            });

            icon.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu(e, icon);
            });
        });
    }

    setupStartMenu() {
        const startMenuItems = document.querySelectorAll('.start-menu-item');
        startMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                const windowType = item.dataset.window;
                this.openWindow(windowType);
                this.hideStartMenu();
            });
        });
    }

    setupContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        const contextMenuItems = contextMenu.querySelectorAll('.context-menu-item');
        
        contextMenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                this.handleContextMenuAction(action);
                this.hideContextMenu();
            });
        });
    }

    openWindow(type) {
        // Check if a window of this type already exists
        const existingWindow = this.windows.find(w => w.dataset.windowType === type);
        
        if (existingWindow) {
            // Window already exists, just bring it to front
            this.bringToFront(existingWindow);
            return;
        }
        
        // Don't create new Chat windows since we have the always-open one
        if (type === 'chat') {
            return;
        }
        
        // Create new window if none exists
        const windowId = `window-${++this.windowCounter}`;
        const window = this.createWindow(type, windowId);
        window.dataset.windowType = type; // Store the window type for future reference
        this.windows.push(window);
        this.activeWindow = window;
        this.addToTaskbar(window);
        this.bringToFront(window);
    }

    createWindow(type, id) {
        const win = document.createElement('div');
        win.className = 'window';
        win.id = id;
        
        // Set initial size and position based on window type
        if (type === 'paint') {
            // Center the Paint window with proper size for canvas and tools
            const centerX = (globalThis.innerWidth - 600) / 2;
            const centerY = (globalThis.innerHeight - 600) / 2;
            win.style.left = Math.max(0, centerX) + 'px';
            win.style.top = Math.max(0, centerY) + 'px';
            win.style.width = '600px';
            win.style.height = '600px';
        } else if (type === 'nft-builder') {
            // Center the NFT Builder window with proper size for 500x500 canvas + controls
            const centerX = (globalThis.innerWidth - 900) / 2;
            const centerY = (globalThis.innerHeight - 700) / 2;
            win.style.left = Math.max(0, centerX) + 'px';
            win.style.top = Math.max(0, centerY) + 'px';
            win.style.width = '900px';
            win.style.height = '700px';
        } else {
            win.style.left = '100px';
            win.style.top = '100px';
            win.style.width = '400px';
            win.style.height = '300px';
        }

        const windowData = this.getWindowData(type);
        
        // Determine if this window needs special content handling
        const needsNoPadding = type === 'paint' || type === 'nft-builder';
        const contentClass = needsNoPadding ? 'window-content no-padding' : 'window-content';
        
        win.innerHTML = `
            <div class="window-header">
                <div class="window-title">${windowData.title}</div>
                <div class="window-controls">
                    <div class="window-control minimize" title="Minimize">_</div>
                    <div class="window-control maximize" title="Maximize">□</div>
                    <div class="window-control close" title="Close">×</div>
                </div>
            </div>
            <div class="${contentClass}">
                ${windowData.content}
            </div>
        `;

        // Add window controls
        const minimizeBtn = win.querySelector('.minimize');
        const maximizeBtn = win.querySelector('.maximize');
        const closeBtn = win.querySelector('.close');

        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(win);
        });

        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximize(win);
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(win);
        });

        // Make window draggable
        const header = win.querySelector('.window-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-control')) return;
            this.startDragging(e, win);
        });

        // Make window clickable to bring to front
        win.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.bringToFront(win);
        });

        document.body.appendChild(win);
        
                // Initialize Paint application if this is a Paint window
                if (type === 'paint') {
                    setTimeout(() => {
                        const canvas = win.querySelector('#paint-canvas');
                        if (canvas) {
                            const paintApp = new PaintApplication();
                            paintApp.init(canvas);
                        }
                    }, 100); // Small delay to ensure DOM is ready
                }
                
                // Initialize Chat application if this is a Chat window
                if (type === 'chat') {
                    setTimeout(() => {
                        const chatWindow = win;
                        if (chatWindow) {
                            const chatApp = new ChatApplication();
                            chatApp.init(chatWindow);
                        }
                    }, 100); // Small delay to ensure DOM is ready
                }
                
                // Initialize NFT Builder application if this is an NFT Builder window
                if (type === 'nft-builder') {
                    setTimeout(() => {
                        const nftWindow = win;
                        if (nftWindow) {
                            const nftApp = new NFTBuilderApplication();
                            nftApp.init(nftWindow);
                        }
                    }, 100); // Small delay to ensure DOM is ready
                }
        
        return win;
    }

    getWindowData(type) {
        const windowData = {
            'my-computer': {
                title: 'My Computer',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <h3>My Computer</h3>
                        <p>Welcome to Windows XP Desktop Emulator!</p>
                        <p>This is a JavaScript recreation of the classic Windows XP interface.</p>
                        <div style="margin-top: 20px;">
                            <div style="display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; cursor: pointer;">
                                <div style="width: 32px; height: 32px; background: #007AFF; margin: 0 auto 5px;"></div>
                                <span>Local Disk (C:)</span>
                            </div>
                            <div style="display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; cursor: pointer;">
                                <div style="width: 32px; height: 32px; background: #007AFF; margin: 0 auto 5px;"></div>
                                <span>CD Drive (D:)</span>
                            </div>
                        </div>
                    </div>
                `
            },
            'recycle-bin': {
                title: 'Recycle Bin',
                content: `
                    <div style="padding: 20px; text-align: center;">
                        <h3>Recycle Bin</h3>
                        <p>The Recycle Bin is empty.</p>
                        <p>Items you delete from your computer are moved to the Recycle Bin.</p>
                    </div>
                `
            },
            'my-documents': {
                title: 'My Documents',
                content: `
                    <div style="padding: 20px;">
                        <h3>My Documents</h3>
                        <p>This folder contains your personal documents.</p>
                        <div style="margin-top: 20px;">
                            <div style="padding: 5px; border-bottom: 1px solid #ccc;">📄 My File.txt</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc;">📄 Document.doc</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc;">📁 My Pictures</div>
                        </div>
                    </div>
                `
            },
            'internet-explorer': {
                title: 'Internet Explorer',
                content: `
                    <div style="padding: 20px;">
                        <h3>Internet Explorer</h3>
                        <p>Welcome to Internet Explorer!</p>
                        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; background: white;">
                            <p>This is a simulated web browser window.</p>
                            <p>In a real implementation, this would load web pages.</p>
                        </div>
                    </div>
                `
            },
            'notepad': {
                title: 'Untitled - Notepad',
                content: `
                    <div style="padding: 0; height: 100%;">
                        <textarea style="width: 100%; height: 100%; border: none; padding: 8px; font-family: 'Courier New', monospace; font-size: 12px; resize: none;" placeholder="Type your text here...">Welcome to Notepad!

This is a simple text editor simulation.

You can type anything you want here.

Features:
- Text editing
- Save functionality (simulated)
- Classic Windows XP look and feel

Enjoy your nostalgic Windows XP experience!</textarea>
                    </div>
                `
            },
                    'paint': {
                        title: 'Untitled - Paint',
                        content: `
                            <div style="padding: 8px; height: calc(100% - 24px); display: flex; flex-direction: column; overflow: hidden;">
                                <!-- Toolbar -->
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 4px; background: #f0f0f0; border: 1px solid #ccc; flex-shrink: 0;">
                                    <button id="paint-brush-tool" class="paint-tool-btn active" data-tool="brush" style="padding: 4px 8px; border: 1px solid #999; background: #e0e0e0; cursor: pointer;">🖌️ Brush</button>
                                    <button id="paint-eraser-tool" class="paint-tool-btn" data-tool="eraser" style="padding: 4px 8px; border: 1px solid #999; background: #e0e0e0; cursor: pointer;">🧽 Eraser</button>
                                    
                                    <div style="width: 1px; height: 20px; background: #999; margin: 0 4px;"></div>
                                    
                                    <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                                        Color:
                                        <input type="color" id="paint-color-picker" value="#000000" style="width: 24px; height: 20px; border: 1px solid #999; cursor: pointer;">
                                    </label>
                                    
                                    <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                                        Size:
                                        <select id="paint-brush-size" style="padding: 2px; border: 1px solid #999; font-size: 11px;">
                                            <option value="2">Thin</option>
                                            <option value="4" selected>Medium</option>
                                            <option value="8">Thick</option>
                                        </select>
                                    </label>
                                    
                                    <div style="width: 1px; height: 20px; background: #999; margin: 0 4px;"></div>
                                    
                                    <button id="paint-clear-btn" style="padding: 4px 8px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;">Clear</button>
                                    <button id="paint-export-btn" style="padding: 4px 8px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;">Export PNG</button>
                                </div>
                                
                                <!-- Canvas Container -->
                                <div style="flex: 1; display: flex; justify-content: center; align-items: center; background: #f5f5f5; border: 1px solid #ccc; min-height: 0;">
                                    <canvas id="paint-canvas" width="500" height="500" style="border: 1px solid #999; cursor: crosshair; background: white;"></canvas>
                                </div>
                            </div>
                        `
                    },
                    'chat': {
                        title: 'Chat',
                        content: `
                            <div style="padding: 8px; height: 100%; display: flex; flex-direction: column;">
                                <!-- Chat Messages Area -->
                                <div id="chat-messages" style="flex: 1; border: 1px solid #999; background: white; padding: 8px; overflow-y: auto; margin-bottom: 8px; font-family: 'Courier New', monospace; font-size: 12px;">
                                    <div style="color: #666; font-style: italic;">Welcome to Chat! Type a message below and press Enter or click Send.</div>
                                </div>
                                
                                <!-- Chat Input Area -->
                                <div style="display: flex; gap: 4px;">
                                    <input type="text" id="chat-input" placeholder="Type your message here..." style="flex: 1; padding: 4px; border: 1px solid #999; font-family: 'Courier New', monospace; font-size: 12px;">
                                    <button id="chat-send-btn" style="padding: 4px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;">Send</button>
                                    <button id="chat-clear-btn" style="padding: 4px 8px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;">Clear</button>
                                </div>
                            </div>
                        `
                    },
                    'nft-builder': {
                        title: 'NFT Builder',
                        content: `
                            <div style="padding: 8px; height: calc(100% - 24px); display: flex; flex-direction: column; overflow: hidden;">
                                <!-- Main Content Area -->
                                <div style="display: flex; flex: 1; gap: 12px; margin-bottom: 8px; min-height: 0;">
                                    <!-- Left Side - Canvas -->
                                    <div style="flex: 0 0 auto; display: flex; flex-direction: column; min-width: 0;">
                                        <div style="text-align: center; margin-bottom: 6px; font-size: 11px; font-weight: bold; color: #333;">NFT Preview</div>
                                        <div style="border: 2px solid #999; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #666; border-bottom: 2px solid #666; background: #f0f0f0; padding: 8px; display: flex; justify-content: center; align-items: center;">
                                            <canvas id="nft-canvas" width="500" height="500" style="border: 1px solid #ccc; background: white;"></canvas>
                                        </div>
                                    </div>
                                    
                                    <!-- Right Side - Category Cards + Export Button -->
                                    <div style="flex: 0 0 150px; display: flex; flex-direction: column; min-width: 0;">
                                        <div style="text-align: center; margin-bottom: 6px; font-size: 11px; font-weight: bold; color: #333;">Categories</div>
                                        <div id="category-buttons" style="display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; padding-right: 4px; margin-bottom: 8px;">
                                            <!-- Category buttons will be generated here -->
                                        </div>
                                        
                                        <!-- Export Button -->
                                        <div style="flex: 0 0 auto;">
                                            <button id="nft-export-btn" style="width: 100%; padding: 8px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px; text-align: left;">💾 Export NFT</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Bottom Toolbar -->
                                <div style="display: flex; align-items: center; padding: 8px; border-top: 1px solid #ccc; flex-shrink: 0; background: #f0f0f0;">
                                    <!-- Left: Clear All + Randomize + Progress Bar -->
                                    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                                        <button id="nft-clear-btn" style="padding: 6px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;">🗑️ Clear All</button>
                                        <button id="nft-randomize-btn" style="padding: 6px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;">🎲 Randomize</button>
                                        
                                        <!-- Progress Bar inline -->
                                        <div style="display: flex; align-items: center; gap: 8px; margin-left: 16px;">
                                            <div style="width: 150px; height: 16px; border: 1px solid #999; background: #fff; position: relative;">
                                                <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(to right, #4CAF50 0%, #8BC34A 100%); transition: width 0.3s ease;"></div>
                                            </div>
                                            <span id="progress-text" style="font-size: 11px; color: #333; font-weight: bold;">0/7 traits selected</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Trait Selector Modal (hidden by default) -->
                                <div id="trait-selector-modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 300px; background: #ece9d8; border: 2px solid #999; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #666; border-bottom: 2px solid #666; display: none; z-index: 1000;">
                                    <div style="height: 24px; background: linear-gradient(to bottom, #0a2463 0%, #1e3a8a 50%, #0a2463 100%); display: flex; align-items: center; padding: 0 8px; color: white; font-size: 11px; font-weight: bold;">
                                        <span id="modal-title">Select Trait</span>
                                        <div style="margin-left: auto; width: 16px; height: 14px; background: #c0c0c0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #000;" onclick="document.getElementById('trait-selector-modal').style.display='none';">×</div>
                                    </div>
                                    <div id="trait-grid" style="padding: 8px; height: calc(100% - 24px); overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 4px;">
                                        <!-- Trait thumbnails will be generated here -->
                                    </div>
                                </div>
                            </div>
                        `
                    }
        };

        return windowData[type] || { title: 'Unknown', content: '<p>Unknown window type</p>' };
    }

    addToTaskbar(window) {
        const taskbarCenter = document.getElementById('taskbar-center');
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        taskbarItem.textContent = window.querySelector('.window-title').textContent;
        taskbarItem.dataset.windowId = window.id;
        
        taskbarItem.addEventListener('click', () => {
            // If window is minimized, restore it first
            if (window.style.display === 'none') {
                this.restoreWindow(window);
            }
            this.bringToFront(window);
        });

        taskbarCenter.appendChild(taskbarItem);
    }

    removeFromTaskbar(window) {
        const taskbarItem = document.querySelector(`[data-window-id="${window.id}"]`);
        if (taskbarItem) {
            taskbarItem.remove();
        }
    }

    bringToFront(window) {
        // Remove active class from all windows
        this.windows.forEach(w => {
            w.style.zIndex = '100';
            const taskbarItem = document.querySelector(`[data-window-id="${w.id}"]`);
            if (taskbarItem) taskbarItem.classList.remove('active');
        });

        // Bring selected window to front
        window.style.zIndex = '200';
        this.activeWindow = window;
        
        const taskbarItem = document.querySelector(`[data-window-id="${window.id}"]`);
        if (taskbarItem) taskbarItem.classList.add('active');
    }

    minimizeWindow(window) {
        window.style.display = 'none';
        const taskbarItem = document.querySelector(`[data-window-id="${window.id}"]`);
        if (taskbarItem) taskbarItem.classList.remove('active');
    }

    restoreWindow(window) {
        window.style.display = 'block';
        const taskbarItem = document.querySelector(`[data-window-id="${window.id}"]`);
        if (taskbarItem) taskbarItem.classList.add('active');
    }

    toggleMaximize(window) {
        window.classList.toggle('maximized');
        const maximizeBtn = window.querySelector('.maximize');
        maximizeBtn.textContent = window.classList.contains('maximized') ? '❐' : '□';
    }

    closeWindow(window) {
        // Prevent closing the always-open Chat window
        if (window.dataset.alwaysOpen === 'true') {
            return;
        }
        
        window.remove();
        this.removeFromTaskbar(window);
        this.windows = this.windows.filter(w => w.id !== window.id);
        if (this.activeWindow === window) {
            this.activeWindow = this.windows.length > 0 ? this.windows[this.windows.length - 1] : null;
        }
    }

    startDragging(e, window) {
        this.isDragging = true;
        this.activeWindow = window;
        this.bringToFront(window);
        
        const rect = window.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
    }

    handleMouseDown(e) {
        // Handle window dragging
        if (e.target.closest('.window-header') && !e.target.classList.contains('window-control')) {
            const window = e.target.closest('.window');
            if (window) {
                this.startDragging(e, window);
            }
        }
    }

    handleMouseMove(e) {
        if (this.isDragging && this.activeWindow) {
            const newX = e.clientX - this.dragOffset.x;
            const newY = e.clientY - this.dragOffset.y;
            
            // Keep window within bounds
            const maxX = window.innerWidth - this.activeWindow.offsetWidth;
            const maxY = window.innerHeight - this.activeWindow.offsetHeight - 30; // Account for taskbar
            
            this.activeWindow.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
            this.activeWindow.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    toggleStartMenu() {
        const startMenu = document.getElementById('start-menu');
        startMenu.style.display = startMenu.style.display === 'none' ? 'block' : 'none';
    }

    hideStartMenu() {
        document.getElementById('start-menu').style.display = 'none';
    }

    selectIcon(icon) {
        this.deselectAllIcons();
        icon.classList.add('selected');
    }

    deselectAllIcons() {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.classList.remove('selected');
        });
    }

    showContextMenu(e, icon) {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.dataset.targetIcon = icon.dataset.window;
    }

    hideContextMenu() {
        document.getElementById('context-menu').style.display = 'none';
    }

    handleContextMenuAction(action) {
        const contextMenu = document.getElementById('context-menu');
        const targetIcon = contextMenu.dataset.targetIcon;
        
        switch (action) {
            case 'open':
                this.openWindow(targetIcon);
                break;
            case 'explore':
                this.openWindow(targetIcon);
                break;
            case 'delete':
                // Simulate delete action
                alert('Delete functionality would be implemented here');
                break;
            case 'rename':
                // Simulate rename action
                const newName = prompt('Enter new name:');
                if (newName) {
                    const icon = document.querySelector(`[data-window="${targetIcon}"] span`);
                    if (icon) icon.textContent = newName;
                }
                break;
            case 'properties':
                alert('Properties dialog would open here');
                break;
        }
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        document.getElementById('time-display').textContent = timeString;
    }
}

// Paint Application Class
class PaintApplication {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.currentSize = 4;
        this.lastX = 0;
        this.lastY = 0;
        this.devicePixelRatio = window.devicePixelRatio || 1;
    }

    init(canvas) {
        this.canvas = canvas;
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Set up HiDPI support
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = 500 * this.devicePixelRatio;
        this.canvas.height = 500 * this.devicePixelRatio;
        this.canvas.style.width = '500px';
        this.canvas.style.height = '500px';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    setupEventListeners() {
        // Tool selection
        document.getElementById('paint-brush-tool').addEventListener('click', () => {
            this.selectTool('brush');
        });

        document.getElementById('paint-eraser-tool').addEventListener('click', () => {
            this.selectTool('eraser');
        });

        // Color picker
        document.getElementById('paint-color-picker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });

        // Brush size
        document.getElementById('paint-brush-size').addEventListener('change', (e) => {
            this.currentSize = parseInt(e.target.value);
        });

        // Clear button
        document.getElementById('paint-clear-btn').addEventListener('click', () => {
            this.clearCanvas();
        });

        // Export button
        document.getElementById('paint-export-btn').addEventListener('click', () => {
            this.exportCanvas();
        });

        // Canvas drawing events
        this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('pointermove', (e) => this.draw(e));
        this.canvas.addEventListener('pointerup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('pointerleave', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('pointercancel', (e) => this.stopDrawing(e));
    }

    selectTool(tool) {
        this.currentTool = tool;
        
        // Update button states
        document.querySelectorAll('.paint-tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`paint-${tool}-tool`).classList.add('active');
    }

    getPointerPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.canvas.setPointerCapture(e.pointerId);
        
        const pos = this.getPointerPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Draw initial dot for click without movement
        this.drawDot(pos.x, pos.y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getPointerPos(e);
        this.drawLine(this.lastX, this.lastY, pos.x, pos.y);
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing(e) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.canvas.releasePointerCapture(e.pointerId);
        }
    }

    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.currentSize;
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentSize;
        }
        
        this.ctx.stroke();
        this.ctx.globalCompositeOperation = 'source-over'; // Reset for next operation
    }

    drawDot(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.currentSize / 2, 0, Math.PI * 2);
        
        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = this.currentColor;
        }
        
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over'; // Reset for next operation
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, 500, 500);
    }

    exportCanvas() {
        const link = document.createElement('a');
        link.download = 'paint-drawing.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// Chat Application Class
class ChatApplication {
    constructor() {
        this.messagesContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.clearButton = null;
        this.storageKey = 'windowsxp_chat_history';
    }

    init(chatWindow) {
        this.messagesContainer = chatWindow.querySelector('#chat-messages');
        this.inputField = chatWindow.querySelector('#chat-input');
        this.sendButton = chatWindow.querySelector('#chat-send-btn');
        this.clearButton = chatWindow.querySelector('#chat-clear-btn');
        
        this.setupEventListeners();
        this.loadChatHistory();
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key in input field
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Clear button
        this.clearButton.addEventListener('click', () => {
            this.clearChat();
        });
    }

    sendMessage() {
        const message = this.inputField.value.trim();
        if (message) {
            this.addMessage(message, 'user');
            this.inputField.value = '';
            this.saveChatHistory();
        }
    }

    addMessage(text, sender = 'user') {
        const messageDiv = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString();
        
        if (sender === 'user') {
            messageDiv.innerHTML = `<span style="color: #0000FF;">[${timestamp}] You:</span> ${text}`;
        } else {
            messageDiv.innerHTML = `<span style="color: #008000;">[${timestamp}] System:</span> ${text}`;
        }
        
        messageDiv.style.marginBottom = '4px';
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    clearChat() {
        if (confirm('Are you sure you want to clear all chat messages?')) {
            this.messagesContainer.innerHTML = '<div style="color: #666; font-style: italic;">Chat cleared. Welcome to Chat!</div>';
            this.saveChatHistory();
        }
    }

    saveChatHistory() {
        const messages = this.messagesContainer.innerHTML;
        localStorage.setItem(this.storageKey, messages);
    }

    loadChatHistory() {
        const savedMessages = localStorage.getItem(this.storageKey);
        if (savedMessages) {
            this.messagesContainer.innerHTML = savedMessages;
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
}

// NFT Builder Application Class
class NFTBuilderApplication {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.categoryButtons = null;
        this.randomizeBtn = null;
        this.clearBtn = null;
        this.exportBtn = null;
        this.traitModal = null;
        this.traitGrid = null;
        this.modalTitle = null;
        
        // Layer order from bottom to top
        this.layerOrder = ['Background', 'Shirt', 'Accessory', 'Skin', 'Eyes', 'Mask', 'Xx'];
        
        // Current selections for each category
        this.selectedTraits = {
            'Background': null,
            'Shirt': null,
            'Accessory': null,
            'Skin': null,
            'Eyes': null,
            'Mask': null,
            'Xx': null
        };
        
        // Available traits for each category
        this.availableTraits = {
            'Background': ['3am.png', 'asylum.png', 'beach.png', 'calm.png', 'fire.png', 'genesis.png', 'mempool.png', 'moonlight.png', 'mountain.png', 'nature.png', 'prestigious.png', 'road.png', 'room.png', 'rose.png', 'silk-road.png', 'sky\'s-the-limit.png', 'vandalism.png'],
            'Shirt': ['21.png', 'adados.png', 'believe.png', 'bitcoin-yinyang.png', 'bitcoin.png', 'clouds.png', 'for-the-win.png', 'for-the-world.png', 'frens.png', 'ftw-fc.png', 'fuck-the-war.png', 'fuck-the-world.png', 'fuck-ur-vc.png', 'gold-chain.png', 'grey.png', 'halving.png', 'i-just.png', 'i-love-you.png', 'internet-frens.png', 'iq.png', 'it-was-not-luck.png', 'its-over-we\'re-back.png', 'jail.png', 'killuminati.png', 'life-goes-on.png', 'no-cabal.png', 'no-one-else-will.png', 'omb.png', 'pimp.png', 'running-bitcoin.png', 'saiko.png', 'satoshi.png', 'sometimes.png', 'stop-being-poor.png', 'suit.png', 'sweet-melancholy.png', 'terry.png', 'w.png', 'weirdooo.png', 'weirdos-with-a-cause.png', 'werido.png', 'world-peace.png', 'wurdo.png'],
            'Accessory': ['420.png', 'artist.png', 'bitaxe.png', 'bitcoin.png', 'blunt.png', 'clock.png', 'confirmed.png', 'diamond.png', 'f.png', 'faucet.png', 'fuck-the-world.png', 'gameboy.png', 'hardcore.png', 'heart.png', 'holding-bitcoin.png', 'how-to-love.png', 'ice-crime.png', 'its-about.png', 'knife.png', 'laptop.png', 'lasagna.png', 'magic-internet-money.png', 'midi-keyboard.png', 'noodlelino.png', 'one-dollar-and-a-dream.png', 'orange-juice.png', 'peace.png', 'phone.png', 'pizza.png', 'plant.png', 'puppit.png', 'sheep.png', 'sk8.png', 'sogs.png', 'star.png', 'unconfirmed.png', 'vanilla-strawberry.png', 'world.png'],
            'Skin': ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'],
            'Eyes': ['3d.png', 'classic.png', 'happy.png', 'hehe.png', 'hmmmm.png', 'lel.png', 'lover-weirdo.png', 'not-hapy.png', 'red-eyes.png', 'sleep.png', 'slightly-sad.png', 'stars.png', 'tattoos.png', 'uhouhuhuhy.png'],
            'Mask': ['autistic.png', 'b-beige.png', 'b-black.png', 'b-blue.png', 'b-grey.png', 'b-orange.png', 'b-white.png', 'bitcoin-pattern-black.png', 'bitcoin-pattern-blue.png', 'bitcoin-pattern-orange.png', 'bitcoin-pattern-red.png', 'bitcoin-pshhh-black.png', 'bitcoin-pshhh-orange.png', 'bitcoin.png', 'black.png', 'blue.png', 'clouds.png', 'for-the-weirdos.png', 'ftw-pattern.png', 'ftw-white.png', 'fuck-the-world.png', 'green.png', 'grey-bands.png', 'gucci.png', 'i-love-u.png', 'im-colorblind.png', 'im-rly-colorblind.png', 'just-a-weirdo.png', 'miro.png', 'red-lines.png', 'rothko.png', 'whitish.png', 'wild.png', 'world-peace.png'],
            'Xx': ['angel.png', 'art.png', 'believe.png', 'bitcoin.png', 'born.png', 'come-as-u-are.png', 'dream-big.png', 'escape-reality.png', 'forever.png', 'free-the-world.png', 'fuck-the-world.png', 'illiquid.png', 'in-memory.png', 'it-was-all-a-dream.png', 'le-monde-ou-rien.png', 'lifat-mat.png', 'limitless.png', 'loyalty-over-royalty.png', 'mempool-lover.png', 'misunderstood.png', 'nintai.png', 'pain-is-fuel.png', 'por-la-vida.png', 'sad-birds.png', 'saudade.png', 'sky.png', 'sleepless.png', 'slightly-autistic.png', 'sorry.png', 'stars.png', 'wish-it-was-easier.png', 'zero-or-hero.png']
        };
    }

    init(nftWindow) {
        this.canvas = nftWindow.querySelector('#nft-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.categoryButtons = nftWindow.querySelector('#category-buttons');
        this.randomizeBtn = nftWindow.querySelector('#nft-randomize-btn');
        this.clearBtn = nftWindow.querySelector('#nft-clear-btn');
        this.exportBtn = nftWindow.querySelector('#nft-export-btn');
        this.traitModal = nftWindow.querySelector('#trait-selector-modal');
        this.traitGrid = nftWindow.querySelector('#trait-grid');
        this.modalTitle = nftWindow.querySelector('#modal-title');
        this.progressBar = nftWindow.querySelector('#progress-bar');
        this.progressText = nftWindow.querySelector('#progress-text');
        
        this.setupCanvas();
        this.setupEventListeners();
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
    }

    setupCanvas() {
        // Set up HiDPI support
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = 500 * devicePixelRatio;
        this.canvas.height = 500 * devicePixelRatio;
        this.canvas.style.width = '500px';
        this.canvas.style.height = '500px';
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    setupEventListeners() {
        this.randomizeBtn.addEventListener('click', () => {
            this.randomizeAll();
        });

        this.clearBtn.addEventListener('click', () => {
            this.clearAll();
        });

        this.exportBtn.addEventListener('click', () => {
            this.exportPNG();
        });
    }

    generateCategoryButtons() {
        this.categoryButtons.innerHTML = '';
        
        this.layerOrder.forEach(category => {
            const button = document.createElement('button');
            const selectedCount = this.selectedTraits[category] ? 1 : 0;
            const totalCount = this.availableTraits[category].length;
            
            button.innerHTML = `${category}<br><small>${selectedCount}/${totalCount}</small>`;
            button.style.cssText = `
                padding: 8px;
                border: 1px solid #999;
                background: #e0e0e0;
                cursor: pointer;
                font-size: 11px;
                text-align: center;
                min-height: 50px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            `;
            
            button.addEventListener('click', () => {
                this.openTraitSelector(category);
            });
            
            this.categoryButtons.appendChild(button);
        });
    }

    openTraitSelector(category) {
        this.modalTitle.textContent = `Select ${category}`;
        this.traitGrid.innerHTML = '';
        
        this.availableTraits[category].forEach(trait => {
            const thumbnail = document.createElement('div');
            thumbnail.style.cssText = `
                width: 80px;
                height: 80px;
                border: 2px solid #ccc;
                background: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            `;
            
            // Create image element
            const img = document.createElement('img');
            img.src = `./Assets/generator/${category}/${trait}`;
            img.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            `;
            
            // Add selection highlight
            if (this.selectedTraits[category] === trait) {
                thumbnail.style.borderColor = '#007AFF';
                thumbnail.style.backgroundColor = '#E3F2FD';
            }
            
            thumbnail.appendChild(img);
            
            thumbnail.addEventListener('click', () => {
                this.selectTrait(category, trait);
                this.traitModal.style.display = 'none';
            });
            
            this.traitGrid.appendChild(thumbnail);
        });
        
        this.traitModal.style.display = 'block';
    }

    selectTrait(category, trait) {
        this.selectedTraits[category] = trait;
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
        
        // Check if all 7 traits are selected and play celebration sound
        this.checkForCompleteNFT();
    }

    randomizeAll() {
        this.layerOrder.forEach(category => {
            const traits = this.availableTraits[category];
            const randomIndex = Math.floor(Math.random() * traits.length);
            this.selectedTraits[category] = traits[randomIndex];
        });
        
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
        
        // Check if all 7 traits are selected and play celebration sound
        this.checkForCompleteNFT();
    }

    clearAll() {
        this.layerOrder.forEach(category => {
            this.selectedTraits[category] = null;
        });
        
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
    }

    updateProgress() {
        const selectedCount = this.layerOrder.filter(category => this.selectedTraits[category] !== null).length;
        const totalCount = this.layerOrder.length;
        const percentage = (selectedCount / totalCount) * 100;
        
        if (this.progressBar) {
            this.progressBar.style.width = percentage + '%';
        }
        
        if (this.progressText) {
            this.progressText.textContent = `${selectedCount}/${totalCount} traits selected`;
        }
    }

    async renderCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, 500, 500);
        
        // Render layers in order
        for (const category of this.layerOrder) {
            const selectedTrait = this.selectedTraits[category];
            if (selectedTrait) {
                await this.drawLayer(category, selectedTrait);
            }
        }
    }

    async drawLayer(category, trait) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, 500, 500);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ./Assets/generator/${category}/${trait}`);
                resolve(); // Continue even if one image fails
            };
            img.src = `./Assets/generator/${category}/${trait}`;
        });
    }

    exportPNG() {
        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 500;
        exportCanvas.height = 500;
        const exportCtx = exportCanvas.getContext('2d');
        
        // Copy the current canvas content
        exportCtx.drawImage(this.canvas, 0, 0);
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'nft-creation.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }

    checkForCompleteNFT() {
        // Check if all 7 categories have traits selected
        const allSelected = this.layerOrder.every(category => this.selectedTraits[category] !== null);
        
        if (allSelected) {
            this.playCelebrationSound();
        }
    }

    playCelebrationSound() {
        // Create a simple celebration sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create a pleasant chord progression for celebration
            const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                // Create a pleasant envelope
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
                
                // Stagger the notes slightly for a chord effect
                oscillator.start(audioContext.currentTime + (index * 0.1));
                oscillator.stop(audioContext.currentTime + 1.5);
            });
            
            // Add a visual celebration effect
            this.showCelebrationEffect();
            
        } catch (error) {
            console.log('Audio not available, showing visual celebration only');
            this.showCelebrationEffect();
        }
    }

    showCelebrationEffect() {
        // Create a simple visual celebration effect
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 10000;
            pointer-events: none;
            animation: celebrationPulse 2s ease-out forwards;
        `;
        
        celebration.textContent = 'you are a weirdo bro 🫵';
        
        // Add the animation CSS if not already present
        if (!document.getElementById('celebration-styles')) {
            const style = document.createElement('style');
            style.id = 'celebration-styles';
            style.textContent = `
                @keyframes celebrationPulse {
                    0% { 
                        transform: translate(-50%, -50%) scale(0.5);
                        opacity: 0;
                    }
                    20% { 
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 1;
                    }
                    80% { 
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translate(-50%, -50%) scale(0.8);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(celebration);
        
        // Remove the celebration element after animation
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.parentNode.removeChild(celebration);
            }
        }, 2000);
    }
}

// Initialize the desktop when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WindowsXPDesktop();
});

