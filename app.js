/**
 * ZenGen - Final Stability Fix
 * - Video: Pixabay/Pexels API
 * - Audio: CORS-Friendly Open Source CDN (No API keys needed for audio)
 * - SEO: Auto-generated
 */

// --- CONFIGURATION ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. RELIABLE AUDIO LIBRARY (Direct CDN Links) ---
// We use raw.githack.com to ensure correct CORS headers for recording
const AUDIO_LIBRARY = {
    forest: "https://raw.githack.com/remvze/moodist/main/public/sounds/forest.mp3",
    rain: "https://raw.githack.com/remvze/moodist/main/public/sounds/rain.mp3",
    fireplace: "https://raw.githack.com/remvze/moodist/main/public/sounds/campfire.mp3",
    ocean: "https://raw.githack.com/remvze/moodist/main/public/sounds/waves.mp3",
    snow: "https://raw.githack.com/remvze/moodist/main/public/sounds/wind.mp3"
};

// --- 2. SEO DATA ---
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

// --- 3. GLOBAL VARIABLES ---
const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const statusPill = document.getElementById('statusPill');
const statusText = statusPill ? (statusPill.querySelector('div') || statusPill) : null; 
const recordBtn = document.getElementById('recordBtn');

let audioCtx;
let audioDest;      
let audioSource;    

// --- 4. INITIALIZATION (Required for Recording) ---
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

        // Hide splash screen
        const splash = document.getElementById('startScreen');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            document.getElementById('workspace').style.display = 'flex';
        }, 500);
        
    } catch(e) {
        alert("Audio Engine Failed: " + e.message);
    }
}

// --- 5. MAIN LOGIC ---
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // Reset UI
    if(statusPill) statusPill.className = 'status-pill active';
    if(statusText) statusText.textContent = 'Fetching Content...';
    recordBtn.disabled = true;
    document.getElementById('audioVisualizer').classList.remove('active');

    try {
        // A. Fetch Video (Pixabay/Pexels)
        let videoUrl = await fetchPexelsVideo(theme);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(theme);

        // B. Set Audio (Direct Link)
        // Add random query param to prevent caching issues
        const audioUrl = AUDIO_LIBRARY[theme] + "?t=" + Date.now();

        if (videoUrl) {
            videoEl.crossOrigin = "anonymous";
            audioEl.crossOrigin = "anonymous";
            
            videoEl.src = videoUrl;
            audioEl.src = audioUrl;

            // C. Play Video & Generate SEO
            videoEl.onloadeddata = () => {
                videoEl.play();
                generateSEO(theme);
            };

            // D. Play Audio
            audioEl.onloadeddata = () => {
                audioEl.play().then(() => {
                     document.getElementById('audioVisualizer').classList.add('active');
                     recordBtn.disabled = false;
                     if(statusPill) {
                         statusPill.className = 'status-pill active';
                         statusText.textContent = 'Playing';
                     }
                }).catch(e => console.log("Autoplay waiting for interaction"));
            };

            audioEl.onerror = () => {
                console.warn("Audio failed to load.");
                if(statusPill) {
                    statusPill.className = 'status-pill';
                    statusText.textContent = 'Audio Error';
                }
                // Allow video recording even if audio fails
                recordBtn.disabled = false;
            };

        } else {
            alert("No video found for this theme.");
        }
    } catch (error) {
        console.error("App Error:", error);
    }
}

// --- 6. VIDEO API FETCHERS ---
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
    
    // Title
    const titleText = `${adj} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun} ${action}`;
    document.getElementById('videoTitle').value = titleText;
    
    // Description
    document.getElementById('videoDesc').value = `Experience the ${adj.toLowerCase()} ${theme} ${noun.toLowerCase()}. 
Designed ${action.toLowerCase()}. 
Pure natural soundscape (no music).

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
    const oldIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => btn.innerHTML = oldIcon, 1500);
}

// --- 8. RECORDER (MP4 Support) ---
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
             statusText.textContent = 'Ready';
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
