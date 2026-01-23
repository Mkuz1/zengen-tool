/**
 * ZenGen - Studio Pro (Final Build)
 * - Audio: Selectable Variants (Birds/Wind/Rain Types).
 * - Recorder: Frame Hold Logic prevents Safari freezes.
 * - Video: Safe Handoff (0.3s pre-swap) for seamless montage.
 */

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

    playTheme(theme, variant) {
        this.stop();
        if (theme === 'forest') this.forest(variant);
        else if (theme === 'rain') this.rain(variant);
        else if (theme === 'ocean') this.ocean(variant);
        else if (theme === 'fireplace') this.fire(variant);
        else if (theme === 'snow') this.snow(variant);
    }

    forest(variant) {
        const windVol = variant === 'windy' ? 0.6 : 0.3;
        this.runNoise(windVol, 500);
        if (variant !== 'windy') {
            const birdRate = variant === 'morning' ? 1000 : 4000;
            const birdPitch = variant === 'night' ? 600 : 1500;
            this.birdLoop(birdRate, birdPitch);
        }
    }
    rain(variant) {
        const vol = variant === 'heavy' ? 0.8 : 0.4;
        const freq = variant === 'heavy' ? 400 : 1200;
        this.runNoise(vol, freq);
    }
    ocean(variant) {
        const noise = this.createPinkNoise(0.4);
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine'; lfo.frequency.value = variant === 'storm' ? 0.4 : 0.1;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.3; 
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        noise.connect(gain); gain.connect(this.master); lfo.start();
        this.activeNodes.push(noise, lfo);
    }
    fire(variant) {
        this.runNoise(0.7, 100);
        this.crackler(variant === 'roaring' ? 0.95 : 0.99);
    }
    snow(variant) {
        const freq = variant === 'blizzard' ? 400 : 200;
        this.runNoise(0.5, freq);
    }
    runNoise(vol, freq) {
        const noise = this.createPinkNoise(vol);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = freq;
        noise.connect(filter); filter.connect(this.master);
        this.activeNodes.push(noise);
    }
    birdLoop(interval, pitchBase) {
        const chirp = () => {
            if(this.ctx.state === 'suspended') return;
            const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
            const f = pitchBase + Math.random() * 500;
            osc.frequency.setValueAtTime(f, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(f/2, this.ctx.currentTime+0.1);
            g.gain.setValueAtTime(0.1, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime+0.1);
            osc.connect(g); g.connect(this.master);
            osc.start(); osc.stop(this.ctx.currentTime+0.2);
            this.loopTimer = setTimeout(chirp, interval + Math.random()*2000);
        }; chirp();
    }
    crackler(density) {
        const c = this.ctx.createScriptProcessor(4096, 1, 1);
        c.onaudioprocess = e => {
            const o = e.outputBuffer.getChannelData(0);
            for(let i=0; i<o.length; i++) o[i] = (Math.random() > density) ? Math.random()*0.5 : 0;
        };
        c.connect(this.master); this.activeNodes.push(c);
    }
    createPinkNoise(v) { return this.noiseNode(v, (l,w)=> (l+(0.02*w))/1.02); }
    createBrownNoise(v) { return this.noiseNode(v, (l,w)=> (l+(0.02*w))/1.02); }
    noiseNode(vol, algo) {
        const n = this.ctx.createScriptProcessor(4096, 1, 1);
        let last = 0;
        n.onaudioprocess = e => {
            const o = e.outputBuffer.getChannelData(0);
            for(let i=0; i<4096; i++) { const w = Math.random()*2-1; o[i] = algo(last, w); last = o[i]; o[i]*=3.5; }
        };
        const g = this.ctx.createGain(); g.gain.value = vol; n.connect(g); return n;
    }
}
const synth = new NatureSynth();

// --- 2. UI & STATE ---
const AUDIO_OPTIONS = {
    forest: [{id:'morning', name:'🐦 Morning Birds'}, {id:'windy', name:'🍃 Windy Trees'}, {id:'night', name:'🦗 Night Crickets'}],
    ocean: [{id:'calm', name:'🌅 Calm Shore'}, {id:'storm', name:'⛈️ Rough Storm'}, {id:'deep', name:'🌊 Deep Underwater'}],
    rain: [{id:'light', name:'🌧️ Light Shower'}, {id:'heavy', name:'⛈️ Heavy Storm'}],
    fireplace: [{id:'cozy', name:'🔥 Cozy Embers'}, {id:'roaring', name:'🪵 Roaring Fire'}],
    snow: [{id:'calm', name:'❄️ Gentle Snow'}, {id:'blizzard', name:'💨 Blizzard'}]
};

