// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// 1. RELIABLE AUDIO (Google Hosted - 100% Uptime & CORS Friendly)
const AUDIO_LIBRARY = {
    forest: ["https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg"],
    rain: ["https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg"],
    fireplace: ["https://actions.google.com/sounds/v1/ambiences/fire.ogg"],
    ocean: ["https://actions.google.com/sounds/v1/water/waves_crashing.ogg"],
    snow: ["https://actions.google.com/sounds/v1/weather/strong_wind_whistling.ogg"] // Wind sounds like snow storm
};

// SEO DATA
const SEO_DATA = {
    titles: {
        adjectives: ["Relaxing", "Deep", "Peaceful", "Soothing", "Pure", "Tranquil", "Dreamy", "Restorative"],
        nouns: ["Ambience", "Atmosphere", "Meditation", "Escape", "Therapy", "Soundscape", "Retreat", "Haven"],
        actions: ["for Sleep", "for Focus", "to Relieve Anxiety", "for Studying", "for Yoga", "for Deep Rest"]
    },
    tags: {
        common: ["#shorts", "#relaxation", "#meditation", "#sleep", "#asmr", "#nature", "#peace", "#calm", "#mindfulness", "#wellness"],
        forest: ["#forest", "#woods", "#birds", "#nature", "#green", "#camping", "#wildlife", "#trees"],
        rain: ["#rain", "#rainstorm", "#thunder", "#rainyday", "#sleepsounds", "#storm", "#heavyrain"],
        fireplace: ["#fireplace", "#fire", "#burning", "#warmth", "#cozy", "#winter", "#cracklingfire"],
        ocean: ["#ocean", "#sea", "#waves", "#beach", "#summer", "#water", "#seascape"],
        snow: ["#snow", "#winter", "#blizzard", "#cold", "#white", "#arctic", "#wind"]
    }
};

// GLOBALS
const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill.querySelector('div') ? statusPill : document.getElementById('statusPill'); 
const recordBtn = document.getElementById('recordBtn');

// AUDIO ENGINE GLOBALS
let audioCtx;
let audioDest;      
let audioSource;    

// --- 1. INITIALIZATION ---
async function initStudio() {
    try {
        // A. Start Audio Context
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.resume(); 

        // B. Routing
        audioDest = audioCtx.createMediaStreamDestination();
        
        if (!audioSource) {
            audioSource = audioCtx.createMediaElementSource(audioEl);
            audioSource.connect(audioDest);
            audioSource.connect(audioCtx.destination);
        }

        // C. UI Transition
        document.getElementById('startScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
        }, 500);
        
    } catch(e) {
        alert("Could not start audio engine. Please refresh and try again.");
    }
}

// --- 2. GENERATE CONTENT (Crash-Proof Logic) ---
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // UI Updates
    if(statusPill) statusPill.className = 'status-pill active';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    try {
        // 1. Fetch Video
        let videoUrl = await fetchPexelsVideo(theme);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(theme);

        // 2. Fetch Audio (Google Link)
        // We add a timestamp to ensure the browser treats it as a fresh request
        const audioUrl = AUDIO_LIBRARY[theme][0] + "?t=" + Date.now();

        if (videoUrl) {
            videoEl.crossOrigin = "anonymous";
            audioEl.crossOrigin = "anonymous";
            
            videoEl.src = videoUrl;
            audioEl.src = audioUrl;

            // 3. Robust Loading (Won't crash if audio is slow)
            videoEl.onloadeddata = () => {
                videoEl.play();
                generateSEO(theme); // Generate SEO as soon as video is ready
            };

            audioEl.onloadeddata = () => {
                audioEl.play().then(() => {
                     document.getElementById('audioVisualizer').classList.add('active');
                     recordBtn.disabled = false;
                     if(statusPill) statusPill.innerHTML = '<div class="dot"></div> Playing';
                }).catch(e => console.log("Audio autoplay restricted, waiting for interaction"));
            };

            // Error Handling: If audio fails, still allow recording video
            audioEl.onerror = () => {
                console.warn("Audio failed to load. Continuing with video only.");
                recordBtn.disabled = false; // Allow recording anyway
                if(statusPill) statusPill.innerHTML = '<div class="dot" style="background:orange"></div> No Audio';
            };

        } else {
            alert("Could not find a video for this theme. Please try again.");
        }
    } catch (error) {
        console.error("Critical Error:", error);
    }
}

// --- 3. API FETCHERS ---
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
            // Prefer HD
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

// --- 4. SEO GENERATOR ---
function generateSEO(theme) {
    const t = SEO_DATA.titles;
    const adj = t.adjectives[Math.floor(Math.random() * t.adjectives.length)];
    const noun = t.nouns[Math.floor(Math.random() * t.nouns.length)];
    const action = t.actions[Math.floor(Math.random() * t.actions.length)];
    
    // Title
    document.getElementById('videoTitle').value = `${adj} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun} ${action}`;
    
    // Description
    document.getElementById('videoDesc').value = `Immerse yourself in this ${adj.toLowerCase()} ${theme} ${noun.toLowerCase()}. 
Perfect ${action.toLowerCase()}. 
1 minute of pure nature sounds (no music) to help you reset.

#${theme} #relax #nature`;
    
    // Tags
    const tags = [...SEO_DATA.tags[theme], ...SEO_DATA.tags.common];
    const uniqueTags = [...new Set(tags.sort(() => .5 - Math.random()))].slice(0, 15).join(' ');
    document.getElementById('videoTags').value = uniqueTags;
}

function copyToClip(id) {
    const el = document.getElementById(id);
    el.select();
    document.execCommand("copy");
    // Visual feedback
    const btn = el.nextElementSibling;
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => btn.innerHTML = originalIcon, 1500);
}

// --- 5. RECORDING ---
function startRecording() {
    if (!audioCtx || audioCtx.state === 'suspended') audioCtx && audioCtx.resume();

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(30);

    // Combine Video + Clean Audio
    const tracks = [...canvasStream.getVideoTracks()];
    const audioTrack = audioDest.stream.getAudioTracks()[0];
    
    if (audioTrack) tracks.push(audioTrack);
    else console.warn("Recording video without audio (Audio track missing)");

    const combinedStream = new MediaStream(tracks);
    
    // Format Support Check
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
        statusPill.innerHTML = '<div class="dot"></div> Ready';
        clearInterval(drawInterval);
    };

    const drawInterval = setInterval(() => ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height), 1000/30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;
    statusPill.innerHTML = '<div class="dot" style="background:red; box-shadow:0 0 10px red;"></div> Recording';
    
    setTimeout(() => mediaRecorder.stop(), 60000);
}
