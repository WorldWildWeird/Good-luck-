/**
 * Windows XP Desktop Management
 * Handles desktop icons, start menu, context menus, and window management
 */

import { ChatApplication } from '../apps/chat/chat.js';
import { PaintApplication } from '../apps/paint/paint.js';
import { NFTBuilderApplication } from '../apps/builder/builder.js';
import { VideoPlayerWindow } from '../apps/video/video.js';

export class WindowsXPDesktop {
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
        this.setupWiFiPopup();
        
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
            if (!window.globalChatApp) {
                window.globalChatApp = new ChatApplication();
            }
            window.globalChatApp.init(chatWindow);
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
                // Special handling for 174.png - open external link
                if (windowType === 'image-174') {
                    window.open('https://ordinals.com/children/4967dd42d34696a4f41143ed05ad52805624ef3fb478d72666fba9c7c5d268a9i0', '_blank');
                    return;
                }
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
        
         // Initialize Weirdos Builder application if this is a Weirdos Builder window
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
            'my-documents': {
                title: 'My Documents',
                content: `
                    <div style="padding: 20px;">
                        <h3>My Documents</h3>
                        <p>This folder contains your personal documents.</p>
                        <div style="margin-top: 20px;">
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openManifesto()">📄 a weirdo's manifesto</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideosFolder()">📁 videos</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;">
                                <a href="https://artonbitcoin.art/" target="_blank" style="text-decoration: none; color: #000; display: block;">🎨 artonbitcoin</a>
                            </div>
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
                                    <a href="https://discord.gg/kAjuKVff3J" target="_blank" style="display: block; padding: 6px 10px; margin-bottom: 6px; background: #f0f0f0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; text-decoration: none; color: #000; font-size: 11px; transition: background-color 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                                        💬 <strong>FTW discord</strong>
                                    </a>
                                </div>
                                
                                <div style="margin-bottom: 10px;">
                                    <a href="https://x.com/ftw_collective" target="_blank" style="display: block; padding: 6px 10px; margin-bottom: 6px; background: #f0f0f0; border: 1px solid #999; border-top: 1px solid #fff; border-left: 1px solid #fff; text-decoration: none; color: #000; font-size: 11px; transition: background-color 0.2s;" onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
                                        𝕏 <strong>@ftw_collective</strong>
                                    </a>
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
            'desktop-note': {
                title: 'Welcome to WeirdOS XP',
                content: `
                    <div style="padding: 0; height: 100%;">
                        <textarea spellcheck="false" style="width: 100%; height: 100%; border: none; padding: 8px; font-family: 'Courier New', monospace; font-size: 12px; resize: none;" readonly>Do whatever you want here
watch FTW films, explore the museum, customize your weirdo with or without Paint, listen to some tunes... you can even connect to the Wi-Fi 

Oh, and one last thing 
don't forget to eat some ice cream 🍦</textarea>
                    </div>
                `
            },
            'paint': {
                title: 'Paint',
                content: `
                    <div style="padding: 8px; height: calc(100% - 24px); display: flex; flex-direction: column; overflow: hidden;">
                        <!-- Toolbar -->
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 4px; background: #f0f0f0; border: 1px solid #ccc; flex-shrink: 0;">
                            <label style="display: flex; align-items: center; gap: 4px; font-size: 11px;">
                                Tool:
                                <select id="paint-brush-type" style="padding: 2px 6px; border: 1px solid #999; font-size: 11px;">
                                    <option value="brush">🖌️ Brush</option>
                                    <option value="spray">💨 Spray</option>
                                </select>
                            </label>
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
                                   <option value="16">Extra Thick</option>
                                   <option value="32">Huge</option>
                               </select>
                           </label>
                            
                            <div style="width: 1px; height: 20px; background: #999; margin: 0 4px;"></div>
                            
                            <button id="paint-back-btn" style="padding: 4px 8px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;">⬅️ Back</button>
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
                            <div style="color: #666; font-style: italic;">Welcome weirdo! Type a message below & eat cream.</div>
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
            'image-174': {
                title: '174.png',
                content: `
                    <div style="padding: 20px; text-align: center; background: #000;">
                        <img src="./Assets/174.png" alt="174" style="max-width: 100%; height: auto;">
                    </div>
                `
            },
            'nft-builder': {
                title: 'Weirdos Builder',
                content: `
                    <div class="nft-builder-container" style="padding: 8px; display: flex; gap: 12px; min-height: 100%; box-sizing: border-box;">
                        <!-- Left Column - Canvas + Controls -->
                        <div style="flex: 0 0 auto; display: flex; flex-direction: column; gap: 8px; padding-right: 0;">
                            <!-- Canvas -->
                            <div style="display: flex; flex-direction: column;">
                                <div style="text-align: center; margin-bottom: 6px; font-size: 11px; font-weight: bold; color: #333;">Preview</div>
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
                        
                        <!-- Right Column - Traits + Export -->
                        <div style="flex: 0 0 220px; display: flex; flex-direction: column; gap: 8px; padding-left: 0;">
                            <div style="text-align: center; font-size: 11px; font-weight: bold; color: #333;">Traits</div>
                            <div id="category-buttons" style="display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; padding: 0 8px;">
                                <!-- Category buttons will be generated here -->
                            </div>
                            
                            <!-- Export Button -->
                            <div style="flex: 0 0 auto; padding: 0 8px;">
                                <button id="nft-export-btn" style="width: 100%; padding: 8px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px; text-align: left;">💾 Export</button>
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
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('100k-first-time.mp4.mp4', '100k First Time')">🎬 100k First Time</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('10k-weirdos-mint.mp4.mp4', '10K Weirdos Mint')">🎬 10K Weirdos Mint</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('9-btc.mp4.mp4', '9.btc')">🎬 9.btc</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('aweirdos-manifesto.mp4.mp4', 'A Weirdos Manifesto')">🎬 A Weirdos Manifesto</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('bitcoin-goingto-zero.mp4.mp4', 'Bitcoin Going to Zero')">🎬 Bitcoin Going to Zero</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('ftw.mp4.mp4', 'FTW')">🎬 FTW</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('fuck-the-world.mp4.mp4', 'FUCK THE WORLD')">🎬 FUCK THE WORLD</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('it-was-not-luck.mp4.mp4', 'It Was Not Luck')">🎬 It Was Not Luck</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('itsover wereback.mp4.mp4', 'Its Over Were Back')">🎬 Its Over Were Back</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('music.mp4.mp4', 'Music')">🎬 Music</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('never-kill-yourself.mp4.mp4', 'Never Kill Yourself')">🎬 Never Kill Yourself</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('remember-why.mp4.mp4', 'Remember Why')">🎬 Remember Why</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('runes-are-dead.mp4.mp4', 'Runes Are Dead')">🎬 Runes Are Dead</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('secret-stuff.mp4.mp4', 'Secret Stuff')">🎬 Secret Stuff</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('theyrenot-likeus.mp4.mp4', 'Theyre Not Like Us')">🎬 Theyre Not Like Us</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('timelaps-art.mp4.mp4', 'Timelapse Art')">🎬 Timelapse Art</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('weirdos-show.mp4.mp4', 'Weirdos Show')">🎬 Weirdos Show</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('woooooo.mp4.mp4', 'Woooooo')">🎬 Woooooo</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('wpzn.mp4.mp4', 'WPZN')">🎬 WPZN</div>
                            <div style="padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer;" onclick="window.desktop.openVideoPlayer('bitch.mp4', 'Bitch')">🎬 Bitch</div>
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
                // Special handling for 174.png - open external link
                if (targetIcon === 'image-174') {
                    window.open('https://ordinals.com/children/4967dd42d34696a4f41143ed05ad52805624ef3fb478d72666fba9c7c5d268a9i0', '_blank');
                } else {
                this.openWindow(targetIcon);
                }
                break;
            case 'explore':
                // Special handling for 174.png - open external link
                if (targetIcon === 'image-174') {
                    window.open('https://ordinals.com/children/4967dd42d34696a4f41143ed05ad52805624ef3fb478d72666fba9c7c5d268a9i0', '_blank');
                } else {
                this.openWindow(targetIcon);
                }
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
        // Windows now use fixed sizing, no dynamic resizing on browser resize
        // (Maximized mode is still handled separately)
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

    setupWiFiPopup() {
        // Create WiFi popup element
        const wifiPopup = document.createElement('div');
        wifiPopup.id = 'wifi-popup';
        wifiPopup.style.cssText = `
            position: fixed;
            bottom: 35px;
            right: 10px;
            width: 250px;
            background: #ece9d8;
            border: 1px solid #999;
            border-top: 2px solid #fff;
            border-left: 2px solid #fff;
            border-right: 2px solid #666;
            border-bottom: 2px solid #666;
            display: none;
            z-index: 2000;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        `;
        
        wifiPopup.innerHTML = `
            <div style="background: linear-gradient(to bottom, #0a2463 0%, #1e3a8a 50%, #0a2463 100%); padding: 4px 8px; color: white; font-size: 11px; font-weight: bold;">
                Wireless Network Connection
            </div>
            <div style="padding: 12px;">
                <div style="font-size: 11px; margin-bottom: 8px; color: #000;">Available Networks:</div>
                <div style="background: white; border: 1px solid #999; padding: 8px;">
                    <div style="display: flex; align-items: center; padding: 6px; background: #316ac5; color: white; cursor: pointer;">
                        <span style="margin-right: 8px;">📶</span>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 11px;">Fuck the wifi</div>
                            <div style="font-size: 9px; opacity: 0.9;">Security-enabled network</div>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 8px; text-align: right;">
                    <button style="padding: 4px 12px; border: 1px solid #999; background: #e0e0e0; cursor: pointer; font-size: 11px;" onclick="document.getElementById('wifi-popup').style.display='none'">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(wifiPopup);
        
        // Add click event to WiFi icon
        setTimeout(() => {
            const wifiIcon = document.querySelector('.wifi-icon');
            if (wifiIcon) {
                wifiIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const popup = document.getElementById('wifi-popup');
                    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
                });
            }
        }, 100);
        
        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('wifi-popup');
            const wifiIcon = document.querySelector('.wifi-icon');
            if (popup && !popup.contains(e.target) && e.target !== wifiIcon) {
                popup.style.display = 'none';
            }
        });
    }

    // Method to handle Paint-to-Weirdos Builder communication
    sendToNFTBuilder(layer, dataURL) {
        // Check if Weirdos Builder window exists
        const nftBuilderWindow = this.windows.find(w => w.dataset.windowType === 'nft-builder');
        
        if (!nftBuilderWindow) {
            // Auto-open Weirdos Builder window
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