const playerA = document.getElementById('vid1');
const playerB = document.getElementById('vid2');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill.querySelector('div') ? statusPill : document.getElementById('statusPill'); 
const recordBtn = document.getElementById('recordBtn');
const playPauseBtn = document.getElementById('playPauseBtn');

let blobPlaylist = [];
let currentPlaylistIndex = 0;
let activePlayer = playerA; 
let sequenceInterval = null;
let isPlaying = false;

// --- 3. STARTUP ---
async function initStudio() {
    try {
        await synth.resume();
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => { document.getElementById('startScreen').style.display = 'none'; document.getElementById('workspace').style.display = 'flex'; }, 500);
        updateAudioOptions();
    } catch(e) { alert("Audio Engine Failed."); }
}

function updateAudioOptions() {
    const theme = document.getElementById('themeSelect').value;
    const variantSelect = document.getElementById('audioVariant');
    variantSelect.innerHTML = '';
    AUDIO_OPTIONS[theme].forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.id;
        el.innerText = opt.name;
        variantSelect.appendChild(el);
    });
}

function togglePlay() {
    if (isPlaying) {
        activePlayer.pause(); synth.ctx.suspend();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        activePlayer.play(); synth.ctx.resume();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    }
    isPlaying = !isPlaying;
}

// --- 4. GENERATION ---
async function generateContent() {
    if (sequenceInterval) clearInterval(sequenceInterval);
    synth.stop();
    const theme = document.getElementById('themeSelect').value;
    const variant = document.getElementById('audioVariant').value;
    
    statusPill.className = 'status-pill active';
    statusText.textContent = 'Downloading...';
    recordBtn.disabled = true;

    // 1. Fetch Playlist
    const rawUrls = await fetchMontagePlaylist(theme, 4);
    
    if (rawUrls.length > 0) {
        blobPlaylist = [];
        for (let i = 0; i < rawUrls.length; i++) {
            statusText.textContent = `Downloading ${i+1}/4...`;
            const blob = await fetchVideoAsBlob(rawUrls[i]);
            if (blob) blobPlaylist.push(blob);
        }

        if (blobPlaylist.length > 0) {
            // 2. Play
            synth.resume();
            synth.playTheme(theme, variant);
            
            document.getElementById('audioVisualizer').classList.add('active');
            generateViralSEO(theme);
            
            currentPlaylistIndex = 0;
            startPingPong();
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            
        } else { alert("Download failed."); }
    } else { alert("No videos found."); }
}

async function fetchVideoAsBlob(url) {
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

    // Watchdog
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

// --- 6. RECORDER (Frame Hold) ---
function startRecording() {
    synth.resume();
    if (activePlayer.paused) activePlayer.play();

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

    // FRAME HOLD LOGIC (Crucial for Safari)
    // We draw to a buffer. If the video player goes blank (during swap), we stop updating the buffer
    // but keep drawing the OLD buffer to the canvas. This creates a "Frozen" last frame instead of a black screen.
    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = 1280; bufferCanvas.height = 720;
    const bufferCtx = bufferCanvas.getContext('2d');

    const drawInterval = setInterval(() => {
        // Only update the buffer if the player has valid data and is playing
        if (activePlayer.readyState >= 2 && !activePlayer.paused) {
            bufferCtx.drawImage(activePlayer, 0, 0, canvas.width, canvas.height);
        }
        // Always copy buffer to final recorder (Smooths over gaps)
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

// --- 7. UTILS & SEO ---
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
    forest: { hooks: ["Secret", "Enchanted", "Ancient"], benefits: ["Relieve Anxiety", "Cure Insomnia"], keywords: ["#forestsounds", "#natureasmr"] },
    rain: { hooks: ["Heavy", "Torrential", "Cozy"], benefits: ["Deep Sleep Instantly", "Focus"], keywords: ["#heavyrain", "#rainonroof"] },
    ocean: { hooks: ["Tropical", "Midnight"], benefits: ["Calm Your Nerves", "Drift Away"], keywords: ["#oceanwaves", "#beachasmr"] },
    fireplace: { hooks: ["Crackling", "Warm"], benefits: ["Cozy Vibes", "Stress Relief"], keywords: ["#fireplace", "#cracklingfire"] },
    snow: { hooks: ["Arctic", "Blizzard"], benefits: ["Cool Down", "Winter Sleep"], keywords: ["#blizzard", "#snowstorm"] },
    generic: { suffixes: ["(No Talking)", "ASMR", "4K"], tags: ["#shorts", "#viral", "#sleep"] }
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
