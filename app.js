// Configuration
const PIXABAY_KEY = '54284475-952e0862a6663b417341781ba'; 
const PEXELS_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// Metadata Templates
const META_TEMPLATES = {
    forest: {
        titles: ["Mystic Forest Relaxation", "Deep Woods Peace", "Green Nature Escape"],
        tags: "#forest #nature #relaxation #meditation #green #peaceful"
    },
    snow: {
        titles: ["Winter Wonderland Ambience", "Falling Snow Sleep", "Arctic Calm"],
        tags: "#snow #winter #cozy #sleep #white #cold"
    },
    ocean: {
        titles: ["Deep Blue Ocean Waves", "Sea Shore Calm", "Tropical Beach Vibe"],
        tags: "#ocean #waves #beach #summer #water #sleepsounds"
    },
    rain: {
        titles: ["Heavy Rain on Window", "Thunderstorm Sleep", "Rainy Day Mood"],
        tags: "#rain #rainsound #storm #cozy #reading #focus"
    },
    fireplace: {
        titles: ["Cozy Crackling Fire", "Warm Fireplace Jazz", "Winter Cabin Ambience"],
        tags: "#fireplace #fire #cozy #warmth #relaxing #home"
    }
};

const videoEl = document.getElementById('mainVideo');
const audioEl = document.getElementById('bgAudio');
const loadingEl = document.getElementById('loading');
const recordBtn = document.getElementById('recordBtn');

// 1. Content Generation
async function generateContent() {
    const theme = document.getElementById('themeSelect').value;
    loadingEl.style.display = 'block';
    loadingEl.innerText = 'Searching for perfect clips...';
    recordBtn.disabled = true;

    try {
        // A. Fetch Video (Try Pexels first for high quality, fallback to Pixabay)
        let videoUrl = await fetchPexelsVideo(theme);
        if (!videoUrl) videoUrl = await fetchPixabayVideo(theme);

        // B. Fetch Audio (Pixabay Audio)
        let audioUrl = await fetchPixabayAudio(theme);

        if (videoUrl && audioUrl) {
            videoEl.src = videoUrl;
            audioEl.src = audioUrl;
            
            // Wait for both to be ready
            await Promise.all([
                new Promise(r => videoEl.onloadeddata = r),
                new Promise(r => audioEl.onloadeddata = r)
            ]);

            videoEl.play();
            audioEl.play();
            loadingEl.style.display = 'none';
            recordBtn.disabled = false;
            
            generateMetadata(theme);
        } else {
            loadingEl.innerText = 'Could not find media. Try again.';
        }
    } catch (error) {
        console.error(error);
        loadingEl.innerText = 'Error fetching media.';
    }
}

// API Functions
async function fetchPexelsVideo(query) {
    try {
        const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=5&orientation=landscape`, {
            headers: { Authorization: PEXELS_KEY }
        });
        const data = await res.json();
        if (data.videos.length > 0) {
            // Get a random video from the top 5
            const rand = Math.floor(Math.random() * data.videos.length);
            // Return highest quality link
            return data.videos[rand].video_files.find(f => f.quality === 'hd')?.link || data.videos[rand].video_files[0].link;
        }
    } catch (e) { console.log('Pexels error', e); }
    return null;
}

async function fetchPixabayVideo(query) {
    const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${query}&per_page=5`);
    const data = await res.json();
    if (data.hits.length > 0) {
        const rand = Math.floor(Math.random() * data.hits.length);
        return data.hits[rand].videos.large.url;
    }
    return null;
}

