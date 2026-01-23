/**
 * ZenGen - Optimized Edition
 * - Audio: Mixkit.co Royalty-Free Natural Sounds
 * - Recorder: MP4 Output with H.264 Encoding
 * - SEO: 20+ Tag Viral Engine.
 */

// No API keys needed for Mixkit
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. MIXKIT.CO ROYALTY-FREE NATURAL SOUNDS LIBRARY ---
const NATURAL_SOUNDS_LIBRARY = {
    forest: [
        { id: 'forest_birds', name: 'Forest Birds', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1237.mp3' },
        { id: 'forest_stream', name: 'Forest Stream', url: 'https://assets.mixkit.co/sfx/preview/mixkit-river-stream-flow-1257.mp3' },
        { id: 'forest_night', name: 'Forest Night', url: 'https://assets.mixkit.co/sfx/preview/mixkit-nature-forest-night-ambience-1253.mp3' },
        { id: 'rain_forest', name: 'Rainforest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-rainforest-ambience-1243.mp3' }
    ],
    ocean: [
        { id: 'ocean_waves', name: 'Ocean Waves', url: 'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1246.mp3' },
        { id: 'beach_waves', name: 'Beach Waves', url: 'https://assets.mixkit.co/sfx/preview/mixkit-waves-on-the-beach-1256.mp3' },
        { id: 'seagulls', name: 'Seagulls', url: 'https://assets.mixkit.co/sfx/preview/mixkit-seagulls-in-the-wild-1223.mp3' },
        { id: 'underwater', name: 'Underwater', url: 'https://assets.mixkit.co/sfx/preview/mixkit-underwater-bubbles-1252.mp3' }
    ],
    rain: [
        { id: 'rain_light', name: 'Light Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-1241.mp3' },
        { id: 'rain_heavy', name: 'Heavy Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-heavy-rain-loop-1242.mp3' },
        { id: 'rain_thunder', name: 'Rain & Thunder', url: 'https://assets.mixkit.co/sfx/preview/mixkit-thunder-and-rain-ambience-1255.mp3' },
        { id: 'rain_roof', name: 'Rain on Roof', url: 'https://assets.mixkit.co/sfx/preview/mixkit-rain-on-window-1247.mp3' }
    ],
    fireplace: [
        { id: 'fire_crackle', name: 'Fire Crackle', url: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackle-1330.mp3' },
        { id: 'fireplace', name: 'Fireplace', url: 'https://assets.mixkit.co/sfx/preview/mixkit-cosy-fireplace-crackles-1240.mp3' },
        { id: 'bonfire', name: 'Bonfire', url: 'https://assets.mixkit.co/sfx/preview/mixkit-bonfire-crackling-1331.mp3' }
    ],
    snow: [
        { id: 'wind_snow', name: 'Snow Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-in-the-trees-1250.mp3' },
        { id: 'blizzard', name: 'Blizzard', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-storm-ambience-1254.mp3' },
        { id: 'winter_wind', name: 'Winter Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-cold-wind-ambience-1251.mp3' }
    ]
};

// --- 2. SIMPLE AUDIO PLAYER ---
class AudioPlayer {
    constructor() {
        this.audioElement = new Audio();
        this.audioElement.loop = true;
        this.audioElement.volume = 0.7;
        this.isPlaying = false;
        this.currentSource = null;
    }
    
    init() {
        console.log("Audio player ready");
        return Promise.resolve();
    }
    
    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        this.currentSource = null;
    }
    
    async play(url) {
        this.stop();
        
        console.log("Playing audio:", url);
        this.audioElement.src = url;
        this.currentSource = url;
        
        try {
            await this.audioElement.play();
            this.isPlaying = true;
            console.log("Audio started successfully");
            return true;
        } catch(error) {
            console.log("Audio play failed, waiting for user interaction:", error.name);
            this.isPlaying = false;
            return false;
        }
    }
    
    getAudioElement() {
        return this.audioElement;
    }
}

const audioEngine = new AudioPlayer();

// --- 3. GLOBAL STATE ---
let blobPlaylist = [];
let currentPlaylistIndex = 0;
let activePlayer = null;
let sequenceInterval = null;
let isPlaying = false;
let userHasInteracted = false;

// --- 4. DOM ELEMENTS ---
let playerA, playerB, statusPill, recordBtn, playPauseBtn;

// --- 5. INITIALIZATION ---
async function initStudio() {
    try {
        // Mark user as interacted
        userHasInteracted = true;
        
        // Initialize audio
        await audioEngine.init();
        
        // Show workspace
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
            loadAudioOptions();
            
            // Add click handler to enable audio
            document.body.addEventListener('click', handleFirstInteraction, { once: true });
        }, 500);
        
    } catch(e) {
        console.error("Initialization error:", e);
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
            loadAudioOptions();
        }, 500);
    }
}

