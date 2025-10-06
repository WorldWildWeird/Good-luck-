/**
 * Firebase Chat Integration
 * Isolated chat functionality that doesn't modify existing code
 * Loads only when conditions are met and handles errors gracefully
 */

(function() {
    'use strict';
    
    // Private scope - no globals
    let firebaseApp = null;
    let firestoreDb = null;
    let chatApp = null;
    let isInitialized = false;
    
    // Configuration - replace with your Firebase project config
    const FIREBASE_CONFIG = {
        apiKey: "your-api-key",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "your-app-id"
    };
    
    // Firebase SDK URLs
    const FIREBASE_SDK_URLS = {
        app: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js',
        firestore: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js'
    };
    
    /**
     * Safely load Firebase SDK modules
     */
    async function loadFirebaseModule(url, moduleName) {
        try {
            const module = await import(url);
            console.log(`Firebase ${moduleName} loaded successfully`);
            return module;
        } catch (error) {
            console.error(`Failed to load Firebase ${moduleName}:`, error);
            throw error;
        }
    }
    
    /**
     * Initialize Firebase with error handling
     */
    async function initializeFirebase() {
        try {
            // Load Firebase modules
            const { initializeApp } = await loadFirebaseModule(FIREBASE_SDK_URLS.app, 'App');
            const { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } = 
                await loadFirebaseModule(FIREBASE_SDK_URLS.firestore, 'Firestore');
            
            // Initialize Firebase app
            firebaseApp = initializeApp(FIREBASE_CONFIG);
            firestoreDb = getFirestore(firebaseApp);
            
            console.log('Firebase initialized successfully');
            return { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy };
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Firebase Chat Application Class
     */
    class FirebaseChatApp {
        constructor(firebaseModules) {
            this.messagesContainer = null;
            this.inputField = null;
            this.sendButton = null;
            this.clearButton = null;
            this.userName = null;
            this.isInitialized = false;
            this.unsubscribe = null;
            this.firebase = firebaseModules;
        }
        
        async init(chatWindow) {
            try {
                this.messagesContainer = chatWindow.querySelector('#chat-messages');
                this.inputField = chatWindow.querySelector('#chat-input');
                this.sendButton = chatWindow.querySelector('#chat-send-btn');
                this.clearButton = chatWindow.querySelector('#chat-clear-btn');
                
                if (!this.messagesContainer || !this.inputField || !this.sendButton) {
                    throw new Error('Required chat elements not found');
                }
                
                // Get user nickname for this session
                this.userName = await this.promptForNickname();
                
                this.setupEventListeners();
                this.setupFirestoreListener();
                this.addSystemMessage(`${this.userName} joined the chat`);
                
                console.log('Firebase chat initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Firebase chat:', error);
                this.showErrorMessage('Failed to initialize chat. Using local mode.');
            }
        }
        
        async promptForNickname() {
            return new Promise((resolve) => {
                const nickname = prompt('Enter your nickname for the chat:');
                if (nickname && nickname.trim()) {
                    resolve(nickname.trim());
                } else {
                    // Default nickname if user cancels
                    resolve(`User${Math.floor(Math.random() * 1000)}`);
                }
            });
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
            if (message && this.userName) {
                try {
                    await this.firebase.addDoc(this.firebase.collection(firestoreDb, 'messages'), {
                        name: this.userName,
                        message: message,
                        timestamp: this.firebase.serverTimestamp()
                    });
                    this.inputField.value = '';
                } catch (error) {
                    console.error('Error sending message:', error);
                    this.addSystemMessage('Error sending message. Please try again.');
                }
            }
        }
        
        setupFirestoreListener() {
            try {
                const messagesQuery = this.firebase.query(
                    this.firebase.collection(firestoreDb, 'messages'), 
                    this.firebase.orderBy('timestamp', 'asc')
                );
                
                this.unsubscribe = this.firebase.onSnapshot(messagesQuery, (snapshot) => {
                    if (!this.isInitialized) {
                        // Clear the container on first load
                        this.messagesContainer.innerHTML = '';
                        this.isInitialized = true;
                    }
                    
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const data = change.doc.data();
                            this.displayMessage(data);
                        }
                    });
                    
                    // Scroll to bottom
                    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                }, (error) => {
                    console.error('Error listening to messages:', error);
                    this.addSystemMessage('Error connecting to chat. Please refresh the page.');
                });
            } catch (error) {
                console.error('Failed to setup Firestore listener:', error);
                this.addSystemMessage('Failed to connect to real-time chat.');
            }
        }
        
        displayMessage(data) {
            const messageDiv = document.createElement('div');
            const timestamp = data.timestamp ? 
                new Date(data.timestamp.toDate()).toLocaleTimeString() : 
                new Date().toLocaleTimeString();
            
            if (data.name === this.userName) {
                messageDiv.innerHTML = `<span style="color: #0000FF;">[${timestamp}] You:</span> ${data.message}`;
            } else {
                messageDiv.innerHTML = `<span style="color: #008000;">[${timestamp}] ${data.name}:</span> ${data.message}`;
            }
            
            messageDiv.style.marginBottom = '4px';
            this.messagesContainer.appendChild(messageDiv);
        }
        
        addSystemMessage(text) {
            const messageDiv = document.createElement('div');
            const timestamp = new Date().toLocaleTimeString();
            messageDiv.innerHTML = `<span style="color: #666; font-style: italic;">[${timestamp}] System:</span> ${text}`;
            messageDiv.style.marginBottom = '4px';
            this.messagesContainer.appendChild(messageDiv);
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
        
        showErrorMessage(text) {
            if (this.messagesContainer) {
                this.messagesContainer.innerHTML = `<div style="color: #ff0000; font-weight: bold;">${text}</div>`;
            }
        }
        
        clearChat() {
            if (confirm('Are you sure you want to clear all chat messages?')) {
                this.messagesContainer.innerHTML = '<div style="color: #666; font-style: italic;">Chat cleared. Welcome to Chat!</div>';
            }
        }
        
        destroy() {
            if (this.unsubscribe) {
                this.unsubscribe();
            }
        }
    }
    
    /**
     * Check if chat should be enabled
     */
    function shouldEnableChat() {
        return window.ENABLE_CHAT === true && 
               document.querySelector('#chat-messages') !== null;
    }
    
    /**
     * Initialize Firebase chat if conditions are met
     */
    async function initializeChat() {
        if (isInitialized || !shouldEnableChat()) {
            return;
        }
        
        try {
            console.log('Initializing Firebase chat...');
            const firebaseModules = await initializeFirebase();
            
            // Find the chat window
            const chatWindow = document.querySelector('#chat-messages').closest('.window');
            if (!chatWindow) {
                throw new Error('Chat window not found');
            }
            
            // Initialize chat app
            chatApp = new FirebaseChatApp(firebaseModules);
            await chatApp.init(chatWindow);
            
            isInitialized = true;
            console.log('Firebase chat ready');
            
        } catch (error) {
            console.error('Failed to initialize Firebase chat:', error);
            // Gracefully disable chat without breaking the site
            if (document.querySelector('#chat-messages')) {
                document.querySelector('#chat-messages').innerHTML = 
                    '<div style="color: #666; font-style: italic;">Chat temporarily unavailable.</div>';
            }
        }
    }
    
    /**
     * Auto-initialize when DOM is ready
     */
    function autoInitialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeChat);
        } else {
            initializeChat();
        }
    }
    
    /**
     * Watch for chat elements to appear dynamically
     */
    function watchForChatElements() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.querySelector && node.querySelector('#chat-messages')) {
                            initializeChat();
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Start watching for chat elements
    watchForChatElements();
    
    // Auto-initialize if conditions are already met
    autoInitialize();
    
    // Expose minimal API for manual control (optional)
    window.FirebaseChat = {
        initialize: initializeChat,
        destroy: () => {
            if (chatApp) {
                chatApp.destroy();
                chatApp = null;
                isInitialized = false;
            }
        }
    };
    
})();
