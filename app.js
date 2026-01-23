/**
 * ZenGen - "Montage Studio" Final
 * - Video: Dual-Player Ping-Pong (Seamless Transitions)
 * - Audio: Procedural Nature Engine (Infinite, Non-Repeating)
 * - Recorder: Global State Tracking (Fixes "Frozen Video" bug)
 */

// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. PROCEDURAL AUDIO ENGINE ---
class NatureSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.activeNodes = [];
        this.loopTimer = null; 
    }
    async resume() { if (this.ctx.state === 'suspended') await this.ctx.resume(); }
    stop() {
        if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
        this.activeNodes.forEach(n => { try { if(n.stop) n.stop(); n.disconnect(); } catch(e){} });
        this.activeNodes = [];
    }
    
    // Generators
    playRain() { this.runNoise(0.8, 400 + Math.random()*800); }
    playSnow() { this.runNoise(0.5, 200 + Math.random()*300); }
    playForest() { this.runNoise(0.3, 500 + Math.random()*300); this.birdLoop(); }
    
    playOcean() {
        this.stop();
        const noise = this.createPinkNoise(0.4);
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine'; lfo.frequency.value = 0.1 + Math.random()*0.2;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.3; 
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        noise.connect(gain); gain.connect(this.master); lfo.start();
        this.activeNodes.push(noise, lfo);
    }
    
    playFire() {
        this.stop();
        const noise = this.createBrownNoise(0.7);
        const crackle = this.ctx.createScriptProcessor(4096, 1, 1);
        crackle.onaudioprocess = (e) => {
            const out = e.outputBuffer.getChannelData(0);
            for(let i=0; i<out.length; i++) out[i] = (Math.random() > 0.992) ? Math.random()*0.5 : 0;
        };
        crackle.connect(this.master); noise.connect(this.master);
        this.activeNodes.push(noise, crackle);
    }

    // Shared Helper
    runNoise(vol, freq) {
        this.stop();
        const noise = this.createPinkNoise(vol);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = freq;
        noise.connect(filter); filter.connect(this.master);
        this.activeNodes.push(noise);
    }
    birdLoop() {
        const chirp = () => {
            if(this.ctx.state === 'suspended') return;
            const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
            const f = 1500+Math.random()*1500;
            osc.frequency.setValueAtTime(f, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(f/2, this.ctx.currentTime+0.1);
            g.gain.setValueAtTime(0.1, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime+0.1);
            osc.connect(g); g.connect(this.master);
            osc.start(); osc.stop(this.ctx.currentTime+0.2);
            this.loopTimer = setTimeout(chirp, 1000+Math.random()*4000);
        }; chirp();
    }
    
    createPinkNoise(v) { return this.noiseNode(v, 4096, (l,w)=> (l+(0.02*w))/1.02); }
    createBrownNoise(v) { return this.noiseNode(v, 4096, (l,w)=> (l+(0.02*w))/1.02); }
    noiseNode(vol, size, algo) {
        const n = this.ctx.createScriptProcessor(size, 1, 1);
        let last = 0;
        n.onaudioprocess = e => {
            const o = e.outputBuffer.getChannelData(0);
            for(let i=0; i<size; i++) { const w = Math.random()*2-1; o[i] = algo(last, w); last = o[i]; o[i]*=3.5; }
        };
        const g = this.ctx.createGain(); g.gain.value = vol; n.connect(g); return n;
    }
}
const synth = new NatureSynth();

// --- 2. GLOBAL STATE ---
const playerA = document.getElementById('vid1');
const playerB = document.getElementById('vid2');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill.querySelector('div') ? statusPill : document.getElementById('statusPill'); 
const recordBtn = document.getElementById('recordBtn');

let currentPlaylist = [];
let currentIndex = 0;
// CRITICAL: We track the ACTIVE player in a variable for the recorder
let currentPlayer = playerA; 

// --- 3. INIT ---
async function initStudio() {
    try {
        await synth.resume();
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => { document.getElementById('startScreen').style.display = 'none'; document.getElementById('workspace').style.display = 'flex'; }, 500);
        
        // Setup Ping-Pong Listeners
        playerA.onended = () => swapPlayers(playerA, playerB);
        playerB.onended = () => swapPlayers(playerB, playerA);
        
    } catch(e) { alert("Audio Engine Failed. Refresh."); }
}

