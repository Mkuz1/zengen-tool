/**
 * ZenGen Studio - Working Version
 */

const PEXELS_API_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr';

// --- 1. WORKING VIDEO SOURCES ---
const WORKING_VIDEOS = {
    forest: [
        'https://videos.pexels.com/video-files/3209828/3209828-hd_1920_1080_30fps.mp4',
        'https://videos.pexels.com/video-files/2278095/2278095-hd_1920_1080_25fps.mp4'
    ],
    ocean: [
        'https://videos.pexels.com/video-files/2098988/2098988-hd_1920_1080_30fps.mp4',
        'https://videos.pexels.com/video-files/1448735/1448735-hd_1920_1080_30fps.mp4'
    ],
    rain: [
        'https://videos.pexels.com/video-files/17928341/17928341-hd_1920_1080_30fps.mp4',
        'https://videos.pexels.com/video-files/17928343/17928343-hd_1920_1080_25fps.mp4'
    ],
    fireplace: [
        'https://videos.pexels.com/video-files/1570519/1570519-hd_1920_1080_30fps.mp4',
        'https://videos.pexels.com/video-files/1570521/1570521-hd_1920_1080_30fps.mp4'
    ],
    snow: [
        'https://videos.pexels.com/video-files/16017087/16017087-hd_1920_1080_30fps.mp4',
        'https://videos.pexels.com/video-files/16017088/16017088-hd_1920_1080_25fps.mp4'
    ]
};

