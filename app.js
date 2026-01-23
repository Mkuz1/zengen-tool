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

// --- 2. FIXED AUDIO PLAYER ---
class AudioPlayer {
    constructor() {
        this.ctx = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.isInitialized = false;
        this.audioElement = new Audio();
        this.audioElement.loop = true;
        this.audioElement.volume = 0.8;
    }
    
    async init() {
        if (this.isInitialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.ctx.createGain();
            this.gainNode.connect(this.ctx.destination);
            this.gainNode.gain.value = 0.8;
            
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }
            
            this.isInitialized = true;
        } catch(e) {
            console.warn("Web Audio API not available:", e);
        }
    }
    
    async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }
    
    stop() {
        if (this.sourceNode) {
            try { 
                this.sourceNode.stop(); 
                this.sourceNode.disconnect();
            } catch(e){}
            this.sourceNode = null;
        }
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
    }
    
    async play(blobUrl) {
        this.stop();
        
        this.audioElement.src = blobUrl;
        
        try {
            await this.audioElement.play();
            
            if (this.isInitialized && blobUrl) {
                try {
                    const response = await fetch(blobUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                    
                    this.sourceNode = this.ctx.createBufferSource();
                    this.sourceNode.buffer = audioBuffer;
                    this.sourceNode.loop = true;
                    this.sourceNode.connect(this.gainNode);
                    this.sourceNode.start(0);
                } catch(e) {
                    console.warn("Web Audio playback failed:", e);
                }
            }
        } catch(e) {
            console.error("Audio playback failed:", e);
        }
    }
    
    getAudioStream() {
        try {
            const recordCtx = new (window.AudioContext || window.webkitAudioContext)();
            const mediaElementSource = recordCtx.createMediaElementSource(this.audioElement);
            const dest = recordCtx.createMediaStreamDestination();
            mediaElementSource.connect(dest);
            mediaElementSource.connect(recordCtx.destination);
            
            return dest.stream;
        } catch(e) {
            console.error("Failed to create audio stream:", e);
            return null;
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

// --- 4. DOM ELEMENTS ---
let playerA, playerB, statusPill, recordBtn, playPauseBtn;

// --- 5. INITIALIZATION ---
async function initStudio() {
    try {
        document.addEventListener('click', async function enableAudio() {
            await audioEngine.init();
            document.removeEventListener('click', enableAudio);
        }, { once: true });
        
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
            loadAudioOptions();
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
        activePlayer.pause();
        audioEngine.audioElement.pause();
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        if (audioEngine.ctx) {
            audioEngine.ctx.resume();
        }
        
        activePlayer.play().catch(e => {
            console.log("Video play failed:", e);
        });
        
        audioEngine.audioElement.play().then(() => {
            console.log("Audio started");
        }).catch(e => {
            console.log("Audio play failed:", e);
        });
        
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
        const rawUrls = await fetchMontagePlaylist(theme, 4);
        
        if (rawUrls.length > 0) {
            blobPlaylist = [];
            for (let i = 0; i < Math.min(rawUrls.length, 4); i++) {
                if (statusPill) {
                    statusPill.innerHTML = '<div class="dot"></div> Downloading Video ' + (i+1) + '/4...';
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
                if (audioEngine.ctx) {
                    await audioEngine.ctx.resume();
                }
                
                await audioEngine.play(audioBlobUrl);
                
                const visualizer = document.getElementById('audioVisualizer');
                if (visualizer) visualizer.classList.add('active');
                
                generateViralSEO(theme);
                
                currentPlaylistIndex = 0;
                startPingPong();
                isPlaying = true;
                
                if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                
                if (statusPill) {
                    statusPill.className = 'status-pill active';
                    statusPill.innerHTML = '<div class="dot"></div> Live';
                }
                
                if (recordBtn) recordBtn.disabled = false;
                
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

// --- 7. VIDEO ENGINE ---
function startPingPong() {
    if (!playerA || !playerB) return;
    
    playerA.pause();
    playerB.pause();
    playerA.currentTime = 0;
    playerB.currentTime = 0;
    
    playerA.className = 'active';
    playerB.className = 'standby';
    activePlayer = playerA;
    
    playerA.src = blobPlaylist[0];
    playerA.load();
    
    if (blobPlaylist.length > 1) {
        playerB.src = blobPlaylist[1];
        playerB.load();
    }
    
    const playPromise = playerA.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Video autoplay prevented");
        });
    }
    
    if (sequenceInterval) clearInterval(sequenceInterval);
    
    sequenceInterval = setInterval(() => {
        if (!activePlayer || !activePlayer.duration || isNaN(activePlayer.duration)) return;
        if (activePlayer.duration - activePlayer.currentTime < 0.5) {
            triggerSwap();
        }
    }, 250);
}

function triggerSwap() {
    if (!playerA || !playerB) return;
    
    const active = playerA.classList.contains('active') ? playerA : playerB;
    const next = active === playerA ? playerB : playerA;
    
    if (next.readyState < 2) {
        setTimeout(triggerSwap, 100);
        return;
    }
    
    const playPromise = next.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            active.className = 'standby';
            next.className = 'active';
            activePlayer = next;
            
            currentPlaylistIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
            const nextIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
            
            active.src = blobPlaylist[nextIndex];
            active.load();
        }).catch(error => {
            console.log("Swap play failed:", error);
        });
    }
}

// --- 8. MAC-COMPATIBLE RECORDER ---
async function startRecording() {
    if (!isPlaying) {
        togglePlay();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (audioEngine.ctx) {
        await audioEngine.ctx.resume();
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    let audioStream;
    try {
        if (typeof audioEngine.audioElement.captureStream === 'function') {
            audioStream = audioEngine.audioElement.captureStream();
        } else if (audioEngine.ctx) {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(audioEngine.audioElement);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination);
            audioStream = dest.stream;
        } else {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const dest = audioCtx.createMediaStreamDestination();
            oscillator.connect(dest);
            oscillator.start();
            audioStream = dest.stream;
        }
    } catch(e) {
        console.error("Audio stream creation failed:", e);
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const dest = audioCtx.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        audioStream = dest.stream;
    }
    
    const canvasStream = canvas.captureStream(30);
    
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
    ]);
    
    let options;
    
    const testMimeTypes = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=h264,aac',
        'video/webm;codecs=vp9,opus',
        'video/webm'
    ];
    
    for (const mimeType of testMimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            options = { mimeType: mimeType };
            console.log("Using mimeType:", mimeType);
            break;
        }
    }
    
    if (!options) {
        options = { mimeType: 'video/mp4' };
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
        
        let extension = '.mp4';
        if (options.mimeType.includes('mp4')) {
            extension = '.mp4';
        } else if (options.mimeType.includes('webm')) {
            extension = '.webm';
        } else {
            extension = '.mov';
        }
        
        a.href = url;
        a.download = fileName + extension;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        alert(`Video downloaded as ${fileName}${extension}\nFormat: ${options.mimeType}\nSize: ${Math.round(blob.size / 1024 / 1024 * 10) / 10} MB`);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        clearInterval(frameInterval);
        clearInterval(timerInterval);
        
        if (recordBtn) {
            recordBtn.innerHTML = '<div class="rec-icon"></div> Record (1 Min)';
            recordBtn.disabled = false;
        }
        
        if (statusPill) {
            statusPill.className = 'status-pill active';
            statusPill.innerHTML = '<div class="dot"></div> Live';
        }
    };
    
    const frameInterval = setInterval(() => {
        try {
            if (activePlayer && activePlayer.readyState >= 2 && !activePlayer.paused) {
                ctx.drawImage(activePlayer, 0, 0, canvas.width, canvas.height);
            }
        } catch (e) {
            console.log("Frame capture error:", e);
        }
    }, 33);
    
    let timeLeft = 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (recordBtn) {
            recordBtn.innerHTML = '<div class="rec-icon"></div> Recording... ' + timeLeft + 's';
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
    
    if (recordBtn) recordBtn.disabled = true;
    
    if (statusPill) {
        statusPill.className = 'status-pill recording';
        statusPill.innerHTML = '<div class="dot"></div> Recording';
    }
    
    mediaRecorder.start(1000);
    
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
    
    try {
        const page = Math.floor(Math.random() * 5) + 1;
        const res = await fetch('https://api.pexels.com/videos/search?query=' + encodeURIComponent(query) + '&per_page=10&page=' + page + '&orientation=landscape', {
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
                const hdFile = v.video_files.find(f => f.file_type === 'video/mp4' && f.width === 1280) ||
                               v.video_files.find(f => f.file_type === 'video/mp4') ||
                               v.video_files.find(f => f.width === 1280) ||
                               v.video_files[0];
                if (hdFile) list.push(hdFile.link);
            });
            
            localStorage.setItem('zenGen_seen', JSON.stringify([...seen]));
        }
    } catch(e) {
        console.warn("Pexels API failed:", e);
    }
    
    if (list.length < count) {
        try {
            const res = await fetch('https://pixabay.com/api/videos/?key=' + PIXABAY_KEY + '&q=' + encodeURIComponent(query) + '&per_page=10');
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
    
    setTimeout(loadAudioOptions, 100);
});