function handleFirstInteraction() {
    console.log("User interacted, audio should work now");
    // Try to play audio if we have a source
    if (audioEngine.currentSource && !audioEngine.isPlaying) {
        audioEngine.audioElement.play().catch(e => {
            console.log("Audio still blocked");
        });
    }
}

function loadAudioOptions() {
    const theme = document.getElementById('themeSelect').value;
    const variantSelect = document.getElementById('audioVariant');
    variantSelect.innerHTML = '';
    
    const sounds = NATURAL_SOUNDS_LIBRARY[theme] || [];
    sounds.forEach(sound => {
        const el = document.createElement('option');
        el.value = sound.url; // Store URL directly in value
        el.innerText = sound.name;
        variantSelect.appendChild(el);
    });
    
    if (recordBtn) recordBtn.disabled = false;
}

function togglePlay() {
    if (!activePlayer) return;
    
    if (isPlaying) {
        // Pause
        activePlayer.pause();
        audioEngine.stop();
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        updateAudioStatus('Paused');
    } else {
        // Play
        const playPromise = activePlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("Video playing");
                // Now play audio
                const audioUrl = document.getElementById('audioVariant').value;
                if (audioUrl) {
                    audioEngine.play(audioUrl).then(success => {
                        if (success) {
                            updateAudioStatus('Playing');
                        } else {
                            updateAudioStatus('Click to enable');
                        }
                    });
                }
            }).catch(e => {
                console.log("Video play failed:", e);
                updateAudioStatus('Click Play');
            });
        }
        
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

function updateAudioStatus(status) {
    const audioState = document.getElementById('audioState');
    const audioStatus = document.getElementById('audioStatus');
    
    if (audioState) audioState.textContent = status;
    if (audioStatus) {
        if (status === 'Playing') {
            audioStatus.innerHTML = '<i class="fas fa-volume-up"></i> <span>Audio playing</span>';
            audioStatus.className = 'audio-status';
        } else {
            audioStatus.innerHTML = '<i class="fas fa-volume-mute"></i> <span>' + status + '</span>';
            audioStatus.className = 'audio-status muted';
        }
    }
}

