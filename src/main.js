/**
 * Main Entry Point for XP Weirdos
 * Initializes all modules and starts the desktop
 */

// Load Firebase configuration first
import './core/firebase-config.js';
import './core/firebase-chat.js';

import { WindowsXPDesktop } from './ui/desktop.js';
import { ChatApplication } from './apps/chat/chat.js';
import { PaintApplication } from './apps/paint/paint.js';
import { NFTBuilderApplication } from './apps/builder/builder.js';
import { VideoPlayerWindow } from './apps/video/video.js';
import { MusicPlayer } from './apps/music/music.js';

// Global variables for compatibility
window.globalChatApp = null;
window.chatAppInitialized = false;

// Initialize the desktop when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize desktop
    window.desktop = new WindowsXPDesktop();
    
    // Initialize music player
    const musicPlayer = new MusicPlayer();
    musicPlayer.init();
    
    // Initialize notification system
    initNotification();
});

// Notification system
function initNotification() {
    const notificationIcon = document.querySelector('.notification-icon');
    if (!notificationIcon) return;
    
    let notificationCount = 0;
    
    // Add click handler for notification icon
    notificationIcon.addEventListener('click', () => {
        // Show a simple notification popup
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            width: 300px;
            background: #ece9d8;
            border: 2px solid #999;
            border-top: 2px solid #fff;
            border-left: 2px solid #fff;
            border-right: 2px solid #666;
            border-bottom: 2px solid #666;
            padding: 15px;
            z-index: 10000;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
            font-family: Tahoma, sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: bold; font-size: 12px;">Notifications</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #D93441; color: white; border: 1px solid #8E2831; width: 18px; height: 18px; cursor: pointer; font-size: 11px; line-height: 1;">×</button>
            </div>
            <div style="font-size: 11px; line-height: 1.4;">
                <div style="margin-bottom: 8px;">🔔 Welcome to XP Weirdos!</div>
                <div style="margin-bottom: 8px;">🎨 Try the Paint app to create custom art</div>
                <div style="margin-bottom: 8px;">🎲 Use the Weirdos Builder to create NFTs</div>
                <div style="margin-bottom: 8px;">🎵 Click the music icon to play tunes</div>
                <div style="margin-bottom: 8px;">💬 Chat with other weirdos</div>
                <div style="color: #666; font-style: italic;">Don't forget to eat some ice cream 🍦</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    });
    
    // Simulate notification count updates
    setInterval(() => {
        notificationCount++;
        const badge = notificationIcon.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = `+${notificationCount}`;
        }
    }, 30000); // Update every 30 seconds
}

// Export classes for global access
window.ChatApplication = ChatApplication;
window.PaintApplication = PaintApplication;
window.NFTBuilderApplication = NFTBuilderApplication;
window.VideoPlayerWindow = VideoPlayerWindow;
window.MusicPlayer = MusicPlayer;
