/**
 * ZenGen - "Montage" Edition
 * - Video: Fetches a playlist of 3-4 clips and plays them sequentially.
 * - Audio: Procedural Nature Sounds (Non-repetitive).
 * - Recording: Captures the scene changes into a single seamless MP4/WebM.
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

    async resume() {
        if (this.ctx.state === 'suspended') await this.ctx.resume();
    }

    stop() {
        if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
        this.activeNodes.forEach(n => {
            try { if(n.stop) n.stop(); n.disconnect(); } catch(e){}
        });
        this.activeNodes = [];
    }

    // --- SOUND GENERATORS ---
    playRain() {
        this.stop();
        const noise = this.createPinkNoise(0.8);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400 + Math.random() * 800; 
        noise.connect(filter);
        filter.connect(this.master);
        this.activeNodes.push(noise);
    }

    playSnow() {
        this.stop();
        const noise = this.createPinkNoise(0.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200 + Math.random() * 300; 
        noise.connect(filter);
        filter.connect(this.master);
        this.activeNodes.push(noise);
    }

    playOcean() {
        this.stop();
        const noise = this.createPinkNoise(0.4);
        const gain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + Math.random() * 0.2; 
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.3; 
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        noise.connect(gain);
        gain.connect(this.master);
        lfo.start();
        this.activeNodes.push(noise, lfo);
    }

    playFire() {
        this.stop();
        const noise = this.createBrownNoise(0.7);
        const crackle = this.ctx.createScriptProcessor(4096, 1, 1);
        crackle.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < output.length; i++) {
                const threshold = 0.990 + (Math.random() * 0.009);
                output[i] = (Math.random() > threshold) ? (Math.random() * 0.5) : 0;
            }
        };
        crackle.connect(this.master);
        noise.connect(this.master);
        this.activeNodes.push(noise, crackle);
    }

    playForest() {
        this.stop(); 
        const noise = this.createPinkNoise(0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500 + Math.random() * 300; 
        noise.connect(filter);
        filter.connect(this.master);
        this.activeNodes.push(noise);

        const playChirp = () => {
            if(this.ctx.state === 'suspended') return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startFreq = 1500 + Math.random() * 1500;
            osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(startFreq/2, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.master);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
            this.loopTimer = setTimeout(playChirp, 1000 + Math.random() * 4000);
        };
        playChirp();
    }

    // Helpers
    createPinkNoise(vol) {
        const bufferSize = 4096;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
        let lastOut = 0;
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; 
            }
        };
        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        node.connect(gain);
        return node;
    }
    
    createBrownNoise(vol) {
        const bufferSize = 4096;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
        let lastBrown = 0;
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastBrown + (0.02 * white)) / 1.02;
                lastBrown = output[i];
                output[i] *= 3.5; 
            }
        };
        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        node.connect(gain);
        return node;
    }
}

const synth = new NatureSynth();

// --- 2. GLOBAL VARIABLES & STATE ---
const videoEl = document.getElementById('mainVideo');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill ? (statusPill.querySelector('div') || statusPill) : null; 
const recordBtn = document.getElementById('recordBtn');

// Playlist State
let currentPlaylist = [];
let currentVideoIndex = 0;

// SEO DATA
const SEO_DATA = {
    titles: {
        adjectives: ["Relaxing", "Deep", "Peaceful", "Soothing", "Pure", "Tranquil", "Dreamy"],
        nouns: ["Ambience", "Atmosphere", "Meditation", "Escape", "Therapy", "Soundscape"],
        actions: ["for Sleep", "for Focus", "to Relieve Anxiety", "for Studying"]
    },
    tags: {
        common: ["#shorts", "#relaxation", "#meditation", "#sleep", "#asmr", "#nature", "#peace"],
        forest: ["#forest", "#woods", "#birds", "#nature", "#green"],
        rain: ["#rain", "#rainstorm", "#thunder", "#rainyday", "#sleepsounds"],
        fireplace: ["#fireplace", "#fire", "#burning", "#warmth", "#cozy"],
        ocean: ["#ocean", "#sea", "#waves", "#beach", "#summer"],
        snow: ["#snow", "#winter", "#blizzard", "#cold", "#white"]
    }
};

// --- 3. PERSISTENT HISTORY ---
const HISTORY_KEY = 'zenGen_seen_videos';
function getSeenVideos() {
    const saved = localStorage.getItem(HISTORY_KEY);
    return new Set(saved ? JSON.parse(saved) : []);
}
function markVideoAsSeen(id) {
    const seen = getSeenVideos();
    seen.add(id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...seen]));
}

// --- 4. INITIALIZATION ---
async function initStudio() {
    try {
        await synth.resume();
        const splash = document.getElementById('startScreen');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
        }, 500);
        
        // Setup Video End Listener for Playlist
        videoEl.onended = playNextInQueue;
        
    } catch(e) {
        alert("Audio Engine Failed. Refresh.");
    }
}

// --- 5. MAIN LOGIC (MONTAGE GENERATOR) ---
async function generateContent() {
    synth.stop(); 
    const theme = document.getElementById('themeSelect').value;
    
    // UI Updates
    if(statusPill) statusPill.className = 'status-pill active';
    if(statusText) statusText.textContent = 'Curating Montage...';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    try {
        // Fetch 4 Videos for the Playlist
        currentPlaylist = await fetchMontagePlaylist(theme, 4);
        currentVideoIndex = 0;

        if (currentPlaylist.length > 0) {
            // Setup First Video
            playVideoAtIndex(0);

            // Start Audio
            synth.resume();
            if(theme === 'rain') synth.playRain();
            else if(theme === 'snow') synth.playSnow();
            else if(theme === 'ocean') synth.playOcean();
            else if(theme === 'fireplace') synth.playFire();
            else if(theme === 'forest') synth.playForest();
            
            document.getElementById('audioVisualizer').classList.add('active');
            generateSEO(theme);

        } else {
            alert("Not enough new videos found. Try another theme.");
        }
    } catch (error) {
        console.error("App Error:", error);
    }
}

// Helper: Play specific video from playlist
function playVideoAtIndex(index) {
    if (index >= currentPlaylist.length) {
        index = 0; // Loop back to start if we run out
    }
    currentVideoIndex = index;
    
    const url = currentPlaylist[index];
    videoEl.crossOrigin = "anonymous";
    videoEl.src = url;
    videoEl.loop = false; // Important: Don't loop individual clips, let them finish so onended fires
    videoEl.muted = true;
    
    videoEl.play().catch(e => console.log("Play interrupted"));
    
    if(statusPill) statusText.textContent = `Playing Clip ${index + 1}/${currentPlaylist.length}`;
    recordBtn.disabled = false;
}

// Helper: Triggered automatically when a video ends
function playNextInQueue() {
    playVideoAtIndex(currentVideoIndex + 1);
}

// --- 6. FETCHERS (Montage Logic) ---
async function fetchMontagePlaylist(query, count) {
    let playlist = [];
    const seen = getSeenVideos();
    
    // Try Pexels First (Higher Quality)
    try {
        const page = Math.floor(Math.random() * 20) + 1;
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=15&page=${page}&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        
        if (data.videos?.length > 0) {
            // Filter unseen videos
            const fresh = data.videos.filter(v => !seen.has(v.id));
            
            // Shuffle and pick 'count' videos
            const shuffled = fresh.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count);
            
            selected.forEach(vid => {
                markVideoAsSeen(vid.id);
                const url = vid.video_files.find(f => f.width === 1280)?.link || vid.video_files[0].link;
                playlist.push(url);
            });
        }
    } catch (e) {}

    // Fill gaps with Pixabay if Pexels didn't provide enough
    if (playlist.length < count) {
        try {
            const page = Math.floor(Math.random() * 10) + 1;
            const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=15&page=${page}`);
            const data = await res.json();
            if (data.hits.length) {
                 const shuffled = data.hits.sort(() => 0.5 - Math.random());
                 const needed = count - playlist.length;
                 const selected = shuffled.slice(0, needed);
                 selected.forEach(vid => playlist.push(vid.videos.medium.url));
            }
        } catch (e) {}
    }

    return playlist;
}

// --- 7. SEO ---
function generateSEO(theme) {
    const t = SEO_DATA.titles;
    const adj = t.adjectives[Math.floor(Math.random() * t.adjectives.length)];
    const noun = t.nouns[Math.floor(Math.random() * t.nouns.length)];
    const action = t.actions[Math.floor(Math.random() * t.actions.length)];
    
    document.getElementById('videoTitle').value = `${adj} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun} ${action}`;
    document.getElementById('videoDesc').value = `Pure ${theme} ambience. No music. #${theme}`;
    const tags = [...SEO_DATA.tags[theme], ...SEO_DATA.tags.common];
    document.getElementById('videoTags').value = [...new Set(tags.sort(() => .5 - Math.random()))].slice(0, 15).join(' ');
}

function copyToClip(id) {
    document.getElementById(id).select();
    document.execCommand("copy");
}

// --- 8. RECORDER ---
function startRecording() {
    synth.resume();
    if (videoEl.paused) videoEl.play();

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(30);

    const audioDest = synth.ctx.createMediaStreamDestination();
    synth.master.connect(audioDest);
    
    const tracks = [...canvasStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()];
    const combinedStream = new MediaStream(tracks);
    
    let options = { mimeType: 'video/webm; codecs=vp9' };
    let ext = 'webm';
    if (MediaRecorder.isTypeSupported('video/mp4')) { options = { mimeType: 'video/mp4' }; ext = 'mp4'; }
    else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) { options = { mimeType: 'video/webm; codecs=h264' }; ext = 'mp4'; }

    const mediaRecorder = new MediaRecorder(combinedStream, options);
    const chunks = [];

    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ZenGen-${document.getElementById('themeSelect').value}-${Date.now()}.${ext}`;
        a.click();
        
        recordBtn.innerHTML = '<div class="rec-icon"></div> Record (1 Min)';
        recordBtn.disabled = false;
        if(statusPill) statusText.textContent = 'Live';
        clearInterval(drawInterval);
        clearInterval(timerInterval);
    };

    const drawInterval = setInterval(() => {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    }, 1000 / 30);

    // Countdown
    let timeLeft = 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        recordBtn.innerText = `Recording... ${timeLeft}s`;
        if (timeLeft <= 0) clearInterval(timerInterval);
    }, 1000);

    mediaRecorder.start();
    recordBtn.disabled = true;
    if(statusPill) statusText.textContent = 'Recording';
    
    setTimeout(() => mediaRecorder.stop(), 60000);
}