// --- 4. GENERATE MONTAGE ---
async function generateContent() {
    synth.stop();
    const theme = document.getElementById('themeSelect').value;
    
    // UI
    statusPill.className = 'status-pill active';
    statusText.textContent = 'Building Playlist...';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    // Fetch 4 Videos
    currentPlaylist = await fetchMontagePlaylist(theme, 4);
    
    if (currentPlaylist.length > 0) {
        // Start Audio
        synth.resume();
        if(theme==='rain') synth.playRain();
        else if(theme==='snow') synth.playSnow();
        else if(theme==='ocean') synth.playOcean();
        else if(theme==='fireplace') synth.playFire();
        else if(theme==='forest') synth.playForest();
        
        document.getElementById('audioVisualizer').classList.add('active');
        generateSEO(theme);
        
        // Start Video Sequence
        currentIndex = 0;
        startVideoSequence();
        
    } else {
        alert("Not enough new videos found.");
    }
}

// --- 5. PING-PONG LOGIC ---
function startVideoSequence() {
    // 1. Reset Players
    playerA.className = 'active';
    playerB.className = 'standby';
    currentPlayer = playerA; // Recorder will look at A

    // 2. Load Clip 0 into A
    loadClip(playerA, 0);
    playerA.play();

    // 3. Preload Clip 1 into B
    if (currentPlaylist.length > 1) {
        loadClip(playerB, 1);
    }
    
    statusText.textContent = 'Playing Sequence';
    recordBtn.disabled = false;
}

function loadClip(videoEl, index) {
    // Wrap around playlist
    const safeIndex = index % currentPlaylist.length;
    videoEl.src = currentPlaylist[safeIndex];
    videoEl.load();
}

function swapPlayers(endingPlayer, nextPlayer) {
    // 1. Update Recorder Target IMMEDIATELY
    currentPlayer = nextPlayer;

    // 2. Visual Swap
    endingPlayer.className = 'standby';
    nextPlayer.className = 'active';
    
    // 3. Play Next
    nextPlayer.play();

    // 4. Preload Future Clip
    currentIndex++;
    loadClip(endingPlayer, currentIndex + 1);
}

// --- 6. RECORDER (Smart & Robust) ---
function startRecording() {
    synth.resume();
    if (currentPlayer.paused) currentPlayer.play();

    // FIXED CANVAS SIZE (HD)
    const canvas = document.createElement('canvas');
    canvas.width = 1280; 
    canvas.height = 720; 
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(30);

    const audioDest = synth.ctx.createMediaStreamDestination();
    synth.master.connect(audioDest);
    
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
        clearInterval(drawInterval);
        clearInterval(timerInterval);
    };

    // CRITICAL FIX: The loop always draws 'currentPlayer'
    // This variable is updated by swapPlayers the instant the video changes.
    const drawInterval = setInterval(() => {
        try {
            // Only draw if we have a valid image (prevents black frames)
            if (currentPlayer.readyState >= 2) {
                ctx.drawImage(currentPlayer, 0, 0, canvas.width, canvas.height);
            }
        } catch(e) { console.log("Frame drop"); }
    }, 1000 / 30);

    // Countdown UI
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

// --- 7. FETCHERS & SEO ---
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
    
    // Fallback if needed
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
    titles: { adj: ["Relaxing","Deep","Peaceful"], noun: ["Ambience","Atmosphere","Escape"], act: ["for Sleep","for Focus"] },
    tags: { common: ["#shorts","#nature","#peace"], themes: { forest:["#forest"], rain:["#rain"], ocean:["#ocean"], snow:["#snow"], fireplace:["#fire"] } }
};

function generateSEO(theme) {
    const t = SEO_DATA.titles;
    const adj = t.adj[Math.floor(Math.random()*t.adj.length)];
    const noun = t.noun[Math.floor(Math.random()*t.noun.length)];
    const act = t.act[Math.floor(Math.random()*t.act.length)];
    document.getElementById('videoTitle').value = `${adj} ${theme.charAt(0).toUpperCase()+theme.slice(1)} ${noun} ${act}`;
    document.getElementById('videoDesc').value = `Pure ${theme} ambience. No music. #${theme}`;
    const tags = [...(SEO_DATA.tags.themes[theme]||[]), ...SEO_DATA.tags.common];
    document.getElementById('videoTags').value = [...new Set(tags.sort(()=>.5-Math.random()))].slice(0,15).join(' ');
}
function copyToClip(id) { document.getElementById(id).select(); document.execCommand("copy"); }