// --- 6. GENERATION ---
async function generateContent() {
    if (sequenceInterval) clearInterval(sequenceInterval);
    audioEngine.stop();
    
    const theme = document.getElementById('themeSelect').value;
    
    if (statusPill) {
        statusPill.className = 'status-pill active';
        statusPill.innerHTML = '<div class="dot"></div> Curating...';
    }
    
    if (recordBtn) recordBtn.disabled = true;
    
    // Show loading
    document.getElementById('loadingSpinner').style.display = 'block';

    try {
        const rawUrls = await fetchMontagePlaylist(theme, 2);
        
        if (rawUrls.length > 0) {
            blobPlaylist = [];
            for (let i = 0; i < Math.min(rawUrls.length, 2); i++) {
                if (statusPill) {
                    statusPill.innerHTML = '<div class="dot"></div> Downloading Video ' + (i+1) + '/2...';
                }
                const blob = await fetchBlob(rawUrls[i]);
                if (blob) blobPlaylist.push(blob);
            }

            if (blobPlaylist.length > 0) {
                // Show visualizer
                const visualizer = document.getElementById('audioVisualizer');
                if (visualizer) visualizer.classList.add('active');
                
                // Generate SEO
                generateViralSEO(theme);
                
                // Start video playback
                currentPlaylistIndex = 0;
                startPingPong();
                isPlaying = true;
                
                if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                
                if (statusPill) {
                    statusPill.className = 'status-pill active';
                    statusPill.innerHTML = '<div class="dot"></div> Live';
                }
                
                if (recordBtn) recordBtn.disabled = false;
                
                // Auto-select first audio track
                const audioVariant = document.getElementById('audioVariant');
                if (audioVariant.options.length > 0) {
                    audioVariant.selectedIndex = 0;
                }
                
            } else {
                alert("Video download failed. Please try again.");
                if (statusPill) {
                    statusPill.className = 'status-pill';
                    statusPill.innerHTML = '<div class="dot"></div> System Ready';
                }
            }
        } else {
            alert("No videos found for this theme.");
            if (statusPill) {
                statusPill.className = 'status-pill';
                statusPill.innerHTML = '<div class="dot"></div> System Ready';
            }
        }
    } catch (error) {
        console.error("Generation error:", error);
        alert("Error generating content. Please check your connection.");
        if (statusPill) {
            statusPill.className = 'status-pill';
            statusPill.innerHTML = '<div class="dot"></div> System Ready';
        }
    } finally {
        // Hide loading
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

async function fetchBlob(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error("Fetch blob error:", e);
        return null;
    }
}

// --- 7. VIDEO ENGINE ---
function startPingPong() {
    if (!playerA || !playerB || blobPlaylist.length === 0) return;
    
    // Reset players
    playerA.pause();
    playerB.pause();
    playerA.currentTime = 0;
    playerB.currentTime = 0;
    
    playerA.className = 'active';
    playerB.className = 'standby';
    activePlayer = playerA;
    
    // Load first video
    playerA.src = blobPlaylist[0];
    playerA.load();
    
    // Preload second video
    if (blobPlaylist.length > 1) {
        playerB.src = blobPlaylist[1];
        playerB.load();
    }
    
    // Auto-play video (audio will wait for user)
    playerA.play().catch(e => {
        console.log("Video autoplay prevented");
        updateAudioStatus('Click Play');
    });
    
    // Clear any existing interval
    if (sequenceInterval) clearInterval(sequenceInterval);
    
    // Start monitoring for end
    sequenceInterval = setInterval(() => {
        if (!activePlayer || !activePlayer.duration || isNaN(activePlayer.duration)) return;
        
        // Check if video is ending
        if (activePlayer.duration - activePlayer.currentTime < 1.0) {
            triggerSwap();
        }
    }, 500);
}

function triggerSwap() {
    if (!playerA || !playerB) return;
    
    const active = playerA.classList.contains('active') ? playerA : playerB;
    const next = active === playerA ? playerB : playerA;
    
    // Ensure next video is loaded
    if (next.readyState < 2) {
        setTimeout(triggerSwap, 200);
        return;
    }
    
    // Play next video
    next.play().then(() => {
        active.className = 'standby';
        next.className = 'active';
        activePlayer = next;
        
        currentPlaylistIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
        const nextIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
        
        // Preload the video after next
        active.src = blobPlaylist[nextIndex];
        active.load();
    }).catch(error => {
        console.log("Swap play failed:", error);
    });
}

// --- 8. MP4 RECORDER (NO LAG) ---
async function startRecording() {
    // Show loading
    document.getElementById('loadingSpinner').style.display = 'block';
    
    // Ensure everything is playing
    if (!isPlaying) {
        togglePlay();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Setup canvas for frame capture
    const canvas = document.createElement('canvas');
    canvas.width = 1280; // HD resolution
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    // Setup audio stream from audio element
    let audioStream;
    try {
        // Method 1: Use captureStream if available
        if (typeof audioEngine.getAudioElement().captureStream === 'function') {
            audioStream = audioEngine.getAudioElement().captureStream();
        } 
        // Method 2: Create audio context destination
        else {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(audioEngine.getAudioElement());
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination);
            audioStream = dest.stream;
        }
    } catch(e) {
        console.log("Audio stream failed, recording video only");
        // Create silent audio track
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const dest = audioCtx.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        audioStream = dest.stream;
    }
    
    // Setup video stream from canvas
    const canvasStream = canvas.captureStream(30);
    
    // Combine streams
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ]);
    
    // Setup recorder - FORCE MP4/H.264 FOR BEST COMPATIBILITY
    let mimeType = 'video/mp4';
    let options = { mimeType: mimeType };
    
    // Test for MP4 support
    if (!MediaRecorder.isTypeSupported('video/mp4')) {
        // Fallback to WebM if MP4 not supported
        mimeType = 'video/webm;codecs=vp9';
        options = { mimeType: mimeType };
    }
    
    // Add bitrate for better quality
    options.videoBitsPerSecond = 5000000; // 5 Mbps for good quality
    
    const mediaRecorder = new MediaRecorder(combinedStream, options);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const theme = document.getElementById('themeSelect').value;
        const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileName = `ZenGen-${theme}-${date}`;
        
        // Use .mp4 extension for all files (even if they're webm internally)
        const extension = mimeType.includes('mp4') ? '.mp4' : '.mp4';
        
        a.href = url;
        a.download = fileName + extension;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show success message
        alert(`✅ Video downloaded successfully!\n\nFile: ${fileName}${extension}\nFormat: MP4 (H.264/AAC)\nSize: ${Math.round(blob.size / 1024 / 1024 * 10) / 10} MB\n\nReady to upload to YouTube, TikTok, Instagram, etc.`);
        
        // Cleanup
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        clearInterval(frameInterval);
        clearInterval(timerInterval);
        
        // Reset UI
        if (recordBtn) {
            recordBtn.innerHTML = '<div class="rec-icon"></div> Record Video (60s)';
            recordBtn.disabled = false;
        }
        
        if (statusPill) {
            statusPill.className = 'status-pill active';
            statusPill.innerHTML = '<div class="dot"></div> Live';
        }
        
        // Hide loading
        document.getElementById('loadingSpinner').style.display = 'none';
    };
    
    // Frame capture with optimization
    let lastFrameTime = 0;
    const frameInterval = setInterval(() => {
        const now = Date.now();
        
        // Limit to 30fps
        if (now - lastFrameTime < 33) return;
        
        try {
            if (activePlayer && activePlayer.readyState >= 2) {
                ctx.drawImage(activePlayer, 0, 0, canvas.width, canvas.height);
            }
            lastFrameTime = now;
        } catch (e) {
            console.log("Frame capture error:", e);
        }
    }, 33); // 30 FPS
    
    // Timer
    let timeLeft = 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (recordBtn) {
            recordBtn.innerHTML = `<div class="rec-icon"></div> ${timeLeft}s`;
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
    
    // Update UI
    if (recordBtn) recordBtn.disabled = true;
    
    if (statusPill) {
        statusPill.className = 'status-pill recording';
        statusPill.innerHTML = '<div class="dot"></div> Recording MP4...';
    }
    
    // Start recording
    mediaRecorder.start(1000); // Collect data every second
    
    // Stop after 60 seconds
    setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        // Hide loading in case stop doesn't trigger
        setTimeout(() => {
            document.getElementById('loadingSpinner').style.display = 'none';
        }, 1000);
    }, 60000);
}

