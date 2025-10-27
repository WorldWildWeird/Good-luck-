/**
 * Chat Application
 * Handles chat functionality with Firebase integration
 */

// Import Firebase functions directly since we're using the existing firebase-chat.js
// The Firebase functions are available globally from the existing firebase-chat.js

// Global chat instance and initialization guard
let globalChatApp = null;
window.chatAppInitialized = false;

// Utility function to escape HTML and prevent XSS attacks
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export class ChatApplication {
    constructor() {
        this.messagesContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.clearButton = null;
        this.storageKey = 'windowsxp_chat_history';
        this.storageVersionKey = 'windowsxp_chat_version';
        this.currentVersion = '2.0'; // Version 2.0 includes XSS protection
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
        chatContent.appendChild(this.overlay);

        // Handle join button click
        joinButton.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            
            if (!username) {
                errorDiv.textContent = 'Please enter a username';
                errorDiv.style.display = 'block';
                return;
            }
            
            if (username.length < 2) {
                errorDiv.textContent = 'Username must be at least 2 characters';
                errorDiv.style.display = 'block';
                return;
            }
            
            if (username.length > 24) {
                errorDiv.textContent = 'Username must be 24 characters or less';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Store username and proceed
            localStorage.setItem(this.usernameKey, username);
            this.userName = username;
            this.hasLoggedIn = true;
            
            // Remove overlay
            this.overlay.remove();
            this.overlay = null;
            
            // Initialize chat
            this.initializeChat().catch(error => {
                console.error('Failed to initialize chat:', error);
            });
        });

        // Handle Enter key in username input
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinButton.click();
            }
        });

        // Focus the input
        usernameInput.focus();
    }

    async initializeChat() {
        try {
            // Try to initialize Firebase chat
            this.firebaseEnabled = await FirebaseChat.initialize();
            
            if (this.firebaseEnabled) {
                // Set up Firebase message listener
                FirebaseChat.listenToMessages(this.messagesContainer);
            } else {
                // Fall back to local storage
                this.loadLocalMessages();
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Show welcome message if no messages exist
            if (this.messagesContainer.children.length === 0) {
                this.addMessage('Welcome weirdo! Type a message below & eat cream.', 'system');
            }
            
        } catch (error) {
            console.error('Chat initialization failed:', error);
            // Fall back to local storage
            this.loadLocalMessages();
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Send button
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
            this.clearMessages();
        });
    }

    async sendMessage() {
        const messageText = this.inputField.value.trim();
        
        if (!messageText) {
            return;
        }
        
        // Clear input
        this.inputField.value = '';
        
        try {
            if (this.firebaseEnabled) {
                // Send via Firebase
                await FirebaseChat.sendMessage(this.userName, messageText);
            } else {
                // Send locally
                this.addMessage(`${this.userName}: ${messageText}`, 'user');
                this.saveLocalMessage(this.userName, messageText);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            // Fall back to local storage
            this.addMessage(`${this.userName}: ${messageText}`, 'user');
            this.saveLocalMessage(this.userName, messageText);
        }
    }

    addMessage(text, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '4px';
        
        if (type === 'system') {
            messageDiv.style.color = '#666';
            messageDiv.style.fontStyle = 'italic';
            messageDiv.textContent = text;
        } else {
            messageDiv.innerHTML = text;
        }
        
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    clearMessages() {
        this.messagesContainer.innerHTML = '';
        
        // Clear local storage
        localStorage.removeItem(this.storageKey);
        
        // Show welcome message
        this.addMessage('Welcome weirdo! Type a message below & eat cream.', 'system');
    }

    loadLocalMessages() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const messages = JSON.parse(stored);
                messages.forEach(msg => {
                    this.addMessage(`${msg.username}: ${msg.message}`, 'user');
                });
            }
        } catch (error) {
            console.error('Failed to load local messages:', error);
        }
    }

    saveLocalMessage(username, message) {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const messages = stored ? JSON.parse(stored) : [];
            
            messages.push({
                username: username,
                message: message,
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 100 messages
            if (messages.length > 100) {
                messages.splice(0, messages.length - 100);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(messages));
        } catch (error) {
            console.error('Failed to save local message:', error);
        }
    }
}

// Export the global chat app instance
export { globalChatApp };
