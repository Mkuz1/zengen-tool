// Configuration
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// 1. SAFE AUDIO LIBRARY (Using jsDelivr CDN for reliability)
// These link to the open-source 'Moodist' repository which permits sharing.
const AUDIO_SOURCES = {
    forest: "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/forest.mp3",
    rain: "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/rain.mp3",
    fireplace: "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/campfire.mp3",
    ocean: "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/waves.mp3",
    snow: "https://cdn.jsdelivr.net/gh/remvze/moodist@main/public/sounds/wind.mp3" // Wind sounds like snow storm
};

const META_TEMPLATES = {
    forest: { query: "forest", titles: ["Mystic Forest", "Deep Woods"], tags: "#forest #nature" },
    rain: { query: "rain", titles: ["Rainy Window", "Storm Sleep"], tags: "#rain #sleep" },
    fireplace: { query: "fireplace", titles: ["Cozy Fire", "Winter Cabin"], tags: "#fire #cozy" },
    ocean: { query: "ocean", titles: ["Blue Ocean", "Sea Waves"], tags: "#ocean #waves" },
    snow: { query: "snow", titles: ["Snowy Day", "Arctic Wind"], tags: "#snow #winter" }
};

const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const loadingEl = document.getElementById('loading');
const recordBtn = document.getElementById('recordBtn');

// A. Content Generation
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    loadingEl.style.display = 'block';
    loadingEl.innerText = 'Connecting to global library...';
    recordBtn.disabled = true;

    try {
        // 1. Fetch Video (Pexels)
        let videoUrl = await fetchPexelsVideo(META_TEMPLATES[theme].query);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(META_TEMPLATES[theme].query);

        // 2. Set Audio URL (CDN)
        const audioUrl = AUDIO_SOURCES[theme];

        if (videoUrl) {
            // CRITICAL: Set CrossOrigin BEFORE src to prevent "Tainted Canvas"
            videoEl.crossOrigin = "anonymous";
            audioEl.crossOrigin = "anonymous";
            
            videoEl.src = videoUrl;
            audioEl.src = audioUrl;

            // Wait for both to load
            await Promise.all([
                new Promise((resolve, reject) => {
                    videoEl.onloadeddata = resolve;
                    videoEl.onerror = () => reject("Video failed to load");
                }),
                new Promise((resolve) => {
                    // If audio 404s, we resolve anyway but warn user
                    audioEl.onloadeddata = resolve;
                    audioEl.onerror = () => {
                        console.warn("Audio CDN blocked. Switch to upload.");
                        alert("Could not load online audio. Please use the 'Upload Audio' button below.");
                        resolve(); 
                    };
                })
            ]);

            loadingEl.style.display = 'none';
            videoEl.play();
            audioEl.play().catch(e => console.log("Autoplay blocked until interaction"));
            recordBtn.disabled = false;
            generateMetadata(theme);
        }
    } catch (error) {
        console.error(error);
        loadingEl.innerText = 'Error loading media.';
    }
}

// B. API Fetchers
async function fetchPexelsVideo(query) {
    try {
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=10&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
            const rand = Math.floor(Math.random() * data.videos.length);
            const video = data.videos[rand];
            // Find HD file (1280x720) for best compatibility
            const file = video.video_files.find(f => f.width === 1280) || video.video_files[0];
            return file.link;
        }
    } catch (e) { console.log('Pexels error', e); }
    return null;
}

async function fetchPixabayVideo(query) {
    try {
        const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=10`);
        const data = await res.json();
        if (data.hits.length > 0) {
            const rand = Math.floor(Math.random() * data.hits.length);
            return data.hits[rand].videos.medium.url;
        }
    } catch (e) { console.log('Pixabay error', e); }
    return null;
}

// C. Metadata
function generateMetadata(theme) {
    const data = META_TEMPLATES[theme];
    const randTitle = data.titles[Math.floor(Math.random() * data.titles.length)];
    document.getElementById('metaPanel').style.display = 'block';
    document.getElementById('videoTitle').value = `${randTitle} - 1 Min Relaxation`;
    document.getElementById('videoDesc').value = `Enjoy pure ${theme} ambience. #relax #${theme}`;
    document.getElementById('videoTags').value = data.tags;
}

// D. Recording Logic (With Error Handling)
function startRecording() {
    // Safety Check: Is the canvas clean?
    try {
        const test = document.createElement('canvas');
        test.getContext('2d').drawImage(videoEl, 0, 0);
        test.toDataURL(); // This will throw error if tainted
    } catch (e) {
        alert("Security Error: The video server blocked the download. Please click 'Find Content' again to try a different video.");
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Audio Context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioEl);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioCtx.destination);

    // Combine Streams
    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ]);

    const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9'
    });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => { if(e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ZenGen-${Date.now()}.webm`;
        a.click();
        recordBtn.innerText = "🔴 Record 1-Min Clip";
        recordBtn.disabled = false;
        clearInterval(drawInterval);
    };

    // Draw Loop
    const drawInterval = setInterval(() => {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    }, 1000 / 30);

    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;

    // Stop after 60s
    setTimeout(() => mediaRecorder.stop(), 60000);
}
