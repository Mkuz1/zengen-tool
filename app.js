/**
 * ZenGen - Blob Loader Edition
 * Fixes "403/404" errors by downloading audio as a local blob before playing.
 */

// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. ROBUST AUDIO LIBRARY (Google + Wikimedia Backups) ---
const AUDIO_LIBRARY = {
    forest: [
        "https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/e/e0/Forest_Ambience_-_Start.ogg"
    ],
    rain: [
        "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/4/4b/Rain_on_windowsill.ogg"
    ],
    fireplace: [
        "https://actions.google.com/sounds/v1/ambiences/fire.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/d/d4/Fire_burning_in_a_fireplace.ogg"
    ],
    ocean: [
        "https://actions.google.com/sounds/v1/water/waves_crashing.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/Ocean_Waves.ogg"
    ],
    snow: [
        "https://actions.google.com/sounds/v1/weather/strong_wind_whistling.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/0/07/Wind_in_trees.ogg"
    ]
};

// --- 2. SEO DATA ---
const SEO_DATA = {
    titles: {
        adjectives: ["Relaxing", "Deep", "Peaceful", "Soothing", "Pure", "Tranquil", "Dreamy"],
        nouns: ["Ambience", "Atmosphere", "Meditation", "Escape", "Therapy", "Soundscape"],
        actions: ["for Sleep", "for Focus", "to Relieve Anxiety", "for Studying", "for Yoga"]
    },
    tags: {
        common: ["#shorts", "#relaxation", "#meditation", "#sleep", "#asmr", "#nature", "#peace", "#calm", "#mindfulness"],
        forest: ["#forest", "#woods", "#birds", "#nature", "#green", "#camping", "#wildlife"],
        rain: ["#rain", "#rainstorm", "#thunder", "#rainyday", "#sleepsounds", "#storm"],
        fireplace: ["#fireplace", "#fire", "#burning", "#warmth", "#cozy", "#winter"],
        ocean: ["#ocean", "#sea", "#waves", "#beach", "#summer", "#water"],
        snow: ["#snow", "#winter", "#blizzard", "#cold", "#white", "#arctic"]
    }
};

// --- 3. GLOBAL VARIABLES ---
const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill ? (statusPill.querySelector('div') || statusPill) : null; 
const recordBtn = document.getElementById('recordBtn');

let audioCtx;
let audioDest;      
let audioSource;    

// --- 4. INITIALIZATION ---
async function initStudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.resume(); 

        audioDest = audioCtx.createMediaStreamDestination();
        
        if (!audioSource) {
            audioSource = audioCtx.createMediaElementSource(audioEl);
            audioSource.connect(audioDest);
            audioSource.connect(audioCtx.destination);
        }

        const splash = document.getElementById('startScreen');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
        }, 500);
        
    } catch(e) {
        alert("Audio Engine Failed. Please Refresh.");
    }
}

// --- 5. MAIN LOGIC (BLOB LOADER) ---
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // UI Updates
    if(statusPill) statusPill.className = 'status-pill active';
    if(statusText) statusText.textContent = 'Downloading Media...';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    try {
        // A. Fetch Video
        let videoUrl = await fetchPexelsVideo(theme);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(theme);

        // B. Fetch Audio as BLOB (The Fix)
        const audioBlobUrl = await fetchAudioAsBlob(theme);

        if (videoUrl && audioBlobUrl) {
            videoEl.crossOrigin = "anonymous";
            // No crossOrigin needed for blob URLs, they are local
            
            videoEl.src = videoUrl;
            audioEl.src = audioBlobUrl;

            // C. Play
            videoEl.onloadeddata = () => {
                videoEl.play();
                generateSEO(theme);
            };

            audioEl.onloadeddata = () => {
                audioEl.play().then(() => {
                     document.getElementById('audioVisualizer').classList.add('active');
                     recordBtn.disabled = false;
                     if(statusPill) {
                         statusPill.className = 'status-pill active';
                         statusText.textContent = 'Studio Ready';
                     }
                }).catch(e => console.log("Autoplay waiting for click"));
            };

        } else {
            alert("Could not load media. Please try again.");
        }
    } catch (error) {
        console.error("App Error:", error);
    }
}

// --- 6. THE NEW BLOB DOWNLOADER ---
async function fetchAudioAsBlob(theme) {
    const urls = AUDIO_LIBRARY[theme];
    
    for (let url of urls) {
        try {
            // We fetch the file manually first
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            
            // Convert to Blob (Local File)
            const blob = await response.blob();
            
            // Create a temporary local URL (e.g., blob:https://yoursite/1234...)
            return URL.createObjectURL(blob);
        } catch (error) {
            console.log(`Source failed: ${url}, trying next...`);
        }
    }
    console.error("All audio sources failed for this theme.");
    return null;
}

// --- 7. VIDEO FETCHERS ---
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

// --- 8. SEO ENGINE ---
function generateSEO(theme) {
    const t = SEO_DATA.titles;
    const adj = t.adjectives[Math.floor(Math.random() * t.adjectives.length)];
    const noun = t.nouns[Math.floor(Math.random() * t.nouns.length)];
    const action = t.actions[Math.floor(Math.random() * t.actions.length)];
    
    document.getElementById('videoTitle').value = `${adj} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun} ${action}`;
    
    document.getElementById('videoDesc').value = `Experience the ${adj.toLowerCase()} ${theme} ${noun.toLowerCase()}. 
Designed ${action.toLowerCase()}. 
Pure natural soundscape (no music).

#${theme} #relax #nature`;
    
    const tags = [...SEO_DATA.tags[theme], ...SEO_DATA.tags.common];
    const uniqueTags = [...new Set(tags.sort(() => .5 - Math.random()))].slice(0, 15).join(' ');
    document.getElementById('videoTags').value = uniqueTags;
}

function copyToClip(id) {
    const el = document.getElementById(id);
    el.select();
    document.execCommand("copy");
    const btn = el.nextElementSibling;
    const oldIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => btn.innerHTML = oldIcon, 1500);
}

// --- 9. RECORDER (MP4 Support) ---
function startRecording() {
    if (!audioCtx || audioCtx.state === 'suspended') audioCtx && audioCtx.resume();

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    const canvasStream = canvas.captureStream(30);

    const tracks = [...canvasStream.getVideoTracks()];
    // Get Clean Audio Track
    const audioTrack = audioDest.stream.getAudioTracks()[0];
    if (audioTrack) tracks.push(audioTrack);

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
        if(statusPill) {
             statusPill.className = 'status-pill active';
             statusText.textContent = 'Studio Ready';
        }
        clearInterval(drawInterval);
    };

    const drawInterval = setInterval(() => ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height), 1000/30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;
    if(statusPill) {
        statusPill.className = 'status-pill recording';
        statusText.textContent = 'Recording';
    }
    
    setTimeout(() => mediaRecorder.stop(), 60000);
}