// --- 2. WORKING AUDIO SOURCES ---
const WORKING_AUDIO = {
    forest: [
        { name: 'Forest Birds', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { name: 'Forest Stream', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
    ],
    ocean: [
        { name: 'Ocean Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
        { name: 'Beach Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
    ],
    rain: [
        { name: 'Light Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
        { name: 'Heavy Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
    ],
    fireplace: [
        { name: 'Fire Crackle', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
        { name: 'Fireplace', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
    ],
    snow: [
        { name: 'Winter Wind', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
        { name: 'Blizzard', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' }
    ]
};

// --- 3. SIMPLE AUDIO PLAYER ---
class SimpleAudioPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.volume = 0.8;
    }
    
    play(url) {
        this.stop();
        
        this.audio = new Audio(url);
        this.audio.volume = this.volume;
        this.audio.loop = true;
        
        // Enable autoplay by simulating user interaction
        document.body.addEventListener('click', this.startAudio.bind(this, url), { once: true });
        
        // Also try to play immediately
        this.startAudio(url);
    }
    
    startAudio(url) {
        if (!this.audio) {
            this.audio = new Audio(url);
            this.audio.volume = this.volume;
            this.audio.loop = true;
        }
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            console.log("✅ Audio playing successfully!");
            updateStatus('🎵 Audio playing');
        }).catch(e => {
            console.log("Audio blocked, user needs to click Play button");
            showMessage("🔊 Click the PLAY button to enable sound!");
        });
    }
    
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        this.isPlaying = false;
    }
    
    setVolume(level) {
        this.volume = level;
        if (this.audio) {
            this.audio.volume = level;
        }
    }
    
    toggleMute() {
        if (this.audio) {
            this.audio.muted = !this.audio.muted;
            return this.audio.muted;
        }
        return false;
    }
}

const audioPlayer = new SimpleAudioPlayer();

// --- 4. GLOBAL STATE ---
let currentTheme = 'forest';
let currentVideoIndex = 0;
let videosLoaded = false;

// --- 5. INITIALIZATION ---
function initStudio() {
    console.log("🚀 Initializing Studio...");
    
    // Hide splash screen
    document.getElementById('startScreen').style.opacity = '0';
    
    setTimeout(() => {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('workspace').style.display = 'flex';
        
        // Load initial content
        loadThemeOptions();
        generateContent();
        
        updateStatus('✅ Ready');
        console.log("Studio initialized!");
    }, 500);
}

function loadThemeOptions() {
    const theme = document.getElementById('themeSelect').value;
    currentTheme = theme;
    const audioSelect = document.getElementById('audioVariant');
    
    // Clear and populate audio options
    audioSelect.innerHTML = '';
    const sounds = WORKING_AUDIO[theme] || [];
    
    sounds.forEach(sound => {
        const option = document.createElement('option');
        option.value = sound.url;
        option.textContent = sound.name;
        audioSelect.appendChild(option);
    });
    
    // Update active theme card
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.theme === theme) {
            card.classList.add('active');
        }
    });
}

// --- 6. CONTENT GENERATION ---
async function generateContent() {
    updateStatus('🎬 Generating content...');
    showLoading(true);
    
    const theme = document.getElementById('themeSelect').value;
    currentTheme = theme;
    
    try {
        // Get videos for theme
        const videos = WORKING_VIDEOS[theme] || [];
        
        if (videos.length > 0) {
            // Load videos
            await loadVideos(videos);
            
            // Generate SEO
            generatePowerfulSEO(theme);
            
            // Update UI
            updateStatus('✅ Content Ready');
            document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i> PLAY VIDEO & SOUND';
            
            // Auto-play video
            playCurrentVideo();
            
            videosLoaded = true;
            
        } else {
            throw new Error("No videos available");
        }
    } catch(error) {
        console.error("Generation error:", error);
        updateStatus('❌ Error - Try Again');
        showMessage("Unable to load videos. Please try a different theme.");
    } finally {
        showLoading(false);
    }
}

async function loadVideos(videoUrls) {
    return new Promise((resolve) => {
        const video1 = document.getElementById('vid1');
        const video2 = document.getElementById('vid2');
        
        // Set video sources
        video1.src = videoUrls[0];
        video2.src = videoUrls[1] || videoUrls[0];
        
        // Set poster images for preview
        video1.poster = getVideoPoster(currentTheme);
        video2.poster = getVideoPoster(currentTheme);
        
        // Load videos
        video1.load();
        video2.load();
        
        // Update video info
        updateVideoInfo();
        
        resolve();
    });
}

function getVideoPoster(theme) {
    // Fallback poster images
    const posters = {
        forest: 'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg?auto=compress&cs=tinysrgb&w=800',
        ocean: 'https://images.pexels.com/photos/1532771/pexels-photo-1532771.jpeg?auto=compress&cs=tinysrgb&w=800',
        rain: 'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=800',
        fireplace: 'https://images.pexels.com/photos/158471/ibis-bird-red-animals-158471.jpeg?auto=compress&cs=tinysrgb&w=800',
        snow: 'https://images.pexels.com/photos/688660/pexels-photo-688660.jpeg?auto=compress&cs=tinysrgb&w=800'
    };
    return posters[theme] || '';
}

function updateVideoInfo() {
    const themeNames = {
        forest: 'Enchanted Forest Therapy',
        ocean: 'Ocean Wave Meditation',
        rain: 'Rain Sound ASMR',
        fireplace: 'Cozy Fireplace Ambience',
        snow: 'Arctic Winter Sounds'
    };
    
    document.getElementById('currentVideoTitle').textContent = themeNames[currentTheme] || 'Nature Therapy';
    document.getElementById('currentVideoSub').textContent = 'Click PLAY to watch preview';
}

// --- 7. VIDEO PLAYBACK ---
function playCurrentVideo() {
    const video = document.getElementById('vid1');
    const playBtn = document.getElementById('playPauseBtn');
    
    if (video.paused) {
        // PLAY
        video.play().then(() => {
            console.log("Video playing");
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
            updateStatus('▶️ Playing');
            
            // Try to play audio too
            playAudio();
        }).catch(e => {
            console.log("Video autoplay prevented");
            showMessage("Click PLAY button to watch the video");
        });
    } else {
        // PAUSE
        video.pause();
        audioPlayer.stop();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> PLAY';
        updateStatus('⏸️ Paused');
    }
}

function playAudio() {
    const audioUrl = document.getElementById('audioVariant').value;
    if (audioUrl) {
        audioPlayer.play(audioUrl);
    }
}

// --- 8. POWERFUL SEO GENERATOR ---
function generatePowerfulSEO(theme) {
    console.log("🎯 Generating viral SEO for:", theme);
    
    // VIRAL HOOKS 2024
    const HOOKS = [
        "THIS Changed My Sleep FOREVER",
        "Doctors Are Recommending This For Anxiety",
        "The Secret To Instant Calm Nobody Tells You",
        "Why 1M+ People Listen To This Daily",
        "The #1 Sound For Deep Sleep In 2024",
        "Neuroscientists LOVE This Sound Therapy",
        "This Calms Your Mind In 60 Seconds",
        "The Viral Sleep Hack EVERYONE's Using",
        "This CURED My Insomnia Instantly",
        "The Most Relaxing Sound On Earth"
    ];
    
    // TRENDY TAGS (Minimum 15 per theme)
    const TRENDY_TAGS = {
        forest: [
            "#foresttherapy", "#asmrsleep", "#naturesounds2024", "#deeprelaxation", "#meditationmusic",
            "#sleepsounds", "#anxietyrelief", "#focusmusic", "#studymusic", "#whitenoise",
            "#calmmind", "#peaceful", "#mindfulness", "#yogasounds", "#healingfrequencies",
            "#brainwaves", "#stressrelief", "#insomniacure", "#mentalhealth", "#wellness",
            "#selfcare", "#therapy", "#ambience", "#binauralbeats", "#viralsounds"
        ],
        ocean: [
            "#oceantherapy", "#wavesounds", "#beachvibes2024", "#sleeptherapy", "#meditation",
            "#relaxation", "#calmsea", "#bluespace", "#watertherapy", "#naturehealing",
            "#asmr", "#sleepaid", "#anxiety", "#peace", "#mindfulness",
            "#stressfree", "#wellbeing", "#healing", "#therapy", "#spa",
            "#vacationvibes", "#summervibes", "#beachlife", "#coastalliving", "#viralaudio"
        ],
        rain: [
            "#raintherapy", "#thunderstorm", "#sleeprain", "#asmrrain", "#cozyvibes2024",
            "#rainyday", "#stormchasing", "#weatherasmr", "#sleepsounds", "#relaxation",
            "#meditation", "#anxietyrelief", "#peaceful", "#calm", "#mindfulness",
            "#whitenoise", "#studysounds", "#worksounds", "#focus", "#productivity",
            "#hygge", "#cozy", "#homevibes", "#interiorvibes", "#viralvideos"
        ],
        fireplace: [
            "#fireplacetherapy", "#fireasmr", "#cozyfire", "#wintervibes2024", "#christmasvibes",
            "#cabinlife", "#hygge", "#cozyvibes", "#warmth", "#comfort",
            "#relaxation", "#sleepsounds", "#meditation", "#asmr", "#anxietyrelief",
            "#stressrelief", "#homevibes", "#interior", "#cabin", "#mountainlife",
            "#winterevening", "#snowday", "#fireplace", "#cracklingfire", "#trending"
        ],
        snow: [
            "#snowtherapy", "#winterwind", "#blizzard", "#arctic", "#coldweather",
            "#wintervibes2024", "#snowfall", "#winterstorm", "#coldasmr", "#icesounds",
            "#relaxation", "#sleep", "#meditation", "#focus", "#studymusic",
            "#cooling", "#refresh", "#crisp", "#clean", "#pure",
            "#winterwonderland", "#snowday", "#arcticcircle", "#northpole", "#viralcontent"
        ]
    };
    
    // POWERFUL DESCRIPTIONS
    const themeTitles = {
        forest: "FOREST THERAPY: The Ultimate Sound Healing Experience",
        ocean: "OCEAN WAVE THERAPY: Transform Your Sleep & Reduce Anxiety",
        rain: "RAIN SOUND THERAPY: The Secret To Instant Relaxation",
        fireplace: "FIREPLACE THERAPY: Cozy Ambience For Stress Relief",
        snow: "ARCTIC THERAPY: Cold Weather Sounds For Mental Clarity"
    };
    
    const benefits = {
        forest: "• Instantly reduces cortisol levels by 65%\n• Promotes deep REM sleep\n• Enhances focus & productivity\n• Natural anxiety relief\n• Perfect for meditation & yoga",
        ocean: "• Mimics brain's delta waves for deepest sleep\n• Reduces blood pressure & heart rate\n• Creates spa-like atmosphere anywhere\n• Excellent for tinnitus relief\n• Promotes mindfulness & presence",
        rain: "• Blocks distracting noises completely\n• Creates perfect white noise environment\n• Reduces stress & anxiety instantly\n• Ideal for studying & working\n• Promotes cozy, hygge atmosphere",
        fireplace: "• Triggers feelings of safety & comfort\n• Lowers blood pressure naturally\n• Creates romantic, cozy ambiance\n• Perfect for cold nights & winter\n• Reduces loneliness & isolation",
        snow: "• Cools down body & mind\n• Promotes mental clarity & focus\n• Creates crisp, clean atmosphere\n• Perfect for hot climates\n• Reduces fever & inflammation"
    };
    
    // GENERATE CONTENT
    const randomHook = HOOKS[Math.floor(Math.random() * HOOKS.length)];
    const title = `${randomHook} | ${themeTitles[theme]}`;
    
    const description = `🎧 ${themeTitles[theme]}\n\n✨ SCIENTIFIC BENEFITS:\n${benefits[theme]}\n\n📱 PERFECT FOR:\n• Sleep • Study • Work • Meditation • Anxiety Relief • Yoga • Focus • Relaxation\n\n⏰ LENGTH: 1 Hour (Loopable)\n🎵 QUALITY: Studio Recording\n🌿 100% Natural Sounds\n💰 ROYALTY FREE: Use anywhere\n\n🔔 TURN ON NOTIFICATIONS for daily sound therapy!\n\n📈 Hashtags for maximum reach:\n${TRENDY_TAGS[theme].slice(0, 20).join(' ')}\n\n💬 Comment below what you use these sounds for!`;
    
    // UPDATE UI
    document.getElementById('videoTitle').value = title;
    document.getElementById('videoDesc').value = description;
    document.getElementById('videoTags').value = TRENDY_TAGS[theme].slice(0, 25).join('\n');
    
    // UPDATE SOCIAL PREVIEW
    updateSocialPreview(title, theme);
    
    console.log("✅ Viral SEO Generated!");
}

function updateSocialPreview(title, theme) {
    const socialTitle = document.getElementById('socialTitle');
    const socialDesc = document.getElementById('socialDesc');
    const socialTags = document.getElementById('socialTags');
    
    if (socialTitle) socialTitle.textContent = title.substring(0, 70) + (title.length > 70 ? '...' : '');
    if (socialDesc) socialDesc.textContent = `Experience the healing power of ${theme} sounds. Scientifically proven to reduce stress & improve sleep!`;
    if (socialTags) {
        const tags = ["#viral", "#trending", "#therapy", "#2024", "#healing"];
        socialTags.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    }
}

// --- 9. SOCIAL SHARING ---
function shareToPlatform(platform) {
    const title = encodeURIComponent(document.getElementById('videoTitle').value);
    const description = encodeURIComponent(document.getElementById('videoDesc').value.substring(0, 200));
    
    const urls = {
        youtube: `https://www.youtube.com/upload?title=${title}&description=${description}`,
        tiktok: `https://www.tiktok.com/upload`,
        instagram: `https://www.instagram.com/create/select/`,
        facebook: `https://www.facebook.com/sharer/sharer.php?quote=${title}`
    };
    
    window.open(urls[platform], '_blank');
}

// --- 10. UTILITY FUNCTIONS ---
function updateStatus(message) {
    const statusPill = document.getElementById('statusPill');
    if (statusPill) {
        statusPill.innerHTML = `<div class="dot"></div> ${message}`;
    }
}

function showLoading(show) {
    const loading = document.getElementById('loadingSpinner');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(text) {
    alert(`💡 ${text}`);
}

function copyToClip(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.select();
        document.execCommand('copy');
        
        // Show confirmation
        const buttonId = 'copy' + elementId.charAt(0).toUpperCase() + elementId.slice(1) + 'Btn';
        const button = document.getElementById(buttonId);
        if (button) {
            const original = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                button.innerHTML = original;
            }, 2000);
        }
        
        showMessage('Copied to clipboard! Ready to paste on social media.');
    }
}

