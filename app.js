/**
 * ZenGen - Procedural Audio Edition
 * - Video: Pixabay/Pexels API
 * - Audio: Mathematically generated in-browser (No 404s possible)
 * - SEO: Auto-generated
 */

// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. PROCEDURAL AUDIO ENGINE ---
// This class generates nature sounds using pure JavaScript math.
class NatureSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.activeNodes = [];
    }

    async resume() {
        if (this.ctx.state === 'suspended') await this.ctx.resume();
    }

    stop() {
        this.activeNodes.forEach(n => {
            try { n.stop(); n.disconnect(); } catch(e){}
        });
        this.activeNodes = [];
    }

    // Noise Generator (White, Pink, Brown)
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        }
        return buffer;
    }

    // --- SOUND GENERATORS ---

    playRain() {
        this.stop();
        const noise = this.createPinkNoise(0.8);
        // Lowpass filter to make it sound like heavy rain
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        noise.connect(filter);
        filter.connect(this.master);
        this.activeNodes.push(noise);
    }

    playSnow() { // Wind
        this.stop();
        const noise = this.createPinkNoise(0.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Muffled wind
        noise.connect(filter);
        filter.connect(this.master);
        this.activeNodes.push(noise);
    }

    playOcean() {
        this.stop();
        const noise = this.createPinkNoise(0.4);
        const gain = this.ctx.createGain();
        
        // LFO to simulate waves crashing (volume goes up and down)
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15; // Slow wave speed
        
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.3; // Depth of wave
        
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
        // Add random "crackle" pops
        const crackle = this.ctx.createScriptProcessor(4096, 1, 1);
        crackle.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < output.length; i++) {
                // Random click every now and then
                output[i] = (Math.random() > 0.995) ? (Math.random() * 0.5) : 0;
            }
        };
        crackle.connect(this.master);
        
        noise.connect(this.master);
        this.activeNodes.push(noise, crackle);
    }

    playForest() {
        this.playSnow(); // Base wind
        // Simple Bird Chirp Simulation (Sine waves)
        const playChirp = () => {
            if(this.ctx.state === 'suspended') return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(2000 + Math.random()*1000, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            
            osc.connect(gain);
            gain.connect(this.master);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.2);
            
            // Schedule next chirp randomly
            setTimeout(playChirp, 1000 + Math.random() * 3000);
        };
        playChirp();
    }

    // Helpers
    createPinkNoise(vol) {
        const bufferSize = 4096;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
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

// Global Noise Variables
let lastOut = 0;
let lastBrown = 0;
const synth = new NatureSynth();

// --- 2. SEO DATA ---
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

// --- 3. DOM ELEMENTS ---
const videoEl = document.getElementById('mainVideo');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill ? (statusPill.querySelector('div') || statusPill) : null; 
const recordBtn = document.getElementById('recordBtn');

// --- 4. INITIALIZATION ---
async function initStudio() {
    try {
        await synth.resume();
        // Hide splash
        const splash = document.getElementById('startScreen');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
        }, 500);
    } catch(e) {
        alert("Audio Engine Failed. Please refresh.");
    }
}

// --- 5. MAIN LOGIC ---
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // UI Updates
    if(statusPill) statusPill.className = 'status-pill active';
    if(statusText) statusText.textContent = 'Curating...';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    try {
        // A. Fetch Video
        let videoUrl = await fetchPexelsVideo(theme);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(theme);

        if (videoUrl) {
            videoEl.crossOrigin = "anonymous";
            videoEl.src = videoUrl;

            // B. Play Audio (Procedural)
            synth.resume();
            if(theme === 'rain') synth.playRain();
            else if(theme === 'snow') synth.playSnow();
            else if(theme === 'ocean') synth.playOcean();
            else if(theme === 'fireplace') synth.playFire();
            else if(theme === 'forest') synth.playForest();
            
            document.getElementById('audioVisualizer').classList.add('active');

            // C. Play Video & SEO
            videoEl.onloadeddata = () => {
                videoEl.play();
                generateSEO(theme);
                recordBtn.disabled = false;
                if(statusPill) statusText.textContent = 'Live';
            };

        } else {
            alert("No video found. Try again.");
        }
    } catch (error) {
        console.error("App Error:", error);
    }
}

// --- 6. VIDEO FETCHERS ---
const usedVideoIds = new Set();
async function fetchPexelsVideo(query) {
    try {
        const page = Math.floor(Math.random() * 10) + 1;
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=10&page=${page}&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        if (data.videos?.length > 0) {
            const fresh = data.videos.filter(v => !usedVideoIds.has(v.id));
            const pool = fresh.length ? fresh : data.videos;
            const vid = pool[Math.floor(Math.random() * pool.length)];
            usedVideoIds.add(vid.id);
            return vid.video_files.find(f => f.width === 1280)?.link || vid.video_files[0].link;
        }
    } catch (e) { console.log('Pexels skipped'); } return null;
}

async function fetchPixabayVideo(query) {
    try {
        const page = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=10&page=${page}`);
        const data = await res.json();
        if (data.hits.length) return data.hits[Math.floor(Math.random() * data.hits.length)].videos.medium.url;
    } catch (e) { console.log('Pixabay skipped'); } return null;
}

// --- 7. SEO ENGINE ---
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

// --- 8. RECORDER (Fixed for Procedural Audio) ---
function startRecording() {
    synth.resume();
    
    // Create Stream from Canvas (Video)
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(30);

    // Create Stream from Audio Context (Procedural Audio)
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
    };

    const drawInterval = setInterval(() => ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height), 1000/30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;
    if(statusPill) statusText.textContent = 'Recording';
    
    setTimeout(() => mediaRecorder.stop(), 60000);
}
