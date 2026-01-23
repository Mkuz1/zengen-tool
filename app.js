/**
 * ZenGen - Director's Cut
 * - Recorder: Decoupled Double-Buffer (Fixes Safari Freeze)
 * - SEO: Expanded 15+ Tag Engine
 * - Audio: Real Nature Recordings
 */

const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. REAL AUDIO ENGINE ---
const SOUND_LIBRARY = {
    forest: {
        'morning': 'https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg',
        'river': 'https://actions.google.com/sounds/v1/water/stream_water.ogg',
        'crickets': 'https://actions.google.com/sounds/v1/animals/crickets.ogg'
    },
    rain: {
        'heavy': 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
        'roof': 'https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg',
        'thunder': 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg'
    },
    ocean: {
        'waves': 'https://actions.google.com/sounds/v1/water/waves_crashing.ogg',
        'calm': 'https://actions.google.com/sounds/v1/water/river_flow.ogg',
        'deep': 'https://actions.google.com/sounds/v1/water/ocean_surf.ogg'
    },
    fireplace: {
        'cozy': 'https://actions.google.com/sounds/v1/ambiences/fire.ogg',
        'roar': 'https://actions.google.com/sounds/v1/ambiences/fire.ogg'
    },
    snow: {
        'wind': 'https://actions.google.com/sounds/v1/weather/wind_strong.ogg',
        'howl': 'https://actions.google.com/sounds/v1/weather/strong_wind_whistling.ogg'
    }
};

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

// --- 2. UI & STATE ---
const AUDIO_OPTIONS_UI = {
    forest: [{id:'morning', name:'🐦 Morning Birds'}, {id:'river', name:'💧 Flowing River'}, {id:'crickets', name:'🦗 Night Crickets'}],
    ocean: [{id:'waves', name:'🌊 Crashing Waves'}, {id:'calm', name:'🌅 Calm Shore'}, {id:'deep', name:'💨 Deep Surf'}],
    rain: [{id:'heavy', name:'⛈️ Heavy Storm'}, {id:'roof', name:'🏠 Rain on Roof'}, {id:'thunder', name:'⚡ Rolling Thunder'}],
    fireplace: [{id:'cozy', name:'🔥 Cozy Fire'}, {id:'roar', name:'🪵 Roaring Log'}],
    snow: [{id:'wind', name:'💨 Strong Wind'}, {id:'howl', name:'❄️ Arctic Howl'}]
};

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

// --- 3. INIT ---
async function initStudio() {
    try {
        await audioEngine.resume();
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => { document.getElementById('startScreen').style.display = 'none'; document.getElementById('workspace').style.display = 'flex'; }, 500);
        updateAudioOptions();
    } catch(e) { alert("Audio Engine Failed."); }
}

