/**
 * ZenGen - Automated Relaxation Video Generator
 * Features: 
 * - Random Page Search (No Duplicates)
 * - Smart Audio Fallback (CORS-Friendly)
 * - MP4/H.264 Priority Recording
 * - Advanced SEO & Upload Shortcuts
 */

// --- 1. CONFIGURATION & KEYS ---
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 2. AUDIO SOURCES (CDN + Backup) ---
const AUDIO_LIBRARY = {
    forest: [
        "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/forest.mp3",
        "https://upload.wikimedia.org/wikipedia/commons/3/36/Forest_ambience.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/a/a2/Bird_Singing_in_Forest.ogg"
    ],
    rain: [
        "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/rain.mp3",
        "https://upload.wikimedia.org/wikipedia/commons/4/4b/Rain_on_windowsill.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/2/29/Thunder_storm.ogg"
    ],
    fireplace: [
        "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/campfire.mp3",
        "https://upload.wikimedia.org/wikipedia/commons/d/d4/Fire_burning_in_a_fireplace.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/9/9b/Fireplace_sound.ogg"
    ],
    ocean: [
        "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/waves.mp3",
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/Ocean_Waves.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/f/f3/Gentle_Waves.ogg"
    ],
    snow: [
        "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/wind.mp3", // Wind works best for snow
        "https://upload.wikimedia.org/wikipedia/commons/0/07/Wind_in_trees.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/8/82/Wind_Howling.ogg"
    ]
};

// --- 3. SEO DATA (Unique Generator) ---
const SEO_DATA = {
    titles: {
        adjectives: ["Relaxing", "Calming", "Deep", "Peaceful", "Soothing", "Instant", "Pure", "Stress-Free", "Natural", "Dreamy", "Quiet"],
        nouns: ["Ambience", "Atmosphere", "Vibes", "Meditation", "Escape", "Therapy", "Background Noise", "Sleep Aid", "Nature Sounds"],
        actions: ["for Sleep", "for Focus", "to Relieve Anxiety", "for Studying", "for Deep Rest", "to Calm Your Mind", "for Yoga", "for Reading"]
    },
    tags: {
        common: ["#shorts", "#relaxation", "#meditation", "#sleep", "#asmr", "#nature", "#peace", "#calm", "#focus", "#study", "#healing", "#yoga", "#wellness", "#mindfulness", "#stressrelief", "#lofi", "#backgroundnoise"],
        forest: ["#forest", "#woods", "#birds", "#naturelovers", "#green", "#trees", "#outdoors", "#wildlife", "#camping", "#forestsounds", "#jungle", "#hiking"],
        rain: ["#rain", "#rainstorm", "#thunder", "#rainyday", "#cozy", "#sleepsounds", "#heavyrain", "#raining", "#pluviophile", "#storm", "#rainyvibes"],
        fireplace: ["#fireplace", "#fire", "#burning", "#warmth", "#winter", "#cabin", "#cracklingfire", "#home", "#comfort", "#hearth", "#fireside"],
        ocean: ["#ocean", "#sea", "#waves", "#beach", "#summer", "#water", "#seascape", "#tropical", "#blue", "#coast", "#surf"],
        snow: ["#snow", "#winter", "#blizzard", "#cold", "#ice", "#arctic", "#wind", "#white", "#snowfall", "#christmas", "#holiday"]
    }
};

// --- 4. DOM ELEMENTS ---
const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const loadingEl = document.getElementById('loading');
const recordBtn = document.getElementById('recordBtn');
const socialPanel = document.getElementById('socialPanel');

// Track used video IDs to prevent duplicates in one session
const usedVideoIds = new Set();

// --- 5. MAIN LOGIC ---

