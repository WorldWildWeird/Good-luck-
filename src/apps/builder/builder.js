/**
 * NFT Builder Application
 * Handles NFT creation with trait selection and custom art integration
 */

export class NFTBuilderApplication {
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