async function fetchPixabayAudio(query) {
    // Pixabay doesn't strictly separate audio in the main API, but we can search specifically using category
    // Note: The public Pixabay API endpoint for audio is currently in Beta or limited, 
    // but often 'nature' videos have sound. 
    // *Workaround for consistent Natural Audio:*
    // Since Pixabay Audio API is separate, let's use a reliable logic or default sounds if API fails.
    // For this prototype, we'll try to find a video with sound OR use a specific query.
    // Actually, Pixabay allows &category=nature.
    // To ensure "Natural sounds only", we often need a dedicated audio library.
    // For now, let's assume we pull a video that might have sound, 
    // or we use a fallback array of royalty-free mp3 urls if you have them.
    // *Better approach for automation:*
    // Let's use the Pixabay URL logic if available, otherwise, we might need to manually map sounds 
    // or use a generic "Nature" sound API. 
    // For this code, I will map the theme to a generic royalty-free search or placeholder 
    // to ensure the code works immediately.
    
    // Using a reliable royalty-free source query structure or direct MP3s is safest.
    // Here is a fallback logic using generic Pixabay audio search if you had the Audio endpoint, 
    // but standard Pixabay Video API returns videos.
    // Let's stick to the prompt's API keys.
    
    // *Simulated Audio Fetch (Since Pixabay Audio API is separate from Video API)*
    // We will use a "silent" search to getting the audio from the Pexels/Pixabay video if it exists,
    // OR (Preferred) simply play the video sound if available.
    // BUT the prompt requested "Natural sounds only (no instrumental music)".
    // Many stock videos have no sound. 
    // *Strategy:* I will mute the video (`muted` in HTML) and play a separate audio track.
    // Since I cannot browse Pixabay Audio with the Video API key reliably without the specific Audio endpoint documentation (which changes),
    // I will use a placeholder logic here that you can replace with direct URLs or the correct endpoint if you have it.
    
    // *MOCKING Audio for stability:*
    const audioMap = {
        forest: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
        rain: "https://cdn.pixabay.com/download/audio/2022/02/16/audio_f0e8f22030.mp3",
        ocean: "https://cdn.pixabay.com/download/audio/2022/03/09/audio_c8c8a22a94.mp3",
        fireplace: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_c1e6e5a401.mp3",
        snow: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_82236d3119.mp3" // wind
    };
    return audioMap[query] || audioMap.forest;
}

// 2. Metadata Generator
function generateMetadata(theme) {
    const data = META_TEMPLATES[theme];
    const randTitle = data.titles[Math.floor(Math.random() * data.titles.length)];
    
    document.getElementById('metaPanel').style.display = 'block';
    document.getElementById('videoTitle').value = `${randTitle} - 1 Minute Relaxation`;
    document.getElementById('videoDesc').value = `Enjoy 1 minute of pure ${theme} ambience. No music, just natural sounds. #relax #${theme}`;
    document.getElementById('videoTags').value = data.tags;

    // Update Social Links
    const currentUrl = encodeURIComponent(window.location.href);
    document.getElementById('shareFb').href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
    document.getElementById('shareTw').href = `https://twitter.com/intent/tweet?text=Relax+with+this+${theme}+video&url=${currentUrl}`;
}

function copyToClip(id) {
    const copyText = document.getElementById(id);
    copyText.select();
    document.execCommand("copy");
    alert("Copied!");
}

// 3. Recording Logic (Canvas + AudioStream)
function startRecording() {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Create a stream from the canvas
    const canvasStream = canvas.captureStream(30); // 30 FPS
    
    // Capture Audio Stream
    // Note: To capture cross-origin audio, the server must send correct CORS headers.
    // Pixabay/Pexels usually do. If not, this might be silent.
    let audioStream;
    try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination); // Keep playing through speakers
        audioStream = dest.stream;
    } catch(e) {
        console.log("Audio context error (CORS likely):", e);
    }

    // Combine streams
    const tracks = [...canvasStream.getTracks()];
    if(audioStream) tracks.push(...audioStream.getAudioTracks());
    const combinedStream = new MediaStream(tracks);

    const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9' });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relax-${Date.now()}.webm`;
        a.click();
        recordBtn.innerText = "🔴 Record 1-Min Clip";
        recordBtn.disabled = false;
        clearInterval(drawInterval);
    };

    // Draw video to canvas loop
    const drawInterval = setInterval(() => {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    }, 1000 / 30);

    // Start
    mediaRecorder.start();
    recordBtn.innerText = "Recording... (Wait 60s)";
    recordBtn.disabled = true;

    // Stop after 60 seconds
    setTimeout(() => {
        mediaRecorder.stop();
    }, 60000); // 1 minute
}