function updateAudioOptions() {
    const theme = document.getElementById('themeSelect').value;
    const variantSelect = document.getElementById('audioVariant');
    variantSelect.innerHTML = '';
    (AUDIO_OPTIONS_UI[theme] || []).forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.id;
        el.innerText = opt.name;
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

// --- 4. GENERATION ---
async function generateContent() {
    if (sequenceInterval) clearInterval(sequenceInterval);
    audioEngine.stop();
    const theme = document.getElementById('themeSelect').value;
    const variant = document.getElementById('audioVariant').value;
    
    statusPill.className = 'status-pill active';
    statusText.textContent = 'Curating...';
    recordBtn.disabled = true;

    // Fetch Playlist
    const rawUrls = await fetchMontagePlaylist(theme, 4);
    
    if (rawUrls.length > 0) {
        blobPlaylist = [];
        for (let i = 0; i < rawUrls.length; i++) {
            statusText.textContent = `Downloading Video ${i+1}/4...`;
            const blob = await fetchBlob(rawUrls[i]);
            if (blob) blobPlaylist.push(blob);
        }

        statusText.textContent = `Downloading Audio...`;
        const soundUrl = SOUND_LIBRARY[theme][variant];
        audioBlobUrl = await fetchBlob(soundUrl);

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

// --- 5. PING PONG LOGIC ---
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

// --- 6. SAFARI-PROOF RECORDER (Decoupled Double Buffer) ---
function startRecording() {
    audioEngine.resume();
    if (activePlayer.paused) activePlayer.play();

    // 1. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    // 2. Setup Audio Stream
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
        clearInterval(bufferInterval);
        clearInterval(timerInterval);
    };

    // 3. THE FIX: Separate "Buffer" Canvas
    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = 1280; bufferCanvas.height = 720;
    const bufferCtx = bufferCanvas.getContext('2d');

    // Interval A: Update Buffer (Only if video is actually moving)
    const bufferInterval = setInterval(() => {
        if (activePlayer.readyState >= 2 && !activePlayer.paused && !activePlayer.seeking) {
            bufferCtx.drawImage(activePlayer, 0, 0, canvas.width, canvas.height);
        }
        // Interval B: Draw to Recorder (Always draws the buffer, even if old)
        ctx.drawImage(bufferCanvas, 0, 0);
    }, 1000 / 30);

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

// --- 7. UTILS & VIRAL SEO ---
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

const SEO_DATA = {
    forest: {
        keys: ["forest sounds", "nature sounds", "birds chirping", "woodland ambience", "forest walk", "nature relaxation", "calm forest", "deep woods", "green noise", "spring forest", "morning nature"],
        hooks: ["Secret Forest", "Enchanted Woods", "Ancient Trees"]
    },
    rain: {
        keys: ["rain sounds", "heavy rain", "rain on roof", "thunderstorm", "rain for sleep", "cozy rain", "rain ambience", "storm sounds", "dark screen rain", "falling rain", "sleep sounds"],
        hooks: ["Heavy Rain", "Cozy Storm", "Midnight Rain"]
    },
    ocean: {
        keys: ["ocean waves", "beach sounds", "waves crashing", "sea ambience", "ocean sleep", "calm waves", "tropical beach", "blue ocean", "water sounds", "tide sounds", "shoreline"],
        hooks: ["Tropical Beach", "Midnight Ocean", "Crystal Waves"]
    },
    fireplace: {
        keys: ["fireplace sounds", "crackling fire", "burning wood", "cozy fireplace", "fire ambience", "winter atmosphere", "warm fire", "relaxing fire", "holiday ambience", "fire sounds", "log cabin"],
        hooks: ["Crackling Fire", "Cozy Cabin", "Winter Warmth"]
    },
    snow: {
        keys: ["blizzard sounds", "howling wind", "snowstorm", "arctic ambience", "winter sleep", "cold wind", "snow ambience", "winter sounds", "white noise", "snowy night", "frosty wind"],
        hooks: ["Arctic Blizzard", "Frozen World", "Winter Storm"]
    }
};

const GENERIC_TAGS = ["#asmr", "#sleep", "#meditation", "#relaxing", "#nature", "#shorts", "#fyp", "#viral", "#stressrelief", "#calm", "#focus", "#study", "#insomnia", "#healing", "#peace"];

function generateViralSEO(theme) {
    const data = SEO_DATA[theme];
    const hook = data.hooks[Math.floor(Math.random() * data.hooks.length)];
    
    // Title
    document.getElementById('videoTitle').value = `${hook} ${theme.toUpperCase()} Sounds for Sleep & Relaxation (No Talking)`;
    
    // Description
    document.getElementById('videoDesc').value = `Enjoy this ${hook.toLowerCase()} ambience. Perfect for sleep, study, and meditation.\n\n🍃 Theme: ${theme.toUpperCase()}\n🎧 Audio: Real Nature Recording\n✨ Quality: HD\n\n#${theme} #relax #sleep`;
    
    // 15+ Tags
    const specificTags = data.keys.map(k => `#${k.replace(/\s+/g, '')}`);
    const mixed = [...specificTags, ...GENERIC_TAGS];
    const shuffled = mixed.sort(() => 0.5 - Math.random());
    const finalTags = [...new Set(shuffled)].slice(0, 20).join(' '); // Ensure 20 tags
    
    document.getElementById('videoTags').value = finalTags;
}

function copyToClip(id) { document.getElementById(id).select(); document.execCommand("copy"); }