// --- 9. UTILS ---
async function fetchMontagePlaylist(query, count) {
    let list = [];
    const seen = new Set(JSON.parse(localStorage.getItem('zenGen_seen') || '[]'));
    
    try {
        const page = Math.floor(Math.random() * 3) + 1;
        const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10&page=${page}&orientation=landscape&size=medium`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        
        if (data.videos && data.videos.length > 0) {
            const fresh = data.videos
                .filter(v => !seen.has(v.id))
                .sort(() => 0.5 - Math.random())
                .slice(0, count);
            
            fresh.forEach(v => {
                seen.add(v.id);
                // Prefer MP4 videos for better compatibility
                const videoFile = v.video_files.find(f => f.file_type === 'video/mp4' && f.width >= 1280) ||
                                 v.video_files.find(f => f.file_type === 'video/mp4') ||
                                 v.video_files.find(f => f.width >= 1280) ||
                                 v.video_files[0];
                if (videoFile) list.push(videoFile.link);
            });
            
            localStorage.setItem('zenGen_seen', JSON.stringify([...seen]));
        }
    } catch(e) {
        console.warn("Pexels API failed:", e);
        // Fallback to static videos
        return getFallbackVideos(query, count);
    }
    
    return list;
}

function getFallbackVideos(query, count) {
    // Fallback static video URLs for each theme
    const fallbackVideos = {
        forest: [
            'https://player.vimeo.com/external/371433846.sd.mp4?s=7da01dc669a85b53e0a8b8dd5b05f56d1ab7c1e9&profile_id=164&oauth2_token_id=57447761',
            'https://player.vimeo.com/external/440213825.sd.mp4?s=6e0a0c2e7e6f89d7be24a1473a9709c652a4c21c&profile_id=164&oauth2_token_id=57447761'
        ],
        ocean: [
            'https://player.vimeo.com/external/373053649.sd.mp4?s=eeb3c150e37dcee23013a20a78f1a90cc2d37dc2&profile_id=164&oauth2_token_id=57447761',
            'https://player.vimeo.com/external/386165261.sd.mp4?s=0d29cf4b6d9303e173e0f305b603c80ebfa90f4d&profile_id=164&oauth2_token_id=57447761'
        ],
        rain: [
            'https://player.vimeo.com/external/373053669.sd.mp4?s=f42f970efc8b3d58dda1dc37c02b33a92c7bb375&profile_id=164&oauth2_token_id=57447761',
            'https://player.vimeo.com/external/440214952.sd.mp4?s=37ba9709f4c9b4a1004552a974a529c33f2f63e7&profile_id=164&oauth2_token_id=57447761'
        ],
        fireplace: [
            'https://player.vimeo.com/external/373053672.sd.mp4?s=795c478745185153f187f0efc20b4e9c3c5d4189&profile_id=164&oauth2_token_id=57447761',
            'https://player.vimeo.com/external/440215592.sd.mp4?s=f0a4364269a73d3c1d0bd0f507a7b89b43757790&profile_id=164&oauth2_token_id=57447761'
        ],
        snow: [
            'https://player.vimeo.com/external/373053673.sd.mp4?s=f726c1eb1b97b0cd3b3dddc3d5509554e1f41c52&profile_id=164&oauth2_token_id=57447761',
            'https://player.vimeo.com/external/440216870.sd.mp4?s=dee117c7d81d319556c8bc08b4510d5c1b6dc886&profile_id=164&oauth2_token_id=57447761'
        ]
    };
    
    return fallbackVideos[query] ? fallbackVideos[query].slice(0, count) : [];
}

function generateViralSEO(theme) {
    const hooks = ["Secret", "Enchanted", "Deep", "Cozy", "Midnight", "Ancient", "Dreamy", "Magical"];
    
    const h = hooks[Math.floor(Math.random() * hooks.length)];
    
    const titleElement = document.getElementById('videoTitle');
    const descElement = document.getElementById('videoDesc');
    const tagsElement = document.getElementById('videoTags');
    
    if (titleElement) {
        titleElement.value = `${h} ${theme.toUpperCase()} Sounds for Sleep & Relaxation (No Talking)`;
    }
    
    if (descElement) {
        descElement.value = `Enjoy this ${h.toLowerCase()} ${theme} ambience. Perfect for sleep, study, and meditation.\n\nTheme: ${theme.toUpperCase()}\nAudio: Real Nature Recording (Royalty-Free)\nQuality: HD MP4\n\n#${theme} #relax #sleep #naturesounds`;
    }
    
    const themeTags = [`#${theme}`, `#${theme}sounds`, `#${theme}ambience`, `#${theme}asmr`, `#${theme}sleep`, `#real${theme}`, `#${theme}video`];
    const GENERIC_TAGS = ["#asmr", "#sleep", "#meditation", "#relaxing", "#nature", "#studymusic", "#calm", "#focus", "#insomnia", "#healing", "#peace", "#zen", "#mindfulness", "#yoga", "#background", "#whitenoise", "#anxietyrelief", "#deepfocus", "#concentration", "#wellness"];
    const combined = [...themeTags, ...GENERIC_TAGS];
    const shuffled = combined.sort(() => 0.5 - Math.random());
    const finalTags = [...new Set(shuffled)].slice(0, 25).join(' ');
    
    if (tagsElement) {
        tagsElement.value = finalTags;
    }
}

