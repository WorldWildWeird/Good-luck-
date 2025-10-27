/**
 * Paint Application
 * Handles drawing functionality with canvas tools
 */

export class PaintApplication {
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
        this.history = []; // Array to store canvas states for undo functionality
        this.historyIndex = -1; // Current position in history
        this.maxHistorySize = 20; // Maximum number of undo states to keep
    }

    init(canvas) {
        this.canvas = canvas;
        this.setupCanvas();
        this.setupGuideOverlay();
        this.setupEventListeners();
        // Initialize back button state
        this.updateBackButtonState();
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
        
        // Save initial empty state
        this.saveState();
        
        // Prevent canvas resizing
        this.preventCanvasResize();
    }

    setupEventListeners() {
        // Tool selection - Brush type dropdown
        document.getElementById('paint-brush-type').addEventListener('change', (e) => {
            this.selectTool(e.target.value);
        });

        // Eraser button
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

        // Back button (undo)
        document.getElementById('paint-back-btn').addEventListener('click', () => {
            this.undo();
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
        
        // Update UI states
        const brushTypeDropdown = document.getElementById('paint-brush-type');
        const eraserBtn = document.getElementById('paint-eraser-tool');
        
        if (tool === 'eraser') {
            // Eraser is selected - highlight eraser button
            eraserBtn.classList.add('active');
        } else {
            // Brush or Spray is selected - update dropdown and remove eraser highlight
            eraserBtn.classList.remove('active');
            brushTypeDropdown.value = tool;
        }
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
        
        if (this.currentTool === 'spray') {
            this.drawSpray(pos.x, pos.y);
        } else {
            this.drawLine(this.lastX, this.lastY, pos.x, pos.y);
        }
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    stopDrawing(e) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.canvas.releasePointerCapture(e.pointerId);
            // Save state after drawing is complete
            this.saveState();
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
        if (this.currentTool === 'spray') {
            this.drawSpray(x, y);
            return;
        }
        
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

    drawSpray(x, y) {
        // Spray paint creates scattered dots in a radius around the cursor
        const density = 25; // Number of dots per spray
        const radius = this.currentSize * 1.5; // Spray radius based on brush size (more concentrated)
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = this.currentColor;
        
        for (let i = 0; i < density; i++) {
            // Random angle and distance for natural spray effect
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            const sprayX = x + Math.cos(angle) * distance;
            const sprayY = y + Math.sin(angle) * distance;
            
            // Draw small dots for spray effect
            this.ctx.beginPath();
            this.ctx.arc(sprayX, sprayY, 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    clearCanvas() {
        // Enforce canvas size before clearing
        this.enforceCanvasSize();
        this.ctx.clearRect(0, 0, 500, 500);
        // Save state after clearing
        this.saveState();
    }

    saveState() {
        // Save current canvas state to history
        const imageData = this.ctx.getImageData(0, 0, 500, 500);
        
        // Remove any states after current index (when user draws after undoing)
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        this.history.push(imageData);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
        
        // Update back button state
        this.updateBackButtonState();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const previousState = this.history[this.historyIndex];
            this.ctx.putImageData(previousState, 0, 0);
            this.updateBackButtonState();
            this.showToast('Undo successful', 'success');
        } else {
            this.showToast('Nothing to undo', 'info');
        }
    }

    updateBackButtonState() {
        const backBtn = document.getElementById('paint-back-btn');
        if (backBtn) {
            if (this.historyIndex > 0) {
                backBtn.disabled = false;
                backBtn.style.opacity = '1';
                backBtn.style.cursor = 'pointer';
            } else {
                backBtn.disabled = true;
                backBtn.style.opacity = '0.5';
                backBtn.style.cursor = 'not-allowed';
            }
        }
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
        
        // Send to Weirdos Builder via desktop
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
