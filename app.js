/**
 * ZenGen - Final Audio Fix
 * Fixes: Silent video export by strictly routing AudioContext
 */

// --- 1. CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 2. AUDIO SOURCES (CDN) ---
const AUDIO_LIBRARY = {
    forest: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/forest.mp3"],
    rain: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/rain.mp3"],
    fireplace: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/campfire.mp3"],
    ocean: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/waves.mp3"],
    snow: ["https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/wind.mp3"] 
};

// --- 3. SEO DATA ---
const SEO_DATA = {
    titles: {
        adjectives: ["Relaxing", "Calming", "Deep", "Peaceful", "Soothing", "Instant", "Pure"],
        nouns: ["Ambience", "Atmosphere", "Vibes", "Meditation", "Escape", "Therapy"],
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

// --- 4. GLOBAL VARIABLES ---
const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const loadingEl = document.getElementById('loading');
const recordBtn = document.getElementById('recordBtn');
const socialPanel = document.getElementById('socialPanel');

// Global Audio Context (Must be reused)
let audioCtx;
let audioSource;
let audioDest;

// --- 5. MAIN LOGIC ---

async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // UI Reset
    loadingEl.style.display = 'flex';
    loadingEl.querySelector('span').innerText = 'Mixing audio & video...';
    recordBtn.disabled = true;
    if(socialPanel) socialPanel.style.display = 'none';

    try {
        // A. Wake up Audio Context (CRITICAL FIX FOR SOUND)
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        // B. Fetch Content
        let videoData = await fetchPexelsVideo(theme);
        if (!videoData) videoData = await fetchPixabayVideo(theme);
        const audioUrl = AUDIO_LIBRARY[theme][0] + "?nocache=" + Date.now();

        if (videoData) {
            // C. Setup Player
            videoEl.crossOrigin = "anonymous";
            audioEl.crossOrigin = "anonymous";
            
            videoEl.src = videoData;
            audioEl.src = audioUrl;
            
            // Ensure volume is up
            audioEl.volume = 1.0;

            // D. Wait for Load
            await Promise.all([
                new Promise((resolve) => {
                    videoEl.onloadeddata = resolve;
                    videoEl.play();
                }),
                new Promise((resolve) => {
                    audioEl.onloadeddata = resolve;
                    audioEl.play().catch(e => console.log("Autoplay caught", e));
                })
            ]);

            loadingEl.style.display = 'none';
            recordBtn.disabled = false;
            
            // E. SEO
            generateSEO(theme);
            if(socialPanel) socialPanel.style.display = 'block';
            
        }
    } catch (error) {
        console.error(error);
        loadingEl.querySelector('span').innerText = 'Error loading content.';
    }
}

// --- 6. API FETCHERS ---
const usedVideoIds = new Set();

async function fetchPexelsVideo(query) {
    try {
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=10&page=${randomPage}&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        if (data.videos?.length > 0) {
            const newVideos = data.videos.filter(v => !usedVideoIds.has(v.id));
            const pool = newVideos.length > 0 ? newVideos : data.videos;
            const video = pool[Math.floor(Math.random() * pool.length)];
            usedVideoIds.add(video.id);
            const file = video.video_files.find(f => f.width === 1280) || video.video_files[0];
            return file.link;
        }
    } catch (e) { console.log('Pexels skipped'); }
    return null;
}

async function fetchPixabayVideo(query) {
    try {
        const randomPage = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=10&page=${randomPage}`);
        const data = await res.json();
        if (data.hits.length > 0) {
            return data.hits[Math.floor(Math.random() * data.hits.length)].videos.medium.url;
        }
    } catch (e) { console.log('Pixabay skipped'); }
    return null;
}

// --- 7. SEO GENERATOR ---
function generateSEO(theme) {
    const t = SEO_DATA.titles;
    const adj = t.adjectives[Math.floor(Math.random() * t.adjectives.length)];
    const noun = t.nouns[Math.floor(Math.random() * t.nouns.length)];
    const action = t.actions[Math.floor(Math.random() * t.actions.length)];
    
    document.getElementById('metaPanel').style.display = 'block';
    document.getElementById('videoTitle').value = `${adj} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun} ${action}`;
    document.getElementById('videoDesc').value = `Enjoy ${adj} ${theme} ${noun}. Natural sounds only. #${theme}`;
    
    const pool = [...SEO_DATA.tags[theme], ...SEO_DATA.tags.common];
    document.getElementById('videoTags').value = [...new Set(pool.sort(() => 0.5 - Math.random()))].slice(0, 15).join(' ');
}

function copyToClip(id) {
    document.getElementById(id).select();
    document.execCommand("copy");
}

// --- 8. RECORDING (AUDIO FIX) ---

function startRecording() {
    // 1. Initialize Audio Context if missing
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 2. Create Media Stream Destination (The "Recorder Input")
    if (!audioDest) audioDest = audioCtx.createMediaStreamDestination();

    // 3. Connect Audio Element to Context (If not already connected)
    // We wrap this in try/catch because connecting the same node twice throws an error
    try {
        if (!audioSource) {
            audioSource = audioCtx.createMediaElementSource(audioEl);
            audioSource.connect(audioDest);       // Connect to Recorder
            audioSource.connect(audioCtx.destination); // Connect to Speakers (so you can hear it)
        }
    } catch (e) {
        console.log("Audio node already connected, reusing...");
    }

    // 4. Create Canvas Stream (Video)
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(30);

    // 5. Combine Video + Audio (The Critical Mix)
    // We strictly pull the audio track from the 'audioDest' we created above
    const audioTrack = audioDest.stream.getAudioTracks()[0];
    const combinedTracks = [...canvasStream.getVideoTracks()];
    
    if (audioTrack) {
        combinedTracks.push(audioTrack);
    } else {
        alert("Warning: Audio track not detected. Please try reloading the page.");
    }

    const combinedStream = new MediaStream(combinedTracks);

    // 6. Start Recorder (MP4 Preferred)
    let options = { mimeType: 'video/webm; codecs=vp9' };
    let ext = 'webm';
    if (MediaRecorder.isTypeSupported('video/mp4')) { options = { mimeType: 'video/mp4' }; ext = 'mp4'; }
    else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) { options = { mimeType: 'video/webm; codecs=h264' }; ext = 'mp4'; }

    const mediaRecorder = new MediaRecorder(combinedStream, options);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const theme = document.getElementById('themeSelect').value;
        a.download = `ZenGen-${theme}-${Date.now()}.${ext}`;
        a.click();
        
        recordBtn.innerText = "Record 1-Min Clip";
        recordBtn.disabled = false;
        clearInterval(drawInterval);
    };

    // Animation Loop
    const drawInterval = setInterval(() => {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    }, 1000 / 30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;

    // Stop after 60s
    setTimeout(() => mediaRecorder.stop(), 60000);
}
