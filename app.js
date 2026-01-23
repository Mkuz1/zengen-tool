// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// NATURAL SOUNDS ONLY (Strictly enforced)
const AUDIO_LIBRARY = {
    forest: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/forest.mp3"],
    rain: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/rain.mp3"],
    fireplace: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/campfire.mp3"],
    ocean: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/waves.mp3"],
    snow: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/wind.mp3"] 
};

// SEO DATA
const SEO_DATA = {
    titles: {
        adjectives: ["Relaxing", "Deep", "Peaceful", "Soothing", "Pure", "Tranquil"],
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

// GLOBALS
const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill.childNodes[1]; 
const recordBtn = document.getElementById('recordBtn');

// AUDIO ENGINE GLOBALS
let audioCtx;
let audioDest;      // Stream destination for Recorder
let audioSource;    // The node connecting the HTML <audio> to the Context

// --- 1. INITIALIZATION (The Audio Fix) ---
async function initStudio() {
    // A. Start Audio Context on User Gesture
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume(); // Force "Running" state

    // B. Setup Routing Logic (Once)
    // 1. Create Destination for Recorder
    audioDest = audioCtx.createMediaStreamDestination();
    
    // 2. Create Source from <audio> element
    if (!audioSource) {
        audioSource = audioCtx.createMediaElementSource(audioEl);
        
        // 3. Connect Graph: Source -> Recorder Destination -> Speakers
        audioSource.connect(audioDest);
        audioSource.connect(audioCtx.destination);
    }

    // C. Transition UI
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('workspace').style.display = 'flex';
}

// --- 2. GENERATE CONTENT ---
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // UI Updates
    statusPill.className = 'status-pill active';
    statusText.textContent = "Fetching content...";
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    try {
        // Fetch Video
        let videoUrl = await fetchPexelsVideo(theme);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(theme);

        // Fetch Audio (Always first from library)
        const audioUrl = AUDIO_LIBRARY[theme][0] + "?t=" + Date.now();

        if (videoUrl) {
            videoEl.crossOrigin = "anonymous";
            audioEl.crossOrigin = "anonymous";
            
            videoEl.src = videoUrl;
            audioEl.src = audioUrl;

            // Wait for load
            await Promise.all([
                new Promise(r => videoEl.onloadeddata = r),
                new Promise(r => audioEl.onloadeddata = r)
            ]);

            // Play & Confirm
            videoEl.play();
            audioEl.play()
                .then(() => {
                    // Show Visualizer if audio plays
                    document.getElementById('audioVisualizer').classList.add('active');
                    statusText.textContent = "Playing";
                    recordBtn.disabled = false;
                })
                .catch(e => {
                    console.error("Autoplay failed:", e);
                    statusText.textContent = "Click Play needed";
                });
            
            generateSEO(theme);
        }
    } catch (error) {
        console.error(error);
        statusText.textContent = "Error loading";
    }
}

// --- 3. FETCHERS ---
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
    } catch (e) {} return null;
}

async function fetchPixabayVideo(query) {
    try {
        const page = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=10&page=${page}`);
        const data = await res.json();
        if (data.hits.length) return data.hits[Math.floor(Math.random() * data.hits.length)].videos.medium.url;
    } catch (e) {} return null;
}

// --- 4. SEO GENERATOR ---
function generateSEO(theme) {
    const t = SEO_DATA.titles;
    const adj = t.adjectives[Math.floor(Math.random() * t.adjectives.length)];
    const noun = t.nouns[Math.floor(Math.random() * t.nouns.length)];
    const action = t.actions[Math.floor(Math.random() * t.actions.length)];
    
    document.getElementById('videoTitle').value = `${adj} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun} ${action}`;
    document.getElementById('videoDesc').value = `Enjoy this ${adj.toLowerCase()} ${theme} ${noun.toLowerCase()}. Pure nature sounds, no music. #${theme} #relax`;
    
    const tags = [...SEO_DATA.tags[theme], ...SEO_DATA.tags.common];
    document.getElementById('videoTags').value = [...new Set(tags.sort(() => .5 - Math.random()))].slice(0, 15).join(' ');
}

function copyToClip(id) {
    document.getElementById(id).select();
    document.execCommand("copy");
    statusText.textContent = "Copied to clipboard!";
    setTimeout(() => statusText.textContent = "Ready", 2000);
}

// --- 5. RECORDING (AUDIO-SAFE) ---
function startRecording() {
    // Safety check
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Setup Video Stream
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(30);

    // COMBINE: Video Stream + The Audio Destination Stream (which we connected in init)
    const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks() // This is the Clean Audio Feed
    ];

    if (audioDest.stream.getAudioTracks().length === 0) {
        alert("Audio Engine not active. Refresh and click 'Enter Studio'.");
        return;
    }

    const combinedStream = new MediaStream(combinedTracks);
    
    // Format Logic
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
        statusPill.className = 'status-pill active';
        statusText.textContent = "Export Complete";
        clearInterval(drawInterval);
    };

    const drawInterval = setInterval(() => ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height), 1000/30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;
    statusPill.className = 'status-pill recording';
    statusText.textContent = "Recording in progress...";
    
    setTimeout(() => mediaRecorder.stop(), 60000);
}
