/**
 * Music Player Application
 * Handles music playback with a simple player interface
 */

export class MusicPlayer {
    constructor() {
        this.musicPlayerWindow = null;
        this.currentAudio = null;
        this.songIcon = null;
    }

    init() {
        this.songIcon = document.querySelector('.song-icon');
        if (!this.songIcon) return;
        
        this.songIcon.addEventListener('click', () => {
            this.toggleMusicPlayer();
        });
    }

    toggleMusicPlayer() {
        // If window already exists, just show it
        if (this.musicPlayerWindow && document.body.contains(this.musicPlayerWindow)) {
            if (this.musicPlayerWindow.style.display === 'none') {
                this.musicPlayerWindow.style.display = 'block';
            }
            this.musicPlayerWindow.style.zIndex = 9999;
            return;
        }
        
        this.createMusicPlayerWindow();
    }

    createMusicPlayerWindow() {
        // Create music player window
        this.musicPlayerWindow = document.createElement('div');
        this.musicPlayerWindow.className = 'music-player-popup';
        this.musicPlayerWindow.style.cssText = `
            position: fixed;
            bottom: 40px;
            right: 10px;
            width: 300px;
            background: #ECE9D8;
            border: 2px solid #0054E3;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
            z-index: 9999;
            font-family: Tahoma, sans-serif;
        `;
        
        this.musicPlayerWindow.innerHTML = `
            <div style="background: linear-gradient(to right, #0054E3, #0A5FE3); padding: 3px 5px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: white; font-size: 11px; font-weight: bold;">Music Player</span>
                <div style="display: flex; gap: 2px;">
                    <button class="minimize-music-btn" style="background: #D1D1D1; color: #000; border: 1px solid #8E8E8E; width: 18px; height: 18px; cursor: pointer; font-size: 11px; line-height: 1;">_</button>
                    <button class="close-music-btn" style="background: #D93441; color: white; border: 1px solid #8E2831; width: 18px; height: 18px; cursor: pointer; font-size: 11px; line-height: 1;">×</button>
                </div>
            </div>
            <div style="padding: 10px;">
                <div class="song-list-simple">
                    <div class="song-item-simple" data-song="song/music.mp3" style="padding: 6px 8px; margin-bottom: 4px; cursor: pointer; background: white; border: 1px solid #ccc; font-size: 11px;">
                        🎵 music.mp3
                    </div>
                    <div class="song-item-simple" data-song="song/woooooo.mp3" style="padding: 6px 8px; margin-bottom: 4px; cursor: pointer; background: white; border: 1px solid #ccc; font-size: 11px;">
                        🎵 woooooo.mp3
                    </div>
                    <div class="song-item-simple" data-song="song/9-btc.mp3" style="padding: 6px 8px; margin-bottom: 4px; cursor: pointer; background: white; border: 1px solid #ccc; font-size: 11px;">
                        🎵 9-btc.mp3
                    </div>
                    <div class="song-item-simple" data-song="song/itsover wereback.mp3" style="padding: 6px 8px; margin-bottom: 4px; cursor: pointer; background: white; border: 1px solid #ccc; font-size: 11px;">
                        🎵 itsover wereback.mp3
                    </div>
                    <div class="song-item-simple" data-song="song/bitch.mp3" style="padding: 6px 8px; margin-bottom: 4px; cursor: pointer; background: white; border: 1px solid #ccc; font-size: 11px;">
                        🎵 bitch.mp3
                    </div>
                </div>
                <div class="player-area" style="display: none; margin-top: 10px; padding: 8px; background: #f5f5f5; border: 1px solid #ccc;">
                    <div class="now-playing-text" style="font-size: 10px; margin-bottom: 6px; font-weight: bold;">Now Playing:</div>
                    <audio controls style="width: 100%;" class="audio-element">
                        <source src="" type="audio/mpeg">
                    </audio>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.musicPlayerWindow);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button handler
        const closeBtn = this.musicPlayerWindow.querySelector('.close-music-btn');
        closeBtn.addEventListener('click', () => {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            this.musicPlayerWindow.remove();
            this.musicPlayerWindow = null;
        });
        
        // Minimize button handler
        const minimizeBtn = this.musicPlayerWindow.querySelector('.minimize-music-btn');
        minimizeBtn.addEventListener('click', () => {
            this.musicPlayerWindow.style.display = 'none';
        });
        
        // Song selection
        const songItems = this.musicPlayerWindow.querySelectorAll('.song-item-simple');
        const playerArea = this.musicPlayerWindow.querySelector('.player-area');
        const audioElement = this.musicPlayerWindow.querySelector('.audio-element');
        const nowPlayingText = this.musicPlayerWindow.querySelector('.now-playing-text');
        
        songItems.forEach(item => {
            item.addEventListener('click', () => {
                const songPath = item.getAttribute('data-song');
                const songName = item.textContent.trim();
                
                // Stop current audio if playing
                if (this.currentAudio) {
                    this.currentAudio.pause();
                }
                
                // Set new audio source
                audioElement.src = songPath;
                this.currentAudio = audioElement;
                nowPlayingText.textContent = `Now Playing: ${songName}`;
                
                // Show player area
                playerArea.style.display = 'block';
                
                // Auto play
                audioElement.play();
                
                // Highlight selected song
                songItems.forEach(s => s.style.background = 'white');
                item.style.background = '#D1E7FF';
            });
        });
    }
}