// --- 11. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 Setting up ZenGen Studio...");
    
    // Enter Studio
    document.getElementById('enterStudioBtn').addEventListener('click', initStudio);
    
    // Theme Change
    document.getElementById('themeSelect').addEventListener('change', function() {
        loadThemeOptions();
        generateContent();
    });
    
    // Theme Cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', function() {
            const theme = this.dataset.theme;
            document.getElementById('themeSelect').value = theme;
            loadThemeOptions();
            generateContent();
        });
    });
    
    // Generate Button
    document.getElementById('generateBtn').addEventListener('click', generateContent);
    
    // Play/Pause Button
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (!videosLoaded) {
            generateContent();
            return;
        }
        playCurrentVideo();
    });
    
    // Audio Selection
    document.getElementById('audioVariant').addEventListener('change', function() {
        if (audioPlayer.isPlaying) {
            playAudio();
        }
    });
    
    // Record Button
    document.getElementById('recordBtn').addEventListener('click', function() {
        if (!videosLoaded) {
            showMessage("Please generate content first!");
            return;
        }
        
        const video = document.getElementById('vid1');
        const link = document.createElement('a');
        link.href = video.src;
        link.download = `zengen-${currentTheme}-therapy.mp4`;
        link.click();
        
        showMessage("Video download started! Save it and upload to any platform.");
    });
    
    // Copy Buttons
    document.getElementById('copyTitleBtn').addEventListener('click', () => copyToClip('videoTitle'));
    document.getElementById('copyDescBtn').addEventListener('click', () => copyToClip('videoDesc'));
    document.getElementById('copyTagsBtn').addEventListener('click', () => copyToClip('videoTags'));
    
    // Social Buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.dataset.platform;
            shareToPlatform(platform);
        });
    });
    
    // Volume Control
    document.getElementById('volumeSlider').addEventListener('input', function(e) {
        audioPlayer.setVolume(parseFloat(e.target.value));
    });
    
    // Mute Button
    document.getElementById('muteBtn').addEventListener('click', function() {
        const isMuted = audioPlayer.toggleMute();
        this.innerHTML = isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    });
    
    console.log("✅ Event listeners ready!");
});
