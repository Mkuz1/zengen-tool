/**
 * ZenGen Studio - Fixed Entry Version
 */

// --- 1. SIMPLE AUDIO LIBRARY ---
const NATURAL_SOUNDS = {
    forest: [
        { id: 'forest1', name: 'Forest Birds', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1237.mp3' },
        { id: 'forest2', name: 'Forest Stream', url: 'https://assets.mixkit.co/sfx/preview/mixkit-river-stream-flow-1257.mp3' }
    ],
    ocean: [
        { id: 'ocean1', name: 'Ocean Waves', url: 'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1246.mp3' },
        { id: 'ocean2', name: 'Beach Waves', url: 'https://assets.mixkit.co/sfx/preview/mixkit-waves-on-the-beach-1256.mp3' }
    ],
    rain: [
        { id: 'rain1', name: 'Light Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-1241.mp3' },
        { id: 'rain2', name: 'Heavy Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-heavy-rain-loop-1242.mp3' }
    ],
    fireplace: [
        { id: 'fire1', name: 'Fire Crackle', url: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackle-1330.mp3' },
        { id: 'fire2', name: 'Fireplace', url: 'https://assets.mixkit.co/sfx/preview/mixkit-cosy-fireplace-crackles-1240.mp3' }
    ],
    snow: [
        { id: 'snow1', name: 'Snow Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-in-the-trees-1250.mp3' },
        { id: 'snow2', name: 'Blizzard', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-storm-ambience-1254.mp3' }
    ]
};

// --- 2. SIMPLE AUDIO PLAYER ---
class SimpleAudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = 0.7;
        this.isPlaying = false;
    }
    
    play(url) {
        this.stop();
        this.audio.src = url;
        this.audio.play().then(() => {
            this.isPlaying = true;
            console.log("Audio playing");
        }).catch(e => {
            console.log("Audio blocked, click Play button");
        });
    }
    
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }
}

const audioPlayer = new SimpleAudioPlayer();

// --- 3. SIMPLE INITIALIZATION ---
function initStudio() {
    console.log("Initializing studio...");
    
    // Hide splash screen
    const startScreen = document.getElementById('startScreen');
    const workspace = document.getElementById('workspace');
    
    if (startScreen && workspace) {
        startScreen.style.opacity = '0';
        
        setTimeout(() => {
            startScreen.style.display = 'none';
            workspace.style.display = 'flex';
            loadAudioOptions();
            console.log("Studio loaded successfully");
        }, 500);
    } else {
        console.error("Required elements not found");
        alert("Error loading studio. Please refresh the page.");
    }
}

function loadAudioOptions() {
    const theme = document.getElementById('themeSelect');
    const audioSelect = document.getElementById('audioVariant');
    
    if (!theme || !audioSelect) return;
    
    const selectedTheme = theme.value;
    const sounds = NATURAL_SOUNDS[selectedTheme] || [];
    
    // Clear and populate audio options
    audioSelect.innerHTML = '';
    sounds.forEach(sound => {
        const option = document.createElement('option');
        option.value = sound.url;
        option.textContent = sound.name;
        audioSelect.appendChild(option);
    });
    
    // Enable record button
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.disabled = false;
    }
}

// --- 4. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up event listeners...");
    
    // Enter Studio button
    const enterBtn = document.getElementById('enterStudioBtn');
    if (enterBtn) {
        enterBtn.addEventListener('click', initStudio);
        console.log("Enter button listener added");
    } else {
        console.error("Enter button not found");
    }
    
    // Theme change listener
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', loadAudioOptions);
    }
    
    // Generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateContent);
    }
    
    // Play/Pause button
    const playBtn = document.getElementById('playPauseBtn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlay);
    }
    
    // Record button
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.addEventListener('click', startRecording);
    }
    
    // Copy buttons
    document.querySelectorAll('[id^="copy"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.id.replace('copy', '').replace('Btn', '');
            copyToClip(targetId.toLowerCase() + (targetId === 'Title' ? '' : targetId === 'Desc' ? 'cription' : 'Tags'));
        });
    });
    
    // Load initial audio options
    setTimeout(loadAudioOptions, 100);
});

// --- 5. BASIC FUNCTIONS ---
function togglePlay() {
    const playBtn = document.getElementById('playPauseBtn');
    const audioSelect = document.getElementById('audioVariant');
    
    if (!audioPlayer.isPlaying) {
        // Play
        const audioUrl = audioSelect.value;
        if (audioUrl) {
            audioPlayer.play(audioUrl);
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            showMessage("Audio playing - Click Test Audio if you don't hear sound");
        } else {
            showMessage("Please select an audio track first");
        }
    } else {
        // Pause
        audioPlayer.stop();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

function generateContent() {
    showMessage("Generating content...");
    
    // For now, just show a message
    setTimeout(() => {
        showMessage("Content ready! Click Play to hear audio");
        
        // Generate SEO
        const theme = document.getElementById('themeSelect').value;
        generateSEO(theme);
    }, 1500);
}

function generateSEO(theme) {
    const titles = [
        `Peaceful ${theme} Sounds for Sleep`,
        `Calming ${theme} Ambience for Relaxation`,
        `Soothing ${theme} Sounds for Meditation`
    ];
    
    const title = titles[Math.floor(Math.random() * titles.length)];
    const desc = `Enjoy this relaxing ${theme} ambience. Perfect for sleep, study, and meditation. Royalty-free natural sounds.`;
    
    document.getElementById('videoTitle').value = title;
    document.getElementById('videoDesc').value = desc;
    
    // Generate tags
    const tags = [`#${theme}`, '#relax', '#sleep', '#meditation', '#naturesounds', '#calm', '#peaceful', '#ambience'];
    document.getElementById('videoTags').value = tags.join(' ');
}

function copyToClip(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.select();
        document.execCommand('copy');
        showMessage("Copied to clipboard!");
    }
}

function startRecording() {
    showMessage("Recording feature will be implemented in the next version");
    // Recording functionality to be added
}

function showMessage(text) {
    // Create or update message element
    let message = document.getElementById('statusMessage');
    if (!message) {
        message = document.createElement('div');
        message.id = 'statusMessage';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
        `;
        document.body.appendChild(message);
    }
    
    message.textContent = text;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 500);
    }, 3000);
}

// --- 6. FALLBACK VIDEO FUNCTIONALITY ---
// This will be expanded in the next version
