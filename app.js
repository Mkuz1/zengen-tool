// Configuration
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// 1. THE OPEN AUDIO LIBRARY (CORS-Friendly Online Sources)
// These links are from Wikimedia Commons, which allows direct recording.
const ONLINE_AUDIO_LIBRARY = {
    forest: [
        "https://upload.wikimedia.org/wikipedia/commons/6/66/Summer_Nature_Sounds.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/a/a2/Bird_Singing_in_Forest.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/3/36/Forest_ambience.ogg"
    ],
    snow: [
        "https://upload.wikimedia.org/wikipedia/commons/0/07/Wind_in_trees.ogg", // Winter wind
        "https://upload.wikimedia.org/wikipedia/commons/8/82/Wind_Howling.ogg"
    ],
    ocean: [
        "https://upload.wikimedia.org/wikipedia/commons/7/7b/Ocean_Waves.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/b/be/Ocean_waves_lapping.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/f/f3/Gentle_Waves.ogg"
    ],
    rain: [
        "https://upload.wikimedia.org/wikipedia/commons/4/4b/Rain_on_windowsill.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/8/8f/Rain_falling_on_leaves.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/2/29/Thunder_storm.ogg"
    ],
    fireplace: [
        "https://upload.wikimedia.org/wikipedia/commons/d/d4/Fire_burning_in_a_fireplace.ogg",
        "https://upload.wikimedia.org/wikipedia/commons/9/9b/Fireplace_sound.ogg"
    ]
};

const META_TEMPLATES = {
    forest: { query: "forest+trees+nature", titles: ["Mystic Forest Relaxation", "Deep Woods Peace"], tags: "#forest #nature #calm" },
    snow: { query: "snow+winter+falling", titles: ["Winter Wonderland", "Arctic Calm"], tags: "#snow #winter #cozy" },
    ocean: { query: "ocean+waves+beach", titles: ["Blue Ocean Waves", "Sea Shore Calm"], tags: "#ocean #sea #waves" },
    rain: { query: "rain+window+storm", titles: ["Rain on Window", "Heavy Storm Sleep"], tags: "#rain #storm #sleep" },
    fireplace: { query: "fireplace+fire+burning", titles: ["Cozy Crackling Fire", "Warm Cabin"], tags: "#fireplace #fire #warmth" }
};

const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const loadingEl = document.getElementById('loading');
const recordBtn = document.getElementById('recordBtn');

// A. Content Generation
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    loadingEl.style.display = 'block';
    loadingEl.innerText = 'Fetching online content...';
    recordBtn.disabled = true;

    try {
        // 1. Fetch Video (Pexels -> Pixabay Fallback)
        let videoUrl = await fetchPexelsVideo(META_TEMPLATES[theme].query);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(META_TEMPLATES[theme].query);

        // 2. Fetch Audio (Random Pick from Online Library)
        // We add '?nocache' to ensure the browser requests a fresh permission check
        const soundList = ONLINE_AUDIO_LIBRARY[theme];
        const randomSound = soundList[Math.floor(Math.random() * soundList.length)];
        const audioUrl = randomSound + "?nocache=" + Date.now();

        if (videoUrl && audioUrl) {
            // Setup Media
            videoEl.crossOrigin = "anonymous"; // CRITICAL for recording
            audioEl.crossOrigin = "anonymous"; // CRITICAL for recording
            
            videoEl.src = videoUrl;
            audioEl.src = audioUrl;

            // Wait for both to be ready
            await Promise.all([
                new Promise(resolve => videoEl.onloadeddata = resolve),
                new Promise(resolve => audioEl.onloadeddata = resolve)
            ]);

            loadingEl.style.display = 'none';
            videoEl.play();
            audioEl.play();
            recordBtn.disabled = false;
            generateMetadata(theme);
        } else {
            throw new Error("Missing media");
        }
    } catch (error) {
        console.error(error);
        loadingEl.innerText = 'Error fetching content. Please try again.';
    }
}

// B. API Fetchers
async function fetchPexelsVideo(query) {
    try {
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=8&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
            const rand = Math.floor(Math.random() * data.videos.length);
            const video = data.videos[rand];
            // Prefer HD (1280w) for balance of quality/speed
            const bestFile = video.video_files.find(f => f.width >= 1280 && f.width <= 1920) || video.video_files[0];
            return bestFile.link;
        }
    } catch (e) { console.log('Pexels skipped', e); }
    return null;
}

async function fetchPixabayVideo(query) {
    try {
        const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=8`);
        const data = await res.json();
        if (data.hits.length > 0) {
            const rand = Math.floor(Math.random() * data.hits.length);
            return data.hits[rand].videos.large.url;
        }
    } catch (e) { console.log('Pixabay skipped', e); }
    return null;
}

// C. Metadata
function generateMetadata(theme) {
    const data = META_TEMPLATES[theme];
    const randTitle = data.titles[Math.floor(Math.random() * data.titles.length)];
    document.getElementById('metaPanel').style.display = 'block';
    document.getElementById('videoTitle').value = `${randTitle} - 1 Minute Relaxation`;
    document.getElementById('videoDesc').value = `Enjoy pure ${theme} ambience. Natural sounds only. #relax #${theme}`;
    document.getElementById('videoTags').value = data.tags;
}

function copyToClip(id) {
    const copyText = document.getElementById(id);
    copyText.select();
    document.execCommand("copy");
}

// D. Recording (The "Merger")
function startRecording() {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 1. Create Audio Context to Capture Sound
    // We must use a Web Audio Context to mix the stream properly
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioEl);
    const dest = audioCtx.createMediaStreamDestination();
    
    source.connect(dest);
    source.connect(audioCtx.destination); // Let user hear it too

    // 2. Capture Video Stream from Canvas
    const canvasStream = canvas.captureStream(30); // 30 FPS
    
    // 3. Combine Video + Audio Tracks
    const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ];
    const combinedStream = new MediaStream(combinedTracks);

    // 4. Start Recording
    const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9'
    });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `ZenGen-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Reset UI
        recordBtn.innerText = "🔴 Record 1-Min Clip";
        recordBtn.disabled = false;
        clearInterval(drawInterval);
    };

    // Animation Loop (Draw video to canvas)
    const drawInterval = setInterval(() => {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    }, 1000 / 30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;

    // Auto-stop after 60 seconds
    setTimeout(() => {
        mediaRecorder.stop();
    }, 60000); 
}