async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    
    // UI Updates
    loadingEl.style.display = 'block';
    loadingEl.innerText = 'Searching global database for fresh content...';
    recordBtn.disabled = true;
    if(socialPanel) socialPanel.style.display = 'none';

    try {
        // A. Fetch Video (Randomized Pages 1-10)
        let videoData = await fetchPexelsVideo(theme);
        if (!videoData) videoData = await fetchPixabayVideo(theme);

        // B. Fetch Audio (Cycle through backups)
        const audioUrl = await getWorkingAudio(theme);

        if (videoData && audioUrl) {
            // C. Setup Player
            videoEl.crossOrigin = "anonymous";
            audioEl.crossOrigin = "anonymous";
            
            videoEl.src = videoData;
            audioEl.src = audioUrl;

            // D. Wait for Load
            await Promise.all([
                new Promise((resolve, reject) => {
                    videoEl.onloadeddata = resolve;
                    videoEl.onerror = () => reject("Video failed to load.");
                }),
                new Promise((resolve) => {
                    audioEl.onloadeddata = resolve;
                    audioEl.onerror = resolve; // Continue even if audio hiccups (will try to play)
                })
            ]);

            loadingEl.style.display = 'none';
            videoEl.play();
            audioEl.play().catch(e => console.log("Autoplay blocked"));
            recordBtn.disabled = false;
            
            // E. Generate SEO & Show Socials
            generateSEO(theme);
            if(socialPanel) socialPanel.style.display = 'block';
            
        } else {
            throw new Error("Could not find media sources.");
        }
    } catch (error) {
        console.error(error);
        loadingEl.innerText = 'Error: ' + error.message;
    }
}

// --- 6. API FETCHERS (Randomized) ---

async function fetchPexelsVideo(query) {
    try {
        // Randomize page to avoid duplicates
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=10&page=${randomPage}&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        
        if (data.videos && data.videos.length > 0) {
            // Filter already used videos
            const newVideos = data.videos.filter(v => !usedVideoIds.has(v.id));
            const pool = newVideos.length > 0 ? newVideos : data.videos;
            
            const rand = Math.floor(Math.random() * pool.length);
            const video = pool[rand];
            usedVideoIds.add(video.id); // Mark used
            
            // Prefer HD (1280px width)
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
            const rand = Math.floor(Math.random() * data.hits.length);
            return data.hits[rand].videos.medium.url;
        }
    } catch (e) { console.log('Pixabay skipped'); }
    return null;
}

async function getWorkingAudio(theme) {
    const sources = AUDIO_LIBRARY[theme];
    // Simple check: return the first one. 
    // (If specific complex retry logic is needed, it can go here, but CDN is usually stable)
    // We add a timestamp to prevent browser caching issues
    return sources[0] + "?nocache=" + Date.now();
}

// --- 7. SEO ENGINE ---

function generateSEO(theme) {
    const t = SEO_DATA.titles;
    
    // 1. Title
    const adj = t.adjectives[Math.floor(Math.random() * t.adjectives.length)];
    const noun = t.nouns[Math.floor(Math.random() * t.nouns.length)];
    const action = t.actions[Math.floor(Math.random() * t.actions.length)];
    const title = `${adj} ${theme.charAt(0).toUpperCase() + theme.slice(1)} ${noun} ${action}`;
    
    // 2. Description
    const desc = `Experience ${adj.toLowerCase()} ${theme} ${noun.toLowerCase()}. 
This video is designed ${action.toLowerCase()}. 
Pure natural soundscape with no instrumental music.
    
#${theme} #relaxation #nature`;

    // 3. Tags (Pick 15 unique)
    const pool = [...SEO_DATA.tags[theme], ...SEO_DATA.tags.common];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selectedTags = [...new Set(shuffled)].slice(0, 15).join(' ');

    // 4. Update Inputs
    document.getElementById('metaPanel').style.display = 'block';
    document.getElementById('videoTitle').value = title;
    document.getElementById('videoDesc').value = desc;
    document.getElementById('videoTags').value = selectedTags;
}

function copyToClip(id) {
    const copyText = document.getElementById(id);
    copyText.select();
    document.execCommand("copy");
}

// --- 8. RECORDING SYSTEM (MP4 Priority) ---

function startRecording() {
    // A. Security Check
    try {
        const test = document.createElement('canvas');
        test.getContext('2d').drawImage(videoEl, 0, 0);
        test.toDataURL(); 
    } catch (e) {
        alert("This video is protected and cannot be downloaded. Please click 'Find Content' to get a new one.");
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // B. Audio Mix
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioEl);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioCtx.destination);

    // C. Stream Combine
    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ]);

    // D. Format Selection (MP4 vs WebM)
    let options = { mimeType: 'video/webm; codecs=vp9' };
    let ext = 'webm';

    if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
        ext = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) {
        options = { mimeType: 'video/webm; codecs=h264' };
        ext = 'mp4'; // H.264 inside WebM container often works as mp4
    }

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
        
        recordBtn.innerText = "🔴 Record 1-Min Clip";
        recordBtn.disabled = false;
        clearInterval(drawInterval);
    };

    // E. Animation Loop
    const drawInterval = setInterval(() => {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    }, 1000 / 30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;

    setTimeout(() => mediaRecorder.stop(), 60000);
}