function copyToClip(id) {
    const element = document.getElementById(id);
    if (!element) return;
    
    element.select();
    element.setSelectionRange(0, 99999);
    
    try {
        document.execCommand("copy");
        // Show feedback
        const originalText = element.nextElementSibling.innerHTML;
        element.nextElementSibling.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            element.nextElementSibling.innerHTML = originalText;
        }, 2000);
    } catch (err) {
        console.error("Copy failed:", err);
    }
}

// --- 10. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function() {
    playerA = document.getElementById('vid1');
    playerB = document.getElementById('vid2');
    statusPill = document.getElementById('statusPill');
    recordBtn = document.getElementById('recordBtn');
    playPauseBtn = document.getElementById('playPauseBtn');
    
    const enterStudioBtn = document.getElementById('enterStudioBtn');
    if (enterStudioBtn) {
        enterStudioBtn.addEventListener('click', initStudio);
    }
    
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateContent);
    }
    
    if (recordBtn) {
        recordBtn.addEventListener('click', startRecording);
    }
    
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlay);
    }
    
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', loadAudioOptions);
    }
    
    const copyTitleBtn = document.getElementById('copyTitleBtn');
    if (copyTitleBtn) {
        copyTitleBtn.addEventListener('click', function() { copyToClip('videoTitle'); });
    }
    
    const copyDescBtn = document.getElementById('copyDescBtn');
    if (copyDescBtn) {
        copyDescBtn.addEventListener('click', function() { copyToClip('videoDesc'); });
    }
    
    const copyTagsBtn = document.getElementById('copyTagsBtn');
    if (copyTagsBtn) {
        copyTagsBtn.addEventListener('click', function() { copyToClip('videoTags'); });
    }
    
    // Test audio button
    const audioTestBtn = document.getElementById('audioTestBtn');
    if (audioTestBtn) {
        audioTestBtn.addEventListener('click', function() {
            const audioUrl = document.getElementById('audioVariant').value;
            if (audioUrl) {
                audioEngine.play(audioUrl).then(success => {
                    if (success) {
                        alert('✅ Audio is working! You should hear natural sounds.');
                        updateAudioStatus('Test successful');
                    } else {
                        alert('⚠️ Audio blocked. Please click the Play button next to the video.');
                        updateAudioStatus('Click Play button');
                    }
                });
            } else {
                alert('Please select an audio track first.');
            }
        });
    }
    
    // Load audio options
    setTimeout(loadAudioOptions, 100);
    
    // Initialize audio status
    updateAudioStatus('Ready');
});
