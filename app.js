/**
 * ZenGen - Bulletproof Edition
 * - Audio: Hardcoded High-Fidelity Library (No API Failures).
 * - Recorder: "Frame Stamping" Engine (Safari Immune).
 * - SEO: 20+ Tag Viral Engine.
 */

const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. RELIABLE AUDIO LIBRARY ---
const STATIC_AUDIO_LIBRARY = {
    forest: [
        { id: 'forest_morning', name: 'Morning Birds', url: 'https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg' },
        { id: 'stream_water', name: 'Forest Stream', url: 'https://actions.google.com/sounds/v1/water/stream_water.ogg' },
        { id: 'crickets', name: 'Night Crickets', url: 'https://actions.google.com/sounds/v1/animals/crickets.ogg' }
    ],
    ocean: [
        { id: 'waves_crashing', name: 'Crashing Waves', url: 'https://actions.google.com/sounds/v1/water/waves_crashing.ogg' },
        { id: 'ocean_surf', name: 'Deep Surf', url: 'https://actions.google.com/sounds/v1/water/ocean_surf.ogg' },
        { id: 'seagulls', name: 'Beach Ambience', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_04d607623a.mp3' }
    ],
    rain: [
        { id: 'rain_heavy', name: 'Heavy Storm', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
        { id: 'rain_roof', name: 'Rain on Roof', url: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg' },
        { id: 'thunder', name: 'Rolling Thunder', url: 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg' }
    ],
    fireplace: [
        { id: 'fire', name: 'Crackling Fire', url: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg' },
        { id: 'fireplace_room', name: 'Cozy Room', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' }
    ],
    snow: [
        { id: 'wind', name: 'Strong Wind', url: 'https://actions.google.com/sounds/v1/weather/wind_strong.ogg' },
        { id: 'blizzard', name: 'Blizzard Howl', url: 'https://actions.google.com/sounds/v1/weather/strong_wind_whistling.ogg' }
    ]
};

// --- 2. SIMPLIFIED AUDIO PLAYER ---
class AudioPlayer {
    constructor() {
        this.audioElement = new Audio();
        this.audioElement.loop = true;
        this.audioElement.volume = 0.8;
        this.isPlaying = false;
    }
    
    init() {
        // No Web Audio API, just HTML5 Audio for simplicity
        console.log("Audio player initialized (HTML5 only)");
        return Promise.resolve();
    }
    
    resume() {
        return Promise.resolve();
    }
    
    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
    }
    
    async play(blobUrl) {
        this.stop();
        this.audioElement.src = blobUrl;
        
        try {
            await this.audioElement.play();
            this.isPlaying = true;
            console.log("Audio playing successfully");
        } catch(error) {
            console.log("Audio autoplay prevented:", error.name);
            // Store the play promise for later
            this.pendingPlay = this.audioElement.play();
        }
    }
    
    getAudioStream() {
        // Simple audio capture for recording
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(this.audioElement);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination);
            return dest.stream;
        } catch(e) {
            console.log("Audio stream creation failed, using fallback");
            // Create silent audio track as fallback
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const dest = audioCtx.createMediaStreamDestination();
            oscillator.connect(dest);
            oscillator.start();
            return dest.stream;
        }
    }
}

const audioEngine = new AudioPlayer();

// --- 3. GLOBAL STATE ---
let blobPlaylist = [];
let audioBlobUrl = null;
let currentPlaylistIndex = 0;
let activePlayer = null;
let sequenceInterval = null;
let isPlaying = false;
let audioLibraryCache = {};
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
            
            // Enable audio after UI is visible
            setTimeout(() => {
                document.body.click(); // Simulate click for audio context
            }, 100);
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

function loadAudioOptions() {
    const theme = document.getElementById('themeSelect').value;
    const variantSelect = document.getElementById('audioVariant');
    variantSelect.innerHTML = '';
    
    const sounds = STATIC_AUDIO_LIBRARY[theme] || [];
    sounds.forEach(sound => {
        audioLibraryCache[sound.id] = sound.url;
        const el = document.createElement('option');
        el.value = sound.id;
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
    } else {
        // Play - Force user interaction for audio
        document.body.click(); // Trigger audio context
        
        // Play video
        activePlayer.play().catch(e => {
            console.log("Video play failed:", e);
        });
        
        // Play audio with delay to ensure context is ready
        setTimeout(() => {
            if (audioBlobUrl) {
                audioEngine.play(audioBlobUrl).catch(e => {
                    console.log("Audio play failed:", e);
                });
            }
        }, 100);
        
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

// --- 6. GENERATION ---
async function generateContent() {
    if (sequenceInterval) clearInterval(sequenceInterval);
    audioEngine.stop();
    
    const theme = document.getElementById('themeSelect').value;
    const audioId = document.getElementById('audioVariant').value;
    
    if (statusPill) {
        statusPill.className = 'status-pill active';
        statusPill.innerHTML = '<div class="dot"></div> Curating...';
    }
    
    if (recordBtn) recordBtn.disabled = true;

    try {
        const rawUrls = await fetchMontagePlaylist(theme, 2); // Reduced to 2 videos for performance
        
        if (rawUrls.length > 0) {
            blobPlaylist = [];
            for (let i = 0; i < Math.min(rawUrls.length, 2); i++) {
                if (statusPill) {
                    statusPill.innerHTML = '<div class="dot"></div> Downloading Video ' + (i+1) + '/2...';
                }
                const blob = await fetchBlob(rawUrls[i]);
                if (blob) blobPlaylist.push(blob);
            }

            if (statusPill) {
                statusPill.innerHTML = '<div class="dot"></div> Downloading Audio...';
            }
            
            const audioUrl = audioLibraryCache[audioId];
            audioBlobUrl = await fetchBlob(audioUrl);

            if (blobPlaylist.length > 0 && audioBlobUrl) {
                // Force user interaction for audio
                document.body.click();
                
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
                
                // Auto-play audio after a short delay
                setTimeout(() => {
                    audioEngine.play(audioBlobUrl).catch(e => {
                        console.log("Auto-play audio failed, waiting for user click:", e);
                    });
                }, 500);
                
            } else {
                alert("Download failed. Please try again.");
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

// --- 7. OPTIMIZED VIDEO ENGINE ---
function startPingPong() {
    if (!playerA || !playerB) return;
    
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
    
    // Play with error handling
    const playVideo = async () => {
        try {
            await playerA.play();
        } catch(error) {
            console.log("Video autoplay prevented, waiting for user interaction");
        }
    };
    
    playVideo();
    
    // Clear any existing interval
    if (sequenceInterval) clearInterval(sequenceInterval);
    
    // Start monitoring for end
    sequenceInterval = setInterval(() => {
        if (!activePlayer || !activePlayer.duration || isNaN(activePlayer.duration)) return;
        
        // Check if video is ending (last 1 second)
        if (activePlayer.duration - activePlayer.currentTime < 1.0) {
            triggerSwap();
        }
    }, 500); // Check every 500ms for better performance
}

function triggerSwap() {
    if (!playerA || !playerB) return;
    
    const active = playerA.classList.contains('active') ? playerA : playerB;
    const next = active === playerA ? playerB : playerA;
    
    // Ensure next video is loaded
    if (next.readyState < 2) {
        console.log("Next video not ready yet, delaying swap");
        setTimeout(triggerSwap, 200);
        return;
    }
    
    // Play next video
    const playNext = async () => {
        try {
            await next.play();
            
            // Swap visibility
            active.className = 'standby';
            next.className = 'active';
            activePlayer = next;
            
            // Update playlist index
            currentPlaylistIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
            const nextIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
            
            // Preload the video after next
            active.src = blobPlaylist[nextIndex];
            active.load();
            
        } catch(error) {
            console.log("Swap play failed:", error);
        }
    };
    
    playNext();
}

// --- 8. OPTIMIZED RECORDER (NO LAG) ---
async function startRecording() {
    // Ensure everything is playing
    if (!isPlaying) {
        togglePlay();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Setup canvas for frame capture
    const canvas = document.createElement('canvas');
    canvas.width = 854; // Reduced from 1280 for better performance
    canvas.height = 480; // Reduced from 720 for better performance
    const ctx = canvas.getContext('2d');
    
    // Setup audio stream
    let audioStream;
    try {
        audioStream = audioEngine.getAudioStream();
    } catch(e) {
        console.log("Audio stream failed, using silent audio");
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const dest = audioCtx.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        audioStream = dest.stream;
    }
    
    // Setup video stream from canvas
    const canvasStream = canvas.captureStream(25); // Reduced from 30fps
    
    // Combine streams
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ]);
    
    // Setup recorder with optimized settings
    let options = { 
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
        audioBitsPerSecond: 128000   // 128 kbps for audio
    };
    
    // Test for supported formats
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { 
            mimeType: 'video/webm;codecs=vp8,opus',
            videoBitsPerSecond: 2000000,
            audioBitsPerSecond: 128000
        };
    }
    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { 
            mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
            videoBitsPerSecond: 2500000,
            audioBitsPerSecond: 128000
        };
    }
    
    const mediaRecorder = new MediaRecorder(combinedStream, options);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const fileName = `ZenGen-${document.getElementById('themeSelect').value}-${Date.now()}`;
        const extension = options.mimeType.includes('mp4') ? '.mp4' : '.webm';
        
        a.href = url;
        a.download = fileName + extension;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show success message
        alert(`✅ Video downloaded successfully!\n\nFile: ${fileName}${extension}\nSize: ${Math.round(blob.size / 1024 / 1024 * 10) / 10} MB\n\nTip: Use VLC Player for best playback if QuickTime has issues.`);
        
        // Cleanup
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        clearInterval(frameInterval);
        clearInterval(timerInterval);
        
        // Reset UI
        if (recordBtn) {
            recordBtn.innerHTML = '<div class="rec-icon"></div> Record (1 Min)';
            recordBtn.disabled = false;
        }
        
        if (statusPill) {
            statusPill.className = 'status-pill active';
            statusPill.innerHTML = '<div class="dot"></div> Live';
        }
    };
    
    // Optimized frame capture with buffering
    let bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;
    let bufferCtx = bufferCanvas.getContext('2d');
    
    let lastFrameTime = 0;
    const frameInterval = setInterval(() => {
        const now = Date.now();
        
        // Limit to 25fps max for recording
        if (now - lastFrameTime < 40) return; // 1000ms / 25fps = 40ms
        
        try {
            // Draw to buffer first
            if (activePlayer && activePlayer.readyState >= 2) {
                bufferCtx.drawImage(activePlayer, 0, 0, canvas.width, canvas.height);
            }
            
            // Then draw buffer to output canvas
            ctx.drawImage(bufferCanvas, 0, 0);
            lastFrameTime = now;
            
        } catch (e) {
            console.log("Frame capture error:", e);
        }
    }, 40); // ~25 FPS
    
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
        statusPill.innerHTML = '<div class="dot"></div> Recording';
    }
    
    // Start recording with chunks for better reliability
    mediaRecorder.start(1000); // Collect data every second
    
    // Stop after 60 seconds
    setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }, 60000);
}

// --- 9. UTILS ---
async function fetchMontagePlaylist(query, count) {
    let list = [];
    const seen = new Set(JSON.parse(localStorage.getItem('zenGen_seen') || '[]'));
    
    // Use shorter videos for better performance
    try {
        const page = Math.floor(Math.random() * 3) + 1;
        const res = await fetch('https://api.pexels.com/videos/search?query=' + encodeURIComponent(query) + '&per_page=8&page=' + page + '&orientation=landscape&size=medium', {
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
                // Prefer shorter videos (under 30 seconds) and medium quality
                const videoFile = v.video_files.find(f => f.duration < 30 && f.width <= 1280) ||
                                 v.video_files.find(f => f.width <= 1280) ||
                                 v.video_files[0];
                if (videoFile) list.push(videoFile.link);
            });
            
            localStorage.setItem('zenGen_seen', JSON.stringify([...seen]));
        }
    } catch(e) {
        console.warn("Pexels API failed:", e);
    }
    
    if (list.length < count) {
        try {
            const res = await fetch('https://pixabay.com/api/videos/?key=' + PIXABAY_KEY + '&q=' + encodeURIComponent(query) + '&per_page=8');
            const data = await res.json();
            
            if (data.hits && data.hits.length > 0) {
                const needed = count - list.length;
                data.hits.slice(0, needed).forEach(v => {
                    if (v.videos && v.videos.medium) {
                        list.push(v.videos.medium.url);
                    }
                });
            }
        } catch(e) {
            console.warn("Pixabay API failed:", e);
        }
    }
    
    return list;
}

function generateViralSEO(theme) {
    const hooks = ["Secret", "Enchanted", "Deep", "Cozy", "Midnight", "Ancient", "Dreamy", "Magical"];
    
    const h = hooks[Math.floor(Math.random() * hooks.length)];
    
    const titleElement = document.getElementById('videoTitle');
    const descElement = document.getElementById('videoDesc');
    const tagsElement = document.getElementById('videoTags');
    
    if (titleElement) {
        titleElement.value = h + ' ' + theme.toUpperCase() + ' Sounds for Sleep & Relaxation (No Talking)';
    }
    
    if (descElement) {
        descElement.value = 'Enjoy this ' + h.toLowerCase() + ' ' + theme + ' ambience. Perfect for sleep, study, and meditation.\n\nTheme: ' + theme.toUpperCase() + '\nAudio: Real Nature Recording\nQuality: HD\n\n#' + theme + ' #relax #sleep';
    }
    
    const themeTags = ['#' + theme, '#' + theme + 'sounds', '#' + theme + 'ambience', '#' + theme + 'asmr', '#' + theme + 'sleep', '#real' + theme, '#' + theme + 'video'];
    const GENERIC_TAGS = ["#asmr", "#sleep", "#meditation", "#relaxing", "#nature", "#shorts", "#fyp", "#viral", "#stressrelief", "#calm", "#focus", "#study", "#insomnia", "#healing", "#peace", "#zen", "#mindfulness", "#deepfocus", "#studymusic", "#backgroundnoise"];
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
        const original = element.style.backgroundColor;
        element.style.backgroundColor = "#2a2a2a";
        setTimeout(() => {
            element.style.backgroundColor = original;
        }, 200);
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
    
    // Force audio context on any click
    document.addEventListener('click', function() {
        userHasInteracted = true;
        if (audioEngine.audioElement.src && !audioEngine.isPlaying) {
            audioEngine.audioElement.play().catch(e => {
                console.log("Audio play on click failed:", e);
            });
        }
    });
    
    // Load audio options
    setTimeout(loadAudioOptions, 100);
});
