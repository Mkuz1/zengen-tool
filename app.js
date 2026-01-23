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
        { id: 'forest_morning', name: '🐦 Morning Birds', url: 'https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg' },
        { id: 'stream_water', name: '💧 Forest Stream', url: 'https://actions.google.com/sounds/v1/water/stream_water.ogg' },
        { id: 'crickets', name: '🦗 Night Crickets', url: 'https://actions.google.com/sounds/v1/animals/crickets.ogg' }
    ],
    ocean: [
        { id: 'waves_crashing', name: '🌊 Crashing Waves', url: 'https://actions.google.com/sounds/v1/water/waves_crashing.ogg' },
        { id: 'ocean_surf', name: '💨 Deep Surf', url: 'https://actions.google.com/sounds/v1/water/ocean_surf.ogg' },
        { id: 'seagulls', name: '🐦 Beach Ambience', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_04d607623a.mp3' }
    ],
    rain: [
        { id: 'rain_heavy', name: '⛈️ Heavy Storm', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
        { id: 'rain_roof', name: '🏠 Rain on Roof', url: 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg' },
        { id: 'thunder', name: '⚡ Rolling Thunder', url: 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg' }
    ],
    fireplace: [
        { id: 'fire', name: '🔥 Crackling Fire', url: 'https://actions.google.com/sounds/v1/ambiences/fire.ogg' },
        { id: 'fireplace_room', name: '🪵 Cozy Room', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' }
    ],
    snow: [
        { id: 'wind', name: '💨 Strong Wind', url: 'https://actions.google.com/sounds/v1/weather/wind_strong.ogg' },
        { id: 'blizzard', name: '❄️ Blizzard Howl', url: 'https://actions.google.com/sounds/v1/weather/strong_wind_whistling.ogg' }
    ]
};

// --- 2. AUDIO PLAYER ---
class AudioPlayer {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.sourceNode = null;
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.ctx.destination);
    }
    async resume() { if (this.ctx.state === 'suspended') await this.ctx.resume(); }
    stop() {
        if (this.sourceNode) { try { this.sourceNode.stop(); } catch(e){} this.sourceNode.disconnect(); this.sourceNode = null; }
    }
    async play(blobUrl) {
        this.stop();
        try {
            const response = await fetch(blobUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.sourceNode = this.ctx.createBufferSource();
            this.sourceNode.buffer = audioBuffer;
            this.sourceNode.loop = true; 
            this.sourceNode.connect(this.gainNode);
            this.sourceNode.start(0);
        } catch(e) { console.error("Audio Error", e); }
    }
}
const audioEngine = new AudioPlayer();

// --- 3. GLOBAL STATE ---
const playerA = document.getElementById('vid1');
const playerB = document.getElementById('vid2');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill.querySelector('div') ? statusPill : document.getElementById('statusPill'); 
const recordBtn = document.getElementById('recordBtn');
const playPauseBtn = document.getElementById('playPauseBtn');

let blobPlaylist = [];
let audioBlobUrl = null;
let currentPlaylistIndex = 0;
let activePlayer = playerA; 
let sequenceInterval = null;
let isPlaying = false;
let audioLibraryCache = {};

// --- 4. INIT ---
async function initStudio() {
    try {
        await audioEngine.resume();
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => { document.getElementById('startScreen').style.display = 'none'; document.getElementById('workspace').style.display = 'flex'; }, 500);
        loadAudioOptions();
    } catch(e) { alert("Audio Engine Failed."); }
}

function loadAudioOptions() {
    const theme = document.getElementById('themeSelect').value;
    const variantSelect = document.getElementById('audioVariant');
    variantSelect.innerHTML = '';
    
    // Load from Static Library
    const sounds = STATIC_AUDIO_LIBRARY[theme] || [];
    sounds.forEach(sound => {
        // Cache URL
        audioLibraryCache[sound.id] = sound.url;
        
        const el = document.createElement('option');
        el.value = sound.id;
        el.innerText = sound.name;
        variantSelect.appendChild(el);
    });
}

function togglePlay() {
    if (isPlaying) {
        activePlayer.pause(); audioEngine.ctx.suspend();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        activePlayer.play(); audioEngine.ctx.resume();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

// --- 5. GENERATION ---
async function generateContent() {
    if (sequenceInterval) clearInterval(sequenceInterval);
    audioEngine.stop();
    const theme = document.getElementById('themeSelect').value;
    const audioId = document.getElementById('audioVariant').value;
    
    statusPill.className = 'status-pill active';
    statusText.textContent = 'Curating...';
    recordBtn.disabled = true;

    // Fetch Video Playlist
    const rawUrls = await fetchMontagePlaylist(theme, 4);
    
    if (rawUrls.length > 0) {
        blobPlaylist = [];
        for (let i = 0; i < rawUrls.length; i++) {
            statusText.textContent = `Downloading Video ${i+1}/4...`;
            const blob = await fetchBlob(rawUrls[i]);
            if (blob) blobPlaylist.push(blob);
        }

        statusText.textContent = `Downloading Audio...`;
        const audioUrl = audioLibraryCache[audioId];
        audioBlobUrl = await fetchBlob(audioUrl);

        if (blobPlaylist.length > 0 && audioBlobUrl) {
            await audioEngine.resume();
            audioEngine.play(audioBlobUrl);
            
            document.getElementById('audioVisualizer').classList.add('active');
            generateViralSEO(theme);
            
            currentPlaylistIndex = 0;
            startPingPong();
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            
        } else { alert("Download failed."); }
    } else { alert("No videos found."); }
}

async function fetchBlob(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) { return null; }
}

// --- 6. SAFE VIDEO ENGINE ---
function startPingPong() {
    playerA.className = 'active'; playerB.className = 'standby';
    activePlayer = playerA;
    playerA.src = blobPlaylist[0]; playerA.play();
    if (blobPlaylist.length > 1) { playerB.src = blobPlaylist[1]; playerB.load(); }

    statusText.textContent = 'Live';
    recordBtn.disabled = false;

    sequenceInterval = setInterval(() => {
        const active = playerA.classList.contains('active') ? playerA : playerB;
        if (!active.duration) return;
        if (active.duration - active.currentTime < 0.3) triggerSwap();
    }, 100);
}

function triggerSwap() {
    const active = playerA.classList.contains('active') ? playerA : playerB;
    const next = active === playerA ? playerB : playerA;
    next.play().then(() => {
        active.className = 'standby'; next.className = 'active';
        activePlayer = next;
        currentPlaylistIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
        const nextIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
        active.src = blobPlaylist[nextIndex]; active.load();
    });
}

// --- 7. SAFARI FRAME-STAMPING RECORDER ---
function startRecording() {
    audioEngine.resume();
    if (activePlayer.paused) activePlayer.play();

    // 1. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    // 2. Stream Setup
    const canvasStream = canvas.captureStream(30);
    const audioDest = audioEngine.ctx.createMediaStreamDestination();
    audioEngine.gainNode.connect(audioDest);
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()]);
    
    let options = { mimeType: 'video/webm; codecs=vp9' };
    if (MediaRecorder.isTypeSupported('video/mp4')) options = { mimeType: 'video/mp4' };

    const mediaRecorder = new MediaRecorder(combinedStream, options);
    const chunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ZenGen-${document.getElementById('themeSelect').value}-${Date.now()}.mp4`;
        a.click();
        
        recordBtn.innerHTML = '<div class="rec-icon"></div> Record (1 Min)';
        recordBtn.disabled = false;
        clearInterval(frameInterval);
        clearInterval(timerInterval);
    };

    // 3. FRAME STAMPER (The Safari Fix)
    // We use a manual setInterval instead of requestAnimationFrame.
    // This forces the canvas to update even if Safari tries to pause rendering.
    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = 1280; bufferCanvas.height = 720;
    const bufferCtx = bufferCanvas.getContext('2d');

    const frameInterval = setInterval(() => {
        // Only grab new frame if player is healthy
        if (activePlayer.readyState >= 2 && !activePlayer.paused && !activePlayer.seeking) {
            bufferCtx.drawImage(activePlayer, 0, 0, canvas.width, canvas.height);
        }
        // Always stamp the last good frame
        ctx.drawImage(bufferCanvas, 0, 0);
    }, 1000 / 30); // 30 FPS Lock

    let timeLeft = 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        recordBtn.innerText = `Recording... ${timeLeft}s`;
        if (timeLeft <= 0) clearInterval(timerInterval);
    }, 1000);

    mediaRecorder.start();
    recordBtn.disabled = true;
    setTimeout(() => mediaRecorder.stop(), 60000);
}

// --- 8. UTILS & VIRAL SEO ---
async function fetchMontagePlaylist(query, count) {
    let list = [];
    const seen = new Set(JSON.parse(localStorage.getItem('zenGen_seen') || '[]'));
    try {
        const page = Math.floor(Math.random() * 20) + 1;
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=15&page=${page}&orientation=landscape`, { headers: { Authorization: PEXELS_KEY } });
        const data = await res.json();
        if (data.videos) {
            const fresh = data.videos.filter(v => !seen.has(v.id)).sort(()=>0.5-Math.random()).slice(0, count);
            fresh.forEach(v => {
                seen.add(v.id);
                list.push(v.video_files.find(f=>f.width===1280)?.link || v.video_files[0].link);
            });
            localStorage.setItem('zenGen_seen', JSON.stringify([...seen]));
        }
    } catch(e){}
    if (list.length < count) {
        try {
            const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=15`);
            const data = await res.json();
            if(data.hits) data.hits.slice(0, count-list.length).forEach(v => list.push(v.videos.medium.url));
        } catch(e){}
    }
    return list;
}

const GENERIC_TAGS = ["#asmr", "#sleep", "#meditation", "#relaxing", "#nature", "#shorts", "#fyp", "#viral", "#stressrelief", "#calm", "#focus", "#study", "#insomnia", "#healing", "#peace", "#zen", "#mindfulness", "#deepfocus", "#studymusic", "#backgroundnoise"];

function generateViralSEO(theme) {
    const hooks = ["Secret", "Enchanted", "Deep", "Cozy", "Midnight", "Ancient", "Dreamy", "Magical"];
    const benefits = ["Relieve Anxiety", "Cure Insomnia", "Instant Calm", "Focus", "Stop Overthinking"];
    
    const h = hooks[Math.floor(Math.random()*hooks.length)];
    const b = benefits[Math.floor(Math.random()*benefits.length)];
    
    document.getElementById('videoTitle').value = `${h} ${theme.toUpperCase()} Sounds for Sleep & Relaxation (No Talking)`;
    document.getElementById('videoDesc').value = `Enjoy this ${h.toLowerCase()} ${theme} ambience. Perfect for sleep, study, and meditation.\n\n🍃 Theme: ${theme.toUpperCase()}\n🎧 Audio: Real Nature Recording\n✨ Quality: HD\n\n#${theme} #relax #sleep`;
    
    const themeTags = [`#${theme}`, `#${theme}sounds`, `#${theme}ambience`, `#${theme}asmr`, `#${theme}sleep`, `#real${theme}`, `#${theme}video`];
    const combined = [...themeTags, ...GENERIC_TAGS];
    const shuffled = combined.sort(() => 0.5 - Math.random());
    const finalTags = [...new Set(shuffled)].slice(0, 25).join(' ');
    
    document.getElementById('videoTags').value = finalTags;
}
function copyToClip(id) { document.getElementById(id).select(); document.execCommand("copy"); }
