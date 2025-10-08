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
            if (!globalChatApp) {
                globalChatApp = new ChatApplication();
            }
            globalChatApp.init(chatWindow);
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
        
        // Window resize handling
        window.addEventListener('resize', () => this.handleWindowResize());
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
            const centerY = (globalThis.innerHeight - 700) / 2;
            win.style.left = Math.max(0, centerX) + 'px';
            win.style.top = Math.max(0, centerY) + 'px';
            win.style.width = '600px';
            win.style.height = '700px';
        } else if (type === 'nft-builder') {
            // Center the NFT Builder window with optimized size: canvas (500) + padding + categories (220) + gap
            const windowWidth = 760; // 500 + 8*2 + 220 + 12 + 8*2 = 760px
            const windowHeight = this.calculateNFTBuilderHeight();
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
        } else {
            win.style.left = '100px';
            win.style.top = '100px';
            win.style.width = '400px';
            win.style.height = '300px';
        }

        const windowData = this.getWindowData(type);
        
        // Determine if this window needs special content handling
        const needsNoPadding = type === 'paint' || type === 'nft-builder' || type === 'internet-explorer';
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
                
                // Chat application is only initialized for the always-open chat window
                // No additional chat initialization needed here
                
                 // Initialize NFT Builder application if this is an NFT Builder window
                 if (type === 'nft-builder') {
                     setTimeout(() => {
                         const nftWindow = win;
                         if (nftWindow) {
                             const nftApp = new NFTBuilderApplication();
                             nftApp.init(nftWindow);
                             // Store reference for Paint integration
                             this.nftBuilder = nftApp;
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
                                <span>Local Disk</span>
                            </div>
                            <div style="display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; cursor: pointer;">
                                <div style="width: 32px; height: 32px; background: #007AFF; margin: 0 auto 5px;"></div>
                                <span>CD Drive</span>
                            </div>
                        </div>
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
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openManifesto()">📄 a weirdo's manifesto</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc;">📁 My Pictures</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideosFolder()">📁 Videos</div>
                        </div>
                    </div>
                `
            },
            'internet-explorer': {
                title: 'Explorer',
                content: `
                    <div style="height: 100%; display: flex; flex-direction: column; background: #ece9d8;">
                        <!-- Toolbar -->
                        <div style="background: linear-gradient(to bottom, #f0f0f0, #d4d0c8); border-bottom: 1px solid #999; padding: 4px; display: flex; align-items: center; gap: 4px;">
                            <button style="width: 24px; height: 24px; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; background: #f0f0f0; cursor: pointer; font-size: 10px;" title="Back">◀</button>
                            <button style="width: 24px; height: 24px; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; background: #f0f0f0; cursor: pointer; font-size: 10px;" title="Forward">▶</button>
                            <button style="width: 24px; height: 24px; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; background: #f0f0f0; cursor: pointer; font-size: 10px;" title="Up">▲</button>
                            <div style="width: 1px; height: 20px; background: #999; margin: 0 4px;"></div>
                            <button style="width: 24px; height: 24px; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; background: #f0f0f0; cursor: pointer; font-size: 10px;" title="Home">🏠</button>
                            <button style="width: 24px; height: 24px; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; background: #f0f0f0; cursor: pointer; font-size: 10px;" title="Search">🔍</button>
                            <button style="width: 24px; height: 24px; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; background: #f0f0f0; cursor: pointer; font-size: 10px;" title="Folders">📁</button>
                        </div>
                        
                        <!-- Address Bar -->
                        <div style="background: #f0f0f0; border-bottom: 1px solid #999; padding: 4px 8px; display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 11px; color: #333; font-weight: bold;">Address:</span>
                            <div style="flex: 1; background: white; border: 1px solid #999; border-top: 1px solid #666; border-left: 1px solid #666; padding: 2px 6px; font-size: 11px; color: #333;">\\Weirdos\\Explorer</div>
                        </div>
                        
                        <!-- Main Content Area -->
                        <div style="flex: 1; background: #ece9d8; padding: 12px; overflow-y: auto;">
                            <div style="background: white; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; padding: 16px; box-shadow: inset 1px 1px 0 #666;">
                                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #333; font-weight: bold;">Featured Links</h3>
                                
                                <div style="margin-bottom: 10px;">
                                    <a href="https://www.f-t-w.xyz/" target="_blank" style="display: block; padding: 6px 10px; margin-bottom: 6px; background: #f0f0f0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; text-decoration: none; color: #000; font-size: 11px; transition: background-color 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                                        🌐 <strong>F-T-W.xyz</strong>
                                    </a>
                                </div>
                                
                                <div style="margin-bottom: 10px;">
                                    <a href="https://memes.f-t-w.xyz/" target="_blank" style="display: block; padding: 6px 10px; margin-bottom: 6px; background: #f0f0f0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; text-decoration: none; color: #000; font-size: 11px; transition: background-color 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                                        😂 <strong>Meme Generator.xyz</strong>
                                    </a>
                                </div>
                                
                                <div style="margin-bottom: 10px;">
                                    <a href="https://memedepot.com/d/ftw" target="_blank" style="display: block; padding: 6px 10px; margin-bottom: 6px; background: #f0f0f0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; text-decoration: none; color: #000; font-size: 11px; transition: background-color 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                                        🎭 <strong>Memedepot.com</strong>
                                    </a>
                                </div>
                                
                                <div style="margin-bottom: 10px;">
                                    <a href="https://www.exhibitcoin.art/" target="_blank" style="display: block; padding: 6px 10px; margin-bottom: 6px; background: #f0f0f0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; text-decoration: none; color: #000; font-size: 11px; transition: background-color 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                                        🎨 <strong>Exhibitcoin.art</strong>
                                    </a>
                                </div>
                                
                                <div style="margin-bottom: 10px;">
                                    <a href="https://artonbitcoin.art/" target="_blank" style="display: block; padding: 6px 10px; margin-bottom: 6px; background: #f0f0f0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; text-decoration: none; color: #000; font-size: 11px; transition: background-color 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                                        ₿ <strong>Artonbitcoin.art</strong>
                                    </a>
                                </div>
                                
                                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
                                    <p style="margin: 0;">Click any link above to open in a new tab.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            'notepad': {
                title: 'Untitled - Notepad',
                content: `
                    <div style="padding: 0; height: 100%;">
                        <textarea spellcheck="false" style="width: 100%; height: 100%; border: none; padding: 8px; font-family: 'Courier New', monospace; font-size: 12px; resize: none;" placeholder="Type your text here...">1 package of lasagna
3 yellow onions
butter
flour
pepper
salt
cheese
thyme
tomato puree
carrot
basilic
water
parmesan
beef
garlic
milk</textarea>
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
                                 <div style="flex: 1; display: flex; justify-content: center; align-items: center; background: #f5f5f5; border: 1px solid #ccc; min-height: 0; margin-bottom: 16px;">
                                     <!-- Canvas Wrapper -->
                                     <div id="paint-canvas-wrapper" style="position: relative; width: 500px; height: 500px;">
                                         <canvas id="paint-canvas" width="500" height="500" style="border: 1px solid #999; cursor: crosshair; background: transparent; width: 100%; height: 100%;"></canvas>
                                         <!-- Guide Overlay -->
                                         <div id="paint-guide-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; display: none;">
                                             <img id="paint-guide-image" style="width: 100%; height: 100%; opacity: 0.27; object-fit: none;" />
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <!-- Layer Selection Toolbar -->
                                 <div style="display: flex; align-items: center; gap: 4px; padding: 4px; background: #e8f4fd; border: 1px solid #b3d9ff; flex-shrink: 0; margin-bottom: 20px;">
                                     <span style="font-size: 11px; font-weight: bold; color: #333; margin-right: 4px;">Target Layer:</span>
                                     <div id="paint-layer-buttons" style="display: flex; gap: 2px; flex-wrap: wrap; flex: 1;">
                                         <button class="paint-layer-btn" data-layer="Background" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px;">Background</button>
                                         <button class="paint-layer-btn" data-layer="Shirt" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px;">Shirt</button>
                                         <button class="paint-layer-btn" data-layer="Accessory" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px;">Accessory</button>
                                         <button class="paint-layer-btn" data-layer="Skin" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px;">Skin</button>
                                         <button class="paint-layer-btn" data-layer="Eyes" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px;">Eyes</button>
                                         <button class="paint-layer-btn" data-layer="Mask" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px;">Mask</button>
                                         <button class="paint-layer-btn" data-layer="Xx" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px;">Xx</button>
                                         <button class="paint-layer-btn" data-layer="Higher" style="padding: 2px 6px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 10px; color: #4CAF50; font-weight: bold;">Higher</button>
                                     </div>
                                     <div style="width: 1px; height: 20px; background: #999; margin: 0 4px;"></div>
                                     <button id="paint-send-to-builder-btn" style="padding: 4px 8px; border: 1px solid #999; background: #4CAF50; color: white; cursor: pointer; font-size: 11px; font-weight: bold; flex-shrink: 0;">📤 Send to Builder</button>
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
                            <div class="nft-builder-container" style="padding: 8px; display: flex; gap: 12px; min-height: 100%; box-sizing: border-box;">
                                <!-- Left Column - Canvas + Controls -->
                                <div style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px; padding-right: 0;">
                                    <!-- Canvas -->
                                    <div style="display: flex; flex-direction: column;">
                                        <div style="text-align: center; margin-bottom: 6px; font-size: 11px; font-weight: bold; color: #333;">NFT Preview</div>
                                        <div style="border: 2px solid #999; border-top: 2px solid #fff; border-left: 2px solid #fff; border-right: 2px solid #666; border-bottom: 2px solid #666; background: #f0f0f0; padding: 8px; display: flex; justify-content: center; align-items: center;">
                                            <canvas id="nft-canvas" width="500" height="500" style="border: 1px solid #ccc; background: white;"></canvas>
                                        </div>
                                    </div>
                                    
                                    <!-- Controls under canvas -->
                                    <div class="nft-controls" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 0 8px;">
                                        <button id="nft-clear-btn" style="padding: 6px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px; flex-shrink: 0;">🗑️ Clear All</button>
                                        <button id="nft-randomize-btn" style="padding: 6px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px; flex-shrink: 0;">🎲 Randomize</button>
                                        
                                        <!-- Progress Bar -->
                                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                                            <div style="width: 100%; max-width: 200px; height: 16px; border: 1px solid #999; background: #fff; position: relative;">
                                                <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(to right, #4CAF50 0%, #8BC34A 100%); transition: width 0.3s ease;"></div>
                                            </div>
                                            <span id="progress-text" style="font-size: 11px; color: #333; font-weight: bold; white-space: nowrap;">0/7 traits selected</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Right Column - Categories + Export -->
                                <div style="flex: 0 0 220px; display: flex; flex-direction: column; gap: 8px; padding-left: 0;">
                                    <div style="text-align: center; font-size: 11px; font-weight: bold; color: #333;">Categories</div>
                                    <div id="category-buttons" style="display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; padding: 0 8px;">
                                        <!-- Category buttons will be generated here -->
                                    </div>
                                    
                                    <!-- Export Button -->
                                    <div style="flex: 0 0 auto; padding: 0 8px;">
                                        <button id="nft-export-btn" style="width: 100%; padding: 8px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px; text-align: left;">💾 Export NFT</button>
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
                    },
                    'manifesto': {
                        title: 'a weirdo\'s manifesto - Notepad',
                        content: `
                            <div style="padding: 0; height: 100%;">
                                <textarea style="width: 100%; height: 100%; border: none; padding: 8px; font-family: 'Courier New', monospace; font-size: 12px; resize: none; background: white; color: black;" readonly>fuck the world - a weirdo's manifesto

i believe one thing everybody has in common in crypto is that at some
point in our lives, we've said, "fuck the world."

fuck the world that wants us to work our whole lives at a depressing job
just to survive,

fuck the world that wants us to fight each other instead of living in peace,
fuck the world that wants to control us.

ftw is a feeling,
a state of mind, for the weirdos who came from nothing,
for
the weirdos who believe in something.

this project is a tribute to degeneracy,a tribute to culture,
a tribute to weirdos who have been inscribing files on-chain,
a tribute to weirdos that are almost ruining their lives
trying to save them.

they call us crazy, maybe we are,
but we chose to be crazy together.
in a market highly manipulated by influencers, institutions,
and politics,
some weirdos just want to be different, have fun
and be part of history.

we are living extraordinary times and we don't even realize it.
we must take a moment to reflect on these moments.

i guarantee you that in a few years, you will think
about those nights with your internet frens,
you will think about the times you made money
buying a cartoon jpg
or an illiquid cat token
and the times you lost money and laughed about it.

you will remember a life
where everything was simple and yet complicated,
a life where we didn't care about anything else
but watching charts and having fun on discord,
a life where we just wanted to be free.

what we are doing could be seen as an act of rebellion
against a broken world.

while everything is going crazy,
while everyone is fighting, us weirdos,
we chose to believe in something.

we must say "fuck the world" to change the world,
we must say "fuck the world" to free the world,
and this can't be manipulated
by any influencers or marketing strategies.

it needs to come from the heart,
it needs to be genuine,
it needs to be organic.

for the weirdos, for the world.</textarea>
                            </div>
                        `
                    },
                    'videos': {
                        title: 'Videos',
                        content: `
                            <div style="padding: 20px;">
                                <h3>Videos</h3>
                                <p>This folder contains video files. Double-click to play.</p>
                                <div style="margin-top: 20px;">
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('100k-first-time.mp4', '100k First Time')">🎬 100k First Time</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('10k-weirdos-mint.mp4', '10K Weirdos Mint')">🎬 10K Weirdos Mint</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('9-btc.mp4', '9.btc')">🎬 9.btc</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('a-weirdos-manifesto.mp4', 'A Weirdo\'s Manifesto')">🎬 A Weirdo's Manifesto</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('bitcoins-going-to-zero.mp4', 'Bitcoin\'s Going to Zero')">🎬 Bitcoin's Going to Zero</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('ftw.mp4', 'FTW')">🎬 FTW</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('fuck-the-world.mp4', 'FUCK THE WORLD')">🎬 FUCK THE WORLD</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('it-was-not-luck.mp4', 'It Was Not Luck')">🎬 It Was Not Luck</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('its-over-wereback.mp4', 'It\'s Over We\'re Back')">🎬 It's Over We're Back</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('music.mp4', 'Music')">🎬 Music</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('never-kill-yourself.mp4', 'Never Kill Yourself')">🎬 Never Kill Yourself</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('remember-why.mp4', 'Remember Why')">🎬 Remember Why</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('runes-are-dead.mp4', 'Runes Are Dead')">🎬 Runes Are Dead</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('secret-stuff.mp4', 'Secret Stuff')">🎬 Secret Stuff</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('theyre-not-like-us.mp4', 'They\'re Not Like Us')">🎬 They're Not Like Us</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('timelaps-art.mp4', 'Timelapse Art')">🎬 Timelapse Art</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('weirdos-show.mp4', 'Weirdos Show')">🎬 Weirdos Show</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('woooooo.mp4', 'Woooooo')">🎬 Woooooo</div>
                                    <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('wpzn.mp4', 'WPZN')">🎬 WPZN</div>
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
        
        // Get title text based on window type
        let titleText;
        if (window.dataset.windowType === 'video-player') {
            titleText = window.querySelector('.window-title-bar span').textContent;
        } else {
            titleText = window.querySelector('.window-title').textContent;
        }
        
        taskbarItem.textContent = titleText;
        taskbarItem.dataset.windowId = window.id;
        
        taskbarItem.addEventListener('click', () => {
            // If window is minimized, restore it first
            if (window.style.display === 'none') {
                if (window.dataset.windowType === 'video-player') {
                    // Find the VideoPlayerWindow instance and restore it
                    const playerInstance = this.windows.find(w => w.window && w.window.id === window.id);
                    if (playerInstance && playerInstance.restore) {
                        playerInstance.restore();
                    } else {
                        this.restoreWindow(window);
                    }
                } else {
                    this.restoreWindow(window);
                }
            }
            this.bringToFront(window);
        });

        taskbarCenter.appendChild(taskbarItem);
        
        // Store reference to taskbar item for video player windows
        if (window.dataset.windowType === 'video-player') {
            const videoPlayer = this.windows.find(w => w === window);
            if (videoPlayer && videoPlayer.taskbarItem === undefined) {
                // Find the VideoPlayerWindow instance
                const playerInstance = this.windows.find(w => w.dataset.videoFilename);
                if (playerInstance) {
                    // We need to store the taskbar item reference in the VideoPlayerWindow instance
                    // This will be handled in the VideoPlayerWindow constructor
                }
            }
        }
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
            const windowElement = w.window || w; // Handle both VideoPlayerWindow instances and regular windows
            windowElement.style.zIndex = '100';
            const taskbarItem = document.querySelector(`[data-window-id="${windowElement.id}"]`);
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

    calculateNFTBuilderHeight() {
        // Calculate height to reach near bottom of screen
        const taskbarHeight = 30; // Taskbar height
        const margin = 20; // Small margin from taskbar
        const availableHeight = globalThis.innerHeight - taskbarHeight - margin;
        return Math.max(600, availableHeight); // Minimum 600px height
    }

    handleWindowResize() {
        // Update NFT Builder windows on resize
        this.windows.forEach(window => {
            if (window.dataset.windowType === 'nft-builder') {
                const newHeight = this.calculateNFTBuilderHeight();
                const currentWidth = parseInt(window.style.width);
                
                // Re-center the window
                const centerX = (globalThis.innerWidth - currentWidth) / 2;
                const centerY = (globalThis.innerHeight - newHeight) / 2;
                
                window.style.left = Math.max(0, centerX) + 'px';
                window.style.top = Math.max(0, centerY) + 'px';
                window.style.height = newHeight + 'px';
            }
        });
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

    // Method to handle Paint-to-NFT Builder communication
    sendToNFTBuilder(layer, dataURL) {
        // Check if NFT Builder window exists
        const nftBuilderWindow = this.windows.find(w => w.dataset.windowType === 'nft-builder');
        
        if (!nftBuilderWindow) {
            // Auto-open NFT Builder window
            this.openWindow('nft-builder');
            // Wait a moment for the window to initialize
            setTimeout(() => {
                if (this.nftBuilder) {
                    this.nftBuilder.replaceLayerWithUserArt(layer, dataURL);
                }
            }, 200);
        } else {
            // Bring existing window to front and send data
            this.bringToFront(nftBuilderWindow);
            if (this.nftBuilder) {
                this.nftBuilder.replaceLayerWithUserArt(layer, dataURL);
            }
        }
    }

    // Method to open the weirdo's manifesto
    openManifesto() {
        const windowId = `window-manifesto-${++this.windowCounter}`;
        const window = this.createWindow('manifesto', windowId);
        window.dataset.windowType = 'manifesto';
        this.windows.push(window);
        this.activeWindow = window;
        this.addToTaskbar(window);
        this.bringToFront(window);
    }

    // Method to open the videos folder
    openVideosFolder() {
        const windowId = `window-videos-${++this.windowCounter}`;
        const window = this.createWindow('videos', windowId);
        window.dataset.windowType = 'videos';
        this.windows.push(window);
        this.activeWindow = window;
        this.addToTaskbar(window);
        this.bringToFront(window);
    }

    // Method to open video player popup
    openVideoPlayer(filename, title) {
        // Check if video player already exists for this file
        const existingPlayer = document.querySelector(`[data-video-filename="${filename}"]`);
        if (existingPlayer) {
            this.bringToFront(existingPlayer);
            return;
        }

        const player = new VideoPlayerWindow(filename, title, this);
        // Store the player instance instead of just the window
        this.windows.push(player);
        this.activeWindow = player.window;
        this.addToTaskbar(player.window);
        
        // Set the taskbar item reference in the player instance
        const taskbarItem = document.querySelector(`[data-window-id="${player.window.id}"]`);
        if (taskbarItem) {
            player.taskbarItem = taskbarItem;
        }
        
        this.bringToFront(player.window);
    }
}

// Video Player Window Class
class VideoPlayerWindow {
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
        this.selectedLayer = null;
        this.layerButtons = [];
        this.sendToBuilderBtn = null;
        this.guideOverlay = null;
        this.guideImage = null;
        this.canvasWrapper = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.setupCanvas();
        this.setupGuideOverlay();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Enforce exact 500×500 pixel canvas size
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.canvas.style.width = '500px';
        this.canvas.style.height = '500px';
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Set transparent background
        this.ctx.clearRect(0, 0, 500, 500);
        
        // Prevent canvas resizing
        this.preventCanvasResize();
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

        // Layer selection buttons
        this.layerButtons = document.querySelectorAll('.paint-layer-btn');
        this.layerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectLayer(btn.dataset.layer);
            });
        });

        // Send to Builder button
        this.sendToBuilderBtn = document.getElementById('paint-send-to-builder-btn');
        this.sendToBuilderBtn.addEventListener('click', () => {
            this.sendToBuilder();
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
        // Enforce canvas size before drawing
        this.enforceCanvasSize();
        
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
        // Enforce canvas size before clearing
        this.enforceCanvasSize();
        this.ctx.clearRect(0, 0, 500, 500);
    }

    preventCanvasResize() {
        // Monitor canvas size changes and enforce 500×500
        const observer = new MutationObserver(() => {
            this.enforceCanvasSize();
        });
        
        observer.observe(this.canvas, {
            attributes: true,
            attributeFilter: ['width', 'height', 'style']
        });
        
        // Also check on any canvas property changes
        const originalSetAttribute = this.canvas.setAttribute;
        this.canvas.setAttribute = (name, value) => {
            if (name === 'width' || name === 'height') {
                this.showToast('Canvas size is fixed at 500×500 pixels', 'info');
                return;
            }
            return originalSetAttribute.call(this.canvas, name, value);
        };
    }

    enforceCanvasSize() {
        // Check and enforce 500×500 size
        if (this.canvas.width !== 500 || this.canvas.height !== 500) {
            this.canvas.width = 500;
            this.canvas.height = 500;
            this.canvas.style.width = '500px';
            this.canvas.style.height = '500px';
            this.showToast('Canvas size enforced to 500×500 pixels', 'info');
        }
        
        // Recompute guide alignment after canvas resize
        this.alignGuideOverlay();
    }

    exportCanvas() {
        // Enforce canvas size before export
        this.enforceCanvasSize();
        
        // Hide guide overlay before export
        const wasGuideVisible = this.guideOverlay && this.guideOverlay.style.display !== 'none';
        if (this.guideOverlay) {
            this.guideOverlay.style.display = 'none';
        }
        
        // Export as PNG with transparent background
        const link = document.createElement('a');
        link.download = 'paint-drawing.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        // Restore guide overlay after export
        if (wasGuideVisible && this.guideOverlay) {
            this.guideOverlay.style.display = 'block';
        }
        
        this.showToast('Canvas exported as 500×500 PNG', 'success');
    }

    setupGuideOverlay() {
        this.canvasWrapper = document.getElementById('paint-canvas-wrapper');
        this.guideOverlay = document.getElementById('paint-guide-overlay');
        this.guideImage = document.getElementById('paint-guide-image');
        
        // Ensure perfect alignment
        this.alignGuideOverlay();
        
        // Add resize observer to maintain alignment
        if (this.canvasWrapper) {
            const resizeObserver = new ResizeObserver(() => {
                this.alignGuideOverlay();
            });
            resizeObserver.observe(this.canvasWrapper);
        }
    }

    alignGuideOverlay() {
        if (!this.canvasWrapper || !this.guideOverlay) return;
        
        // Ensure wrapper is exactly 500x500
        this.canvasWrapper.style.width = '500px';
        this.canvasWrapper.style.height = '500px';
        
        // Ensure guide overlay perfectly covers the canvas
        this.guideOverlay.style.position = 'absolute';
        this.guideOverlay.style.top = '0';
        this.guideOverlay.style.left = '0';
        this.guideOverlay.style.width = '100%';
        this.guideOverlay.style.height = '100%';
        this.guideOverlay.style.pointerEvents = 'none';
        this.guideOverlay.style.zIndex = '10';
        
        // Ensure guide image fills exactly 500x500 pixels
        if (this.guideImage) {
            this.guideImage.style.width = '100%';
            this.guideImage.style.height = '100%';
            this.guideImage.style.objectFit = 'none'; // No scaling, exact pixel mapping
            this.guideImage.style.opacity = '0.27';
        }
    }

    selectLayer(layer) {
        this.selectedLayer = layer;
        
        // Update button states
        this.layerButtons.forEach(btn => {
            if (btn.dataset.layer === layer) {
                btn.style.background = '#4CAF50';
                btn.style.color = 'white';
                btn.style.borderColor = '#45a049';
            } else {
                btn.style.background = '#e0e0e0';
                btn.style.color = 'black';
                btn.style.borderColor = '#999';
            }
        });
        
        // Show/hide guide overlay based on selected layer
        this.updateGuideOverlay(layer);
    }

    updateGuideOverlay(layer) {
        const guideMap = {
            'Shirt': 'shirt-guide.png',
            'Accessory': 'accessory-guide.png',
            'Skin': 'skin-guide.png',
            'Eyes': 'eyes-guide.png',
            'Mask': 'mask-guide.png'
        };
        
        if (guideMap[layer] && this.guideOverlay && this.guideImage) {
            this.guideImage.src = `./Assets/guide/${guideMap[layer]}`;
            this.guideOverlay.style.display = 'block';
            // Recompute alignment when switching guides
            this.alignGuideOverlay();
        } else if (this.guideOverlay) {
            this.guideOverlay.style.display = 'none';
        }
    }

    sendToBuilder() {
        // Enforce canvas size before sending
        this.enforceCanvasSize();

        // Validate layer selection
        if (!this.selectedLayer) {
            this.showToast('Error: Please select a target layer first', 'error');
            return;
        }

        // Validate layer name
        const validLayers = ['Background', 'Shirt', 'Accessory', 'Skin', 'Eyes', 'Mask', 'Xx', 'Higher'];
        if (!validLayers.includes(this.selectedLayer)) {
            this.showToast('Error: Invalid layer selected', 'error');
            return;
        }

        // Hide guide overlay before export
        const wasGuideVisible = this.guideOverlay && this.guideOverlay.style.display !== 'none';
        if (this.guideOverlay) {
            this.guideOverlay.style.display = 'none';
        }
        
        // Export canvas as PNG with transparent background
        const dataURL = this.canvas.toDataURL('image/png');
        
        // Restore guide overlay after export
        if (wasGuideVisible && this.guideOverlay) {
            this.guideOverlay.style.display = 'block';
        }
        
        // Send to NFT Builder via desktop
        if (window.desktop) {
            window.desktop.sendToNFTBuilder(this.selectedLayer, dataURL);
            this.showToast(`Sent to Builder: ${this.selectedLayer}`, 'success');
        } else {
            this.showToast('Error: Desktop not available', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                toast.style.background = '#4CAF50';
                break;
            case 'error':
                toast.style.background = '#f44336';
                break;
            default:
                toast.style.background = '#2196F3';
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Global chat instance and initialization guard
let globalChatApp = null;
window.chatAppInitialized = false;

// Chat Application Class
class ChatApplication {
    constructor() {
        this.messagesContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.clearButton = null;
        this.storageKey = 'windowsxp_chat_history';
        this.usernameKey = 'chatUsername';
        this.userName = null;
        this.overlay = null;
        this.chatWindow = null;
        this.hasLoggedIn = false;
        this.isInitialized = false;
        this.firebaseEnabled = false;
    }

    init(chatWindow) {
        // Skip if already initialized (both instance and window level guards)
        if (this.isInitialized || window.chatAppInitialized) {
            return;
        }
        
        this.chatWindow = chatWindow;
        this.messagesContainer = chatWindow.querySelector('#chat-messages');
        this.inputField = chatWindow.querySelector('#chat-input');
        this.sendButton = chatWindow.querySelector('#chat-send-btn');
        this.clearButton = chatWindow.querySelector('#chat-clear-btn');
        
        // Check for existing username
        this.userName = localStorage.getItem(this.usernameKey);
        
        if (!this.userName) {
            this.showLoginOverlay();
        } else {
            this.hasLoggedIn = true;
            this.initializeChat().catch(error => {
                console.error('Failed to initialize chat:', error);
            });
        }
        
        this.isInitialized = true;
        window.chatAppInitialized = true;
    }

    showLoginOverlay() {
        // Create overlay container positioned inside chat window
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // Create overlay content
        const overlayContent = document.createElement('div');
        overlayContent.style.cssText = `
            background: #f0f0f0;
            border: 2px solid #999;
            border-top: 2px solid #fff;
            border-left: 2px solid #fff;
            padding: 20px;
            min-width: 300px;
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        `;

        // Title
        const title = document.createElement('div');
        title.textContent = 'Join Chat';
        title.style.cssText = `
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 15px;
            color: #333;
            text-align: center;
        `;

        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            margin-bottom: 15px;
        `;

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.placeholder = 'Enter your username';
        usernameInput.maxLength = 24;
        usernameInput.style.cssText = `
            width: 100%;
            padding: 6px 8px;
            border: 1px solid #999;
            border-top: 1px solid #666;
            border-left: 1px solid #666;
            font-size: 12px;
            background: white;
            box-sizing: border-box;
        `;

        // Error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            color: #ff0000;
            font-size: 11px;
            margin-top: 5px;
            min-height: 14px;
            display: none;
        `;

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
        `;

        const joinButton = document.createElement('button');
        joinButton.textContent = 'Join Chat';
        joinButton.style.cssText = `
            padding: 6px 16px;
            border: 1px solid #999;
            border-top: 1px solid #fff;
            border-left: 1px solid #fff;
            background: #f0f0f0;
            font-size: 12px;
            cursor: pointer;
            color: #333;
        `;

        // Add hover effects
        joinButton.addEventListener('mouseover', () => {
            joinButton.style.background = '#e0e0e0';
        });
        joinButton.addEventListener('mouseout', () => {
            joinButton.style.background = '#f0f0f0';
        });

        // Assemble overlay
        inputContainer.appendChild(usernameInput);
        inputContainer.appendChild(errorDiv);
        buttonContainer.appendChild(joinButton);
        overlayContent.appendChild(title);
        overlayContent.appendChild(inputContainer);
        overlayContent.appendChild(buttonContainer);
        this.overlay.appendChild(overlayContent);

        // Add to chat window content area (not the entire window)
        const chatContent = this.chatWindow.querySelector('.window-content');
        if (chatContent) {
            chatContent.style.position = 'relative';
            chatContent.appendChild(this.overlay);
        }

        // Blur only the messages area and disable controls
        this.messagesContainer.style.filter = 'blur(3px)';
        this.messagesContainer.style.pointerEvents = 'none';
        this.inputField.disabled = true;
        this.sendButton.disabled = true;
        this.clearButton.disabled = true;

        // Event handlers
        const handleSubmit = async (e) => {
            if (e) {
                e.preventDefault();
            }
            const username = usernameInput.value.trim();
            if (this.validateUsername(username)) {
                await this.loginUser(username);
            } else {
                errorDiv.textContent = 'Please enter a valid username (max 24 characters)';
                errorDiv.style.display = 'block';
            }
        };

        joinButton.addEventListener('click', handleSubmit);
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSubmit(e);
            }
        });

        // Focus input
        setTimeout(() => usernameInput.focus(), 100);
    }

    validateUsername(username) {
        if (!username || username.length === 0) return false;
        if (username.length > 24) return false;
        // Reject only whitespace
        if (username.trim().length === 0) return false;
        return true;
    }

    async loginUser(username) {
        this.userName = username.trim();
        localStorage.setItem(this.usernameKey, this.userName);
        this.hasLoggedIn = true;
        this.hideLoginOverlay();
        await this.initializeChat();
        this.addSystemMessage(`${this.userName} has appeared`);
    }

    hideLoginOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // Unblur messages and re-enable controls
        this.messagesContainer.style.filter = '';
        this.messagesContainer.style.pointerEvents = '';
        this.inputField.disabled = false;
        this.sendButton.disabled = false;
        this.clearButton.disabled = false;
        
        // Focus message input
        setTimeout(() => this.inputField.focus(), 100);
    }

    async initializeChat() {
        this.setupEventListeners();
        this.loadChatHistory();
        
        // Initialize Firebase chat integration
        try {
            if (window.FirebaseChat) {
                this.firebaseEnabled = await window.FirebaseChat.initialize();
                if (this.firebaseEnabled) {
                    // Start listening to real-time messages
                    window.FirebaseChat.listenToMessages(this.messagesContainer);
                    console.log('Firebase chat integration enabled');
                }
            }
        } catch (error) {
            console.error('Failed to initialize Firebase chat:', error);
            this.firebaseEnabled = false;
        }
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

    async sendMessage() {
        const message = this.inputField.value.trim();
        if (message) {
            // Add message to local UI immediately
            this.addMessage(message, 'user');
            this.inputField.value = '';
            this.saveChatHistory();
            
            // Send to Firebase if available
            if (this.firebaseEnabled && window.FirebaseChat) {
                try {
                    await window.FirebaseChat.sendMessage(this.userName, message);
                } catch (error) {
                    console.error('Failed to send message to Firebase:', error);
                    // Message is already in local UI, so we don't need to show error to user
                }
            }
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

    addSystemMessage(text) {
        this.addMessage(text, 'system');
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
        
        // Custom user art for each category
        this.customArt = {
            'Background': null,
            'Shirt': null,
            'Accessory': null,
            'Skin': null,
            'Eyes': null,
            'Mask': null,
            'Xx': null
        };
        
        // Higher overlay layer (drawn on top of everything)
        this.overlayHigher = null;
        
        // Available traits for each category
        this.availableTraits = {
            'Background': ['3am.png', 'asylum.png', 'beach.png', 'calm.png', 'fire.png', 'genesis.png', 'mempool.png', 'moonlight.png', 'mountain.png', 'nature.png', 'prestigious.png', 'road.png', 'room.png', 'rose.png', 'silk-road.png', 'sky\'s-the-limit.png', 'vandalism.png'],
            'Shirt': ['21.png', 'adados.png', 'believe.png', 'bitcoin-yinyang.png', 'bitcoin.png', 'clouds.png', 'for-the-win.png', 'for-the-world.png', 'frens.png', 'ftw-fc.png', 'fuck-the-war.png', 'fuck-the-world.png', 'fuck-ur-vc.png', 'gold-chain.png', 'grey.png', 'halving.png', 'i-just.png', 'i-love-you.png', 'internet-frens.png', 'iq.png', 'it-was-not-luck.png', 'its-over-we\'re-back.png', 'jail.png', 'killuminati.png', 'life-goes-on.png', 'no-cabal.png', 'no-one-else-will.png', 'omb.png', 'pimp.png', 'running-bitcoin.png', 'saiko.png', 'satoshi.png', 'sometimes.png', 'stop-being-poor.png', 'suit.png', 'sweet-melancholy.png', 'terry.png', 'w.png', 'weirdooo.png', 'weirdos-with-a-cause.png', 'werido.png', 'world-peace.png', 'wurdo.png'],
            'Accessory': ['420.png', 'artist.png', 'bitaxe.png', 'bitcoin.png', 'blunt.png', 'clock.png', 'confirmed.png', 'diamond.png', 'f.png', 'faucet.png', 'fuck-the-world.png', 'gameboy.png', 'hardcore.png', 'heart.png', 'holding-bitcoin.png', 'how-to-love.png', 'ice-crime.png', 'its-about.png', 'knife.png', 'laptop.png', 'lasagna.png', 'magic-internet-money.png', 'midi-keyboard.png', 'noodlelino.png', 'one-dollar-and-a-dream.png', 'orange-juice.png', 'peace.png', 'phone.png', 'pizza.png', 'plant.png', 'puppit.png', 'sheep.png', 'sk8.png', 'sogs.png', 'star.png', 'unconfirmed.png', 'vanilla-strawberry.png', 'world.png'],
            'Skin': ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'],
            'Eyes': ['3d.png', 'classic.png', 'happy.png', 'hehe.png', 'hmmmm.png', 'lel.png', 'lover-weirdo.png', 'not-hapy.png', 'red-eyes.png', 'sleep.png', 'slightly-sad.png', 'stars.png', 'tattoos.png', 'uhouhuhuhy.png'],
            'Mask': ['autistic.png', 'b-beige.png', 'b-black.png', 'b-blue.png', 'b-grey.png', 'b-orange.png', 'b-white.png', 'bitcoin-pattern-black.png', 'bitcoin-pattern-blue.png', 'bitcoin-pattern-orange.png', 'bitcoin-pattern-red.png', 'bitcoin-pshhh-black.png', 'bitcoin-pshhh-orange.png', 'bitcoin.png', 'black.png', 'blue.png', 'clouds.png', 'for-the-weirdos.png', 'ftw-pattern.png', 'ftw-white.png', 'fuck-the-world.png', 'green.png', 'grey-bands.png', 'gucci.png', 'i-love-u.png', 'im-colorblind.png', 'im-rly-colorblind.png', 'just-a-weirdo.png', 'miro.png', 'red-lines.png', 'rothko.png', 'whitish.png', 'wild.png', 'world-peace.png'],
            'Xx': ['angel.png', 'art.png', 'believe.png', 'bitcoin.png', 'born.png', 'come-as-u-are.png', 'dream-big.png', 'empty.png', 'escape-reality.png', 'forever.png', 'free-the-world.png', 'fuck-the-world.png', 'illiquid.png', 'in-memory.png', 'it-was-all-a-dream.png', 'le-monde-ou-rien.png', 'lifat-mat.png', 'limitless.png', 'loyalty-over-royalty.png', 'mempool-lover.png', 'misunderstood.png', 'nintai.png', 'pain-is-fuel.png', 'por-la-vida.png', 'sad-birds.png', 'saudade.png', 'sky.png', 'sleepless.png', 'slightly-autistic.png', 'sorry.png', 'stars.png', 'wish-it-was-easier.png', 'zero-or-hero.png']
        };
    }

    init(nftWindow) {
        this.nftWindow = nftWindow; // Store reference to the NFT window
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
            const hasCustom = this.customArt[category] !== null;
            const selectedCount = (this.selectedTraits[category] || hasCustom) ? 1 : 0;
            const totalCount = this.availableTraits[category].length;
            
            let buttonText = `${category}<br><small>${selectedCount}/${totalCount}</small>`;
            if (hasCustom) {
                buttonText += '<br><small style="color: #4CAF50; font-weight: bold;">Custom</small>';
            }
            
            button.innerHTML = buttonText;
            button.style.cssText = `
                padding: 8px;
                border: 1px solid #999;
                background: ${hasCustom ? '#e8f5e8' : '#e0e0e0'};
                cursor: pointer;
                font-size: 11px;
                text-align: center;
                min-height: 50px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                position: relative;
            `;
            
            button.addEventListener('click', () => {
                this.openTraitSelector(category);
            });
            
            // Add right-click context menu for custom art
            if (hasCustom) {
                button.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showCustomArtMenu(e, category);
                });
            }
            
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
        // Clear custom art before setting built-in trait
        this.customArt[category] = null;
        this.selectedTraits[category] = trait;
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
        
        // Check if all 7 traits are selected and play celebration sound
        this.checkForCompleteNFT();
    }

    randomizeAll() {
        this.layerOrder.forEach(category => {
            // Clear custom art before assigning randomized trait
            this.customArt[category] = null;
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
            this.customArt[category] = null;
        });
        
        // Also clear the Higher overlay
        this.overlayHigher = null;
        
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
    }

    updateProgress() {
        const selectedCount = this.layerOrder.filter(category => 
            this.selectedTraits[category] !== null || this.customArt[category] !== null
        ).length;
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
            // Check for custom art first
            if (this.customArt[category]) {
                await this.drawCustomLayer(category);
            } else {
                const selectedTrait = this.selectedTraits[category];
                if (selectedTrait) {
                    await this.drawLayer(category, selectedTrait);
                }
            }
        }
        
        // Draw Higher overlay on top of everything
        if (this.overlayHigher) {
            await this.drawHigherOverlay();
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

    async drawCustomLayer(category) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, 500, 500);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load custom image for ${category}`);
                resolve(); // Continue even if one image fails
            };
            img.src = this.customArt[category];
        });
    }

    async drawHigherOverlay() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, 500, 500);
                resolve();
            };
            img.onerror = () => {
                console.warn('Failed to load Higher overlay image');
                resolve(); // Continue even if one image fails
            };
            img.src = this.overlayHigher;
        });
    }

    exportPNG() {
        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 500;
        exportCanvas.height = 500;
        const exportCtx = exportCanvas.getContext('2d');
        
        // Copy the current canvas content with proper HiDPI handling
        // The source canvas is HiDPI-scaled, so we need to draw the full source rectangle
        // to the 500x500 destination canvas
        exportCtx.drawImage(
            this.canvas, 
            0, 0, this.canvas.width, this.canvas.height,  // Source rectangle (full HiDPI canvas)
            0, 0, 500, 500                                // Destination rectangle (500x500)
        );
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'nft-creation.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }

    checkForCompleteNFT() {
        // Check if all 7 categories have either traits or custom art selected
        const allSelected = this.layerOrder.every(category => 
            this.selectedTraits[category] !== null || this.customArt[category] !== null
        );
        
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
            position: absolute;
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
        
        // Find the NFT builder container and ensure it has position relative
        const nftContainer = this.nftWindow.querySelector('.nft-builder-container');
        if (nftContainer) {
            // Ensure the container is positioned relatively for absolute positioning to work
            const originalPosition = nftContainer.style.position;
            if (!originalPosition || originalPosition === 'static') {
                nftContainer.style.position = 'relative';
            }
            
            nftContainer.appendChild(celebration);
            
            // Remove the celebration element after animation
            setTimeout(() => {
                if (celebration.parentNode) {
                    celebration.parentNode.removeChild(celebration);
                }
            }, 2000);
        }
    }

    replaceLayerWithUserArt(layer, dataURL) {
        // Handle Higher overlay separately
        if (layer === 'Higher') {
            this.overlayHigher = dataURL;
            this.renderCanvas();
            this.showToast('Added Higher overlay', 'success');
            return;
        }

        // Validate layer for regular categories
        const validLayers = ['Background', 'Shirt', 'Accessory', 'Skin', 'Eyes', 'Mask', 'Xx'];
        if (!validLayers.includes(layer)) {
            this.showToast('Error: Invalid layer', 'error');
            return;
        }

        // Store custom art and clear built-in trait
        this.customArt[layer] = dataURL;
        this.selectedTraits[layer] = null;
        
        // Update UI
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
        
        // Show success message
        this.showToast(`Replaced ${layer} with your art`, 'success');
        
        // Check for completion
        this.checkForCompleteNFT();
    }

    showCustomArtMenu(e, category) {
        // Remove any existing custom art menu
        const existingMenu = document.getElementById('custom-art-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create context menu
        const menu = document.createElement('div');
        menu.id = 'custom-art-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background: #ece9d8;
            border: 2px solid #999;
            border-top: 2px solid #fff;
            border-left: 2px solid #fff;
            border-right: 2px solid #666;
            border-bottom: 2px solid #666;
            z-index: 1000;
            min-width: 120px;
        `;

        const resetItem = document.createElement('div');
        resetItem.style.cssText = `
            padding: 4px 8px;
            cursor: pointer;
            font-size: 11px;
            border-bottom: 1px solid #ccc;
        `;
        resetItem.textContent = 'Reset to Default';
        resetItem.addEventListener('click', () => {
            this.resetCustomArt(category);
            menu.remove();
        });

        menu.appendChild(resetItem);
        document.body.appendChild(menu);

        // Remove menu when clicking elsewhere
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', removeMenu), 0);
    }

    resetCustomArt(category) {
        // Clear custom art
        this.customArt[category] = null;
        
        // Update UI
        this.generateCategoryButtons();
        this.updateProgress();
        this.renderCanvas();
        
        // Show message
        this.showToast(`Reset ${category} to default`, 'info');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                toast.style.background = '#4CAF50';
                break;
            case 'error':
                toast.style.background = '#f44336';
                break;
            default:
                toast.style.background = '#2196F3';
        }
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Initialize the desktop when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.desktop = new WindowsXPDesktop();
});


