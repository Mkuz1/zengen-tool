/**
 * ZenGen - "Safari Pro" Edition
 * - CSS: Uses Z-Index swapping instead of Opacity (Forces Safari to decode).
 * - JS: "Safe Handoff" ensures recorder only switches when target is moving.
 */

// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. PROCEDURAL AUDIO ---
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

let blobPlaylist = [];
let currentPlaylistIndex = 0;
let renderSource = playerA; // The player currently being drawn to canvas
let sequenceInterval = null;

// --- 3. INIT ---
async function initStudio() {
    try {
        await synth.resume();
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => { document.getElementById('startScreen').style.display = 'none'; document.getElementById('workspace').style.display = 'flex'; }, 500);
    } catch(e) { alert("Audio Engine Failed. Refresh."); }
}

// --- 4. GENERATE CONTENT ---
async function generateContent() {
    if (sequenceInterval) clearInterval(sequenceInterval);
    synth.stop();
    const theme = document.getElementById('themeSelect').value;
    
    statusPill.className = 'status-pill active';
    statusText.textContent = 'Curating...';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    const rawUrls = await fetchMontagePlaylist(theme, 4);
    
    if (rawUrls.length > 0) {
        blobPlaylist = [];
        for (let i = 0; i < rawUrls.length; i++) {
            statusText.textContent = `Downloading ${i+1}/4...`;
            const blob = await fetchVideoAsBlob(rawUrls[i]);
            if (blob) blobPlaylist.push(blob);
        }

        if (blobPlaylist.length > 0) {
            synth.resume();
            if(theme==='rain') synth.playRain();
            else if(theme==='snow') synth.playSnow();
            else if(theme==='ocean') synth.playOcean();
            else if(theme==='fireplace') synth.playFire();
            else if(theme==='forest') synth.playForest();
            
            document.getElementById('audioVisualizer').classList.add('active');
            generateViralSEO(theme);
            
            currentPlaylistIndex = 0;
            startPingPong();
            
        } else {
            alert("Download failed.");
        }
    } else {
        alert("No videos found.");
    }
}

async function fetchVideoAsBlob(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) { return null; }
}

// --- 5. SAFARI-PROOF PING PONG ---
function startPingPong() {
    // Reset
    playerA.className = 'active';
    playerB.className = 'standby';
    renderSource = playerA;

    playerA.src = blobPlaylist[0];
    playerA.play();
    
    if (blobPlaylist.length > 1) {
        playerB.src = blobPlaylist[1];
        playerB.load(); // Just load, don't play yet
    }

    statusText.textContent = 'Live';
    recordBtn.disabled = false;

    // WATCHDOG
    sequenceInterval = setInterval(() => {
        // Look at the active player
        const active = playerA.classList.contains('active') ? playerA : playerB;
        if (!active.duration) return;

        // Trigger swap 0.3s before end
        if (active.duration - active.currentTime < 0.3) {
            triggerSwap();
        }
    }, 100);
}

function triggerSwap() {
    const active = playerA.classList.contains('active') ? playerA : playerB;
    const next = active === playerA ? playerB : playerA;

    // 1. Play Next
    next.play().then(() => {
        // 2. ONLY after it starts playing, we switch visual state
        // This ensures Safari doesn't freeze the recorder
        active.className = 'standby';
        next.className = 'active';
        
        // 3. Update the recorder target
        renderSource = next;

        // 4. Preload future clip into old player
        currentPlaylistIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
        const futureIndex = (currentPlaylistIndex + 1) % blobPlaylist.length;
        active.src = blobPlaylist[futureIndex];
        active.load();
        
    }).catch(e => console.error("Swap failed", e));
}

// --- 6. RECORDER (Frame Holding) ---
function startRecording() {
    synth.resume();
    // Ensure both are ready (Safari check)
    if (playerA.paused && playerA.classList.contains('active')) playerA.play();
    if (playerB.paused && playerB.classList.contains('active')) playerB.play();

    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
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

    // SAFARI SAFE DRAW LOOP
    const drawInterval = setInterval(() => {
        // We only draw the 'renderSource' if it is actually ready.
        // If it's swapping, we simply keep the last frame (don't clearRect),
        // effectively "holding" the image until the new video is ready.
        if (renderSource.readyState >= 2) {
            ctx.drawImage(renderSource, 0, 0, canvas.width, canvas.height);
        }
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

// --- 7. FETCHERS & SEO (Standard) ---
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

const SEO_ENGINE = {
    forest: { hooks: ["Secret", "Enchanted", "Ancient", "Misty", "Deep"], benefits: ["Relieve Anxiety", "Cure Insomnia", "Instant Calm"], keywords: ["#forestsounds", "#natureasmr", "#woodland", "#birds"] },
    rain: { hooks: ["Heavy", "Torrential", "Cozy", "Midnight"], benefits: ["Deep Sleep Instantly", "Focus for Studying", "Beat Insomnia"], keywords: ["#heavyrain", "#rainonroof", "#thundersounds", "#rainstorm"] },
    ocean: { hooks: ["Tropical", "Midnight", "Crystal Clear", "Deep Blue"], benefits: ["Calm Your Nerves", "Drift Away", "Theta Waves"], keywords: ["#oceanwaves", "#beachasmr", "#wavesounds", "#seascape"] },
    fireplace: { hooks: ["Crackling", "Roaring", "Warm", "Winter"], benefits: ["Cozy Vibes", "Warm Your Soul", "Stress Relief"], keywords: ["#fireplace", "#cracklingfire", "#firesounds", "#cozyambience"] },
    snow: { hooks: ["Arctic", "Blizzard", "Howling", "Frozen"], benefits: ["Cool Down", "Winter Sleep", "Focus Isolation"], keywords: ["#blizzard", "#snowstorm", "#arcticwind", "#winterambience"] },
    generic: { suffixes: ["(No Talking)", "(Dark Screen)", "ASMR", "4K Ultra HD", "8D Audio"], tags: ["#shorts", "#fyp", "#viral", "#trending", "#sleep"] }
};

function generateViralSEO(theme) {
    const data = SEO_ENGINE[theme];
    const generic = SEO_ENGINE.generic;
    const hook = data.hooks[Math.floor(Math.random() * data.hooks.length)];
    const benefit = data.benefits[Math.floor(Math.random() * data.benefits.length)];
    const suffix = generic.suffixes[Math.floor(Math.random() * generic.suffixes.length)];
    document.getElementById('videoTitle').value = `${hook} ${theme.toUpperCase()} Sounds ${benefit} ${suffix}`;
    document.getElementById('videoDesc').value = `Experience the ${hook.toLowerCase()} power of ${theme} sounds.\nThis video is designed to help you ${benefit.toLowerCase()}.\nPure nature atmosphere with NO talking and NO loops.\n\n✅ Features:\n- ${suffix}\n- High Definition Audio\n- Natural Stress Relief\n\n#${theme} #relax`;
    const pool = [...data.keywords, ...generic.tags];
    document.getElementById('videoTags').value = [...new Set(pool.sort(() => 0.5 - Math.random()))].slice(0, 15).join(' ');
}
function copyToClip(id) { document.getElementById(id).select(); document.execCommand("copy"); }
