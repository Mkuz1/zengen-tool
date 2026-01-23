/**
 * ZenGen - Ultimate Edition
 * - Audio: Pixabay Real Audio (High Fidelity, Natural).
 * - Recorder: AnimationFrame Loop (Safari Fix).
 * - SEO: 20+ Tag Generator.
 */

const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. AUDIO ENGINE (Web Audio API + Pixabay) ---
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
        } catch(e) { console.error("Audio Playback Error", e); }
    }
}
const audioEngine = new AudioPlayer();

// --- 2. GLOBAL STATE ---
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
let audioOptionsCache = {};

// --- 3. INIT & AUDIO SEARCH ---
async function initStudio() {
    try {
        await audioEngine.resume();
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => { document.getElementById('startScreen').style.display = 'none'; document.getElementById('workspace').style.display = 'flex'; }, 500);
        loadAudioOptions(); // Load initial options
    } catch(e) { alert("Audio Engine Failed."); }
}

async function loadAudioOptions() {
    const theme = document.getElementById('themeSelect').value;
    const variantSelect = document.getElementById('audioVariant');
    
    // Clear & Show Loading
    variantSelect.innerHTML = '<option>Searching sounds...</option>';
    
    // Fetch from Pixabay Audio API
    const res = await fetch(`https://pixabay.com/api/audio/?key=${PIXABAY_KEY}&q=${theme}&per_page=5&category=nature`);
    const data = await res.json();
    
    variantSelect.innerHTML = '';
    
    if (data.hits && data.hits.length > 0) {
        // Cache the hits so we can get the URL later
        audioOptionsCache = {};
        data.hits.forEach(hit => {
            // Keep names short
            const name = hit.tags.split(',')[0].toUpperCase(); 
            audioOptionsCache[hit.id] = hit.audio.url; // Preview URL (MP3)
            
            const el = document.createElement('option');
            el.value = hit.id;
            el.innerText = `🎵 ${name}`;
            variantSelect.appendChild(el);
        });
    } else {
        variantSelect.innerHTML = '<option>No sounds found</option>';
    }
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

// --- 4. CONTENT GENERATION ---
async function generateContent() {
    if (sequenceInterval) clearInterval(sequenceInterval);
    audioEngine.stop();
    
    const theme = document.getElementById('themeSelect').value;
    const selectedAudioId = document.getElementById('audioVariant').value;
    
    statusPill.className = 'status-pill active';
    statusText.textContent = 'Curating...';
    recordBtn.disabled = true;

    // 1. Fetch Video Playlist
    const rawUrls = await fetchMontagePlaylist(theme, 4);
    
    if (rawUrls.length > 0) {
        blobPlaylist = [];
        
        // 2. Download Videos
        for (let i = 0; i < rawUrls.length; i++) {
            statusText.textContent = `Downloading Video ${i+1}/4...`;
            const blob = await fetchBlob(rawUrls[i]);
            if (blob) blobPlaylist.push(blob);
        }

        // 3. Download Audio
        statusText.textContent = `Downloading Audio...`;
        const audioUrl = audioOptionsCache[selectedAudioId];
        audioBlobUrl = await fetchBlob(audioUrl); // Download MP3 as blob to bypass CORS/Network issues

        if (blobPlaylist.length > 0 && audioBlobUrl) {
            
            // Play
            await audioEngine.resume();
            audioEngine.play(audioBlobUrl);
            
            document.getElementById('audioVisualizer').classList.add('active');
            generateViralSEO(theme);
            
            currentPlaylistIndex = 0;
            startPingPong();
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            
        } else { alert("Download failed. Try again."); }
    } else { alert("No videos found."); }
}

async function fetchBlob(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) { return null; }
}

// --- 5. VIDEO ENGINE (Safe Swap) ---
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

// --- 6. RECORDER (RequestAnimationFrame Fix) ---
function startRecording() {
    audioEngine.resume();
    if (activePlayer.paused) activePlayer.play();

    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    const canvasStream = canvas.captureStream(30);
    const audioDest = audioEngine.ctx.createMediaStreamDestination();
    audioEngine.gainNode.connect(audioDest);
    const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()]);
    
    let options = { mimeType: 'video/webm; codecs=vp9' };
    if (MediaRecorder.isTypeSupported('video/mp4')) options = { mimeType: 'video/mp4' }; // Safari 14.1+

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
        cancelAnimationFrame(drawId);
        clearInterval(timerInterval);
    };

    // THE SAFARI FIX: Animation Loop + Double Buffer
    let drawId;
    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = 1280; bufferCanvas.height = 720;
    const bufferCtx = bufferCanvas.getContext('2d');

    function drawLoop() {
        if (activePlayer.readyState >= 2 && !activePlayer.paused) {
            bufferCtx.drawImage(activePlayer, 0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(bufferCanvas, 0, 0); // Always draw buffer (prevents blank frames)
        drawId = requestAnimationFrame(drawLoop);
    }
    drawLoop();

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

const GENERIC_TAGS = ["#asmr", "#sleep", "#meditation", "#relaxing", "#nature", "#shorts", "#fyp", "#viral", "#stressrelief", "#calm", "#focus", "#study", "#insomnia", "#healing", "#peace", "#zen", "#mindfulness", "#deepfocus", "#studymusic", "#backgroundnoise"];

function generateViralSEO(theme) {
    const hooks = ["Secret", "Enchanted", "Deep", "Cozy", "Midnight", "Ancient", "Dreamy", "Magical"];
    const benefits = ["Relieve Anxiety", "Cure Insomnia", "Instant Calm", "Focus", "Stop Overthinking"];
    
    const h = hooks[Math.floor(Math.random()*hooks.length)];
    const b = benefits[Math.floor(Math.random()*benefits.length)];
    
    document.getElementById('videoTitle').value = `${h} ${theme.toUpperCase()} Sounds for Sleep & Relaxation (No Talking)`;
    document.getElementById('videoDesc').value = `Enjoy this ${h.toLowerCase()} ${theme} ambience. Perfect for sleep, study, and meditation.\n\n🍃 Theme: ${theme.toUpperCase()}\n🎧 Audio: Real Nature Recording\n✨ Quality: HD\n\n#${theme} #relax #sleep`;
    
    // Generate 20+ tags
    const themeTags = [`#${theme}`, `#${theme}sounds`, `#${theme}ambience`, `#${theme}asmr`, `#${theme}sleep`, `#real${theme}`, `#${theme}video`];
    const combined = [...themeTags, ...GENERIC_TAGS];
    const shuffled = combined.sort(() => 0.5 - Math.random());
    const finalTags = [...new Set(shuffled)].slice(0, 25).join(' ');
    
    document.getElementById('videoTags').value = finalTags;
}
function copyToClip(id) { document.getElementById(id).select(); document.execCommand("copy"); }
