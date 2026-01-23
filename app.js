// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

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

// SPECIFIC SEARCH QUERIES FOR PIXABAY SFX
// We use "loop" to find sounds meant for background ambience
const AUDIO_QUERIES = {
    forest: "forest ambience birds loop",
    rain: "rain heavy loop",
    fireplace: "fireplace fire crackle loop",
    ocean: "ocean waves sea loop",
    snow: "wind blizzard winter loop"
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
        
        // Only create source once
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
        alert("Could not start audio engine. Please refresh.");
    }
}

// --- 2. GENERATE CONTENT ---
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // UI Updates
    if(statusPill) statusPill.className = 'status-pill active';
    if(statusText) statusText.innerHTML = '<div class="dot"></div> Fetching...';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    try {
        // 1. Fetch Video
        let videoUrl = await fetchPexelsVideo(theme);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(theme);

        // 2. Fetch Audio (DYNAMICALLY from Pixabay SFX API)
        const audioUrl = await fetchPixabayAudio(theme);

        if (videoUrl && audioUrl) {
            videoEl.crossOrigin = "anonymous";
            audioEl.crossOrigin = "anonymous";
            
            videoEl.src = videoUrl;
            audioEl.src = audioUrl;

            // 3. Play Video Immediately
            videoEl.onloadeddata = () => {
                videoEl.play();
                generateSEO(theme);
            };

            // 4. Play Audio when ready
            audioEl.onloadeddata = () => {
                audioEl.play().then(() => {
                     document.getElementById('audioVisualizer').classList.add('active');
                     recordBtn.disabled = false;
                     if(statusPill) statusPill.innerHTML = '<div class="dot"></div> Playing';
                }).catch(e => console.log("Audio autoplay waiting for interaction"));
            };

            audioEl.onerror = () => {
                console.warn("Audio failed. Retrying...");
                if(statusPill) statusPill.innerHTML = '<div class="dot" style="background:orange"></div> Audio Error';
            };

        } else {
            alert("Could not find media. Please try again.");
        }
    } catch (error) {
        console.error("Critical Error:", error);
    }
}

// --- 3. API FETCHERS ---

// A. Pixabay Sound Effects (New Function)
async function fetchPixabayAudio(theme) {
    try {
        const query = AUDIO_QUERIES[theme];
        // Note: 'https://pixabay.com/api/sfx/' is the endpoint for Sound Effects (not music)
        const res = await fetch(`https://pixabay.com/api/sfx/?key=${PIXABAY_KEY}&q=${query}`);
        const data = await res.json();
        
        if (data.hits && data.hits.length > 0) {
            // Pick a random sound from the top 5 results
            const poolSize = Math.min(data.hits.length, 5);
            const rand = Math.floor(Math.random() * poolSize);
            return data.hits[rand].url; // This returns a valid .mp3 link
        }
    } catch (e) {
        console.log('Pixabay Audio Error:', e);
    }
    return null;
}

// B. Video Fetchers
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
