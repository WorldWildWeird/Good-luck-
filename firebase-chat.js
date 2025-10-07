/**
 * Firebase Chat Integration
 * Integrates with existing chat system using Firebase Web v9 modular SDK
 */

import { app, db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    serverTimestamp, 
    query, 
    orderBy,
    limit 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

// Firebase state
let isFirebaseInitialized = false;
let unsubscribeMessages = null;

/**
 * Initialize Firebase with error handling
 */
async function initializeFirebase() {
    try {
        console.log('Initializing Firebase...');
        console.log('App:', app);
        console.log('DB:', db);
        
        if (isFirebaseInitialized) {
            console.log('Firebase already initialized');
            return { app, db };
        }

        // Firebase is already initialized in firebase-config.js
        isFirebaseInitialized = true;
        
        console.log('Firebase initialized successfully');
        return { app, db };
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        showToast('Failed to connect to chat server', 'error');
        throw error;
    }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 12px;
        max-width: 300px;
        word-wrap: break-word;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

/**
 * Send a message to Firestore
 */
async function sendMessageToFirestore(username, messageText) {
    try {
        console.log('Attempting to send message:', { username, messageText });
        
        if (!isFirebaseInitialized) {
            console.log('Firebase not initialized, initializing now...');
            await initializeFirebase();
        }

        console.log('Adding message to Firestore collection...');
        const docRef = await addDoc(collection(db, 'messages'), {
            message: messageText,
            username: username,
            timestamp: serverTimestamp()
        });
        
        console.log('Message sent to Firestore with ID:', docRef.id);
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
        throw error;
    }
}

/**
 * Listen to new messages from Firestore
 */
function listenToMessages(messagesContainer) {
    try {
        console.log('Setting up message listener...');
        console.log('Messages container:', messagesContainer);
        
        if (!isFirebaseInitialized) {
            console.log('Firebase not initialized, cannot listen to messages');
            return;
        }

        console.log('Creating messages query...');
        const messagesQuery = query(
            collection(db, 'messages'),
            orderBy('timestamp', 'asc'),
            limit(100) // Limit to last 100 messages
        );

        unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            console.log('Received snapshot with', snapshot.docs.length, 'documents');
            
            // Check if this is the first load (no existing messages or only welcome message)
            const isFirstLoad = messagesContainer.children.length === 0 || 
                (messagesContainer.children.length === 1 && 
                 messagesContainer.children[0].textContent.includes('Welcome to Chat'));
            
            console.log('Is first load:', isFirstLoad);
            
            if (isFirstLoad) {
                // Clear container and load all existing messages
                messagesContainer.innerHTML = '';
                if (snapshot.docs.length === 0) {
                    // Show welcome message if no messages exist
                    const welcomeDiv = document.createElement('div');
                    welcomeDiv.innerHTML = '<div style="color: #666; font-style: italic;">Welcome to Chat! Start the conversation...</div>';
                    welcomeDiv.style.marginBottom = '4px';
                    messagesContainer.appendChild(welcomeDiv);
                } else {
                    snapshot.docs.forEach((doc) => {
                        const data = doc.data();
                        displayFirebaseMessage(messagesContainer, data);
                    });
                }
            } else {
                // Only process new messages
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        displayFirebaseMessage(messagesContainer, data);
                    }
                });
            }

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, (error) => {
            console.error('Error listening to messages:', error);
            showToast('Connection to chat lost', 'error');
        });

    } catch (error) {
        console.error('Failed to setup message listener:', error);
        showToast('Failed to connect to real-time chat', 'error');
    }
}

/**
 * Display a message from Firestore
 */
function displayFirebaseMessage(messagesContainer, data) {
    const messageDiv = document.createElement('div');
    const timestamp = data.timestamp ? 
        new Date(data.timestamp.toDate()).toLocaleTimeString() : 
        new Date().toLocaleTimeString();
    
    // Get current username from localStorage
    const currentUsername = localStorage.getItem('chatUsername');
    
    if (data.username === currentUsername) {
        messageDiv.innerHTML = `<span style="color: #0000FF;">[${timestamp}] You:</span> ${data.message}`;
    } else {
        messageDiv.innerHTML = `<span style="color: #008000;">[${timestamp}] ${data.username}:</span> ${data.message}`;
    }
    
    messageDiv.style.marginBottom = '4px';
    messagesContainer.appendChild(messageDiv);
}

/**
 * Stop listening to messages
 */
function stopListeningToMessages() {
    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }
}

/**
 * Initialize Firebase chat integration
 */
async function initializeFirebaseChat() {
    try {
        await initializeFirebase();
        console.log('Firebase chat integration ready');
        showToast('Connected to chat server', 'success');
        return true;
    } catch (error) {
        console.error('Firebase chat initialization failed:', error);
        showToast('Chat server unavailable - using local mode', 'error');
        return false;
    }
}

// Export functions for use by the main chat system
window.FirebaseChat = {
    initialize: initializeFirebaseChat,
    sendMessage: sendMessageToFirestore,
    listenToMessages: listenToMessages,
    stopListening: stopListeningToMessages,
    showToast: showToast
};
