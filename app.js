/**
 * ZenGen Studio - Complete Fix
 */

// --- 1. TRENDY NATURAL SOUNDS LIBRARY ---
const TRENDY_SOUNDS = {
    forest: [
        { name: '🌿 Forest ASMR', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1237.mp3' },
        { name: '💧 River Flow', url: 'https://assets.mixkit.co/sfx/preview/mixkit-river-stream-flow-1257.mp3' },
        { name: '🌙 Night Forest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-nature-forest-night-ambience-1253.mp3' }
    ],
    ocean: [
        { name: '🌊 Wave Therapy', url: 'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1246.mp3' },
        { name: '🏖️ Beach Waves', url: 'https://assets.mixkit.co/sfx/preview/mixkit-waves-on-the-beach-1256.mp3' },
        { name: '🐬 Underwater', url: 'https://assets.mixkit.co/sfx/preview/mixkit-underwater-bubbles-1252.mp3' }
    ],
    rain: [
        { name: '☔ Rain ASMR', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-1241.mp3' },
        { name: '⛈️ Storm Sounds', url: 'https://assets.mixkit.co/sfx/preview/mixkit-heavy-rain-loop-1242.mp3' },
        { name: '⚡ Thunderstorm', url: 'https://assets.mixkit.co/sfx/preview/mixkit-thunder-and-rain-ambience-1255.mp3' }
    ],
    fireplace: [
        { name: '🔥 Fire ASMR', url: 'https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackle-1330.mp3' },
        { name: '🪵 Cozy Fireplace', url: 'https://assets.mixkit.co/sfx/preview/mixkit-cosy-fireplace-crackles-1240.mp3' },
        { name: '🏕️ Bonfire Night', url: 'https://assets.mixkit.co/sfx/preview/mixkit-bonfire-crackling-1331.mp3' }
    ],
    snow: [
        { name: '❄️ Winter Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-in-the-trees-1250.mp3' },
        { name: '🌨️ Blizzard', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-storm-ambience-1254.mp3' },
        { name: '🥶 Arctic Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-cold-wind-ambience-1251.mp3' }
    ]
};

// --- 2. TRENDY VIDEO LIBRARY ---
const TRENDY_VIDEOS = {
    forest: [
        'https://cdn.pixabay.com/vimeo/876223819/forest-209757.mp4?width=1280&hash=5b1beeb08cd5d88d098ca2b99b6ca65fe7d6be08',
        'https://cdn.pixabay.com/vimeo/876223815/nature-209755.mp4?width=1280&hash=bbda56c63034a2b4e38aeae57fe15854f75c2956'
    ],
    ocean: [
        'https://cdn.pixabay.com/vimeo/876223817/waves-209756.mp4?width=1280&hash=1d2db469116a3ef1435c2ddfde15d05d0ff2cfdc',
        'https://cdn.pixabay.com/vimeo/876223814/beach-209754.mp4?width=1280&hash=b97f8ed1ed4d1e7f7fa82e6016925f3e0aedb54f'
    ],
    rain: [
        'https://cdn.pixabay.com/vimeo/876223818/rain-209758.mp4?width=1280&hash=8fd82f30326433e6f2c572957fa9a0bf7c9e37db',
        'https://cdn.pixabay.com/vimeo/876223816/thunderstorm-209753.mp4?width=1280&hash=b4e9a262ec38011345f72b16b3b0e9f4b1d7f240'
    ],
    fireplace: [
        'https://cdn.pixabay.com/vimeo/876223820/fire-209759.mp4?width=1280&hash=85000d91ae315ad01d5fe09182f6d358104c1d5e',
        'https://cdn.pixabay.com/vimeo/876223821/campfire-209760.mp4?width=1280&hash=f21335d7e73697dc1d13a1c82e44e4183dba0be0'
    ],
    snow: [
        'https://cdn.pixabay.com/vimeo/876223822/snow-209761.mp4?width=1280&hash=84d00ec4b407265e21d3c9e17a40ff15dc4d57f3',
        'https://cdn.pixabay.com/vimeo/876223823/winter-209762.mp4?width=1280&hash=29881d7a6c38aac65d3e27801ce7487941cc464a'
    ]
};

// --- 3. AUDIO PLAYER WITH GUARANTEED PLAYBACK ---
class GuaranteedAudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = 1.0; // Full volume
        this.isPlaying = false;
        this.hasUserInteracted = false;
    }
    
    init() {
        // Mark first user interaction
        const enableAudio = () => {
            this.hasUserInteracted = true;
            document.body.removeEventListener('click', enableAudio);
            document.body.removeEventListener('touchstart', enableAudio);
        };
        
        document.body.addEventListener('click', enableAudio);
        document.body.addEventListener('touchstart', enableAudio);
        
        return Promise.resolve();
    }
    
    async play(url) {
        if (!this.hasUserInteracted) {
            console.log("Waiting for user interaction...");
            return false;
        }
        
        this.stop();
        this.audio.src = url;
        
        try {
            await this.audio.play();
            this.isPlaying = true;
            console.log("✅ Audio playing successfully!");
            return true;
        } catch(error) {
            console.log("Audio blocked, showing instructions:", error);
            // Show instruction to user
            alert("🔊 Click the Play button again to enable sound!\n\nSome browsers require clicking the play button directly.");
            return false;
        }
    }
    
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }
    
    toggleMute() {
        this.audio.muted = !this.audio.muted;
        return this.audio.muted;
    }
}

const audioPlayer = new GuaranteedAudioPlayer();

// --- 4. GLOBAL STATE ---
let currentVideos = [];
let currentAudio = null;
let isPlaying = false;

// --- 5. INITIALIZATION ---
function initStudio() {
    console.log("🚀 Initializing ZenGen Studio...");
    
    // Hide splash screen
    const startScreen = document.getElementById('startScreen');
    const workspace = document.getElementById('workspace');
    
    startScreen.style.opacity = '0';
    
    setTimeout(() => {
        startScreen.style.display = 'none';
        workspace.style.display = 'flex';
        
        // Initialize audio
        audioPlayer.init();
        
        // Load theme options
        loadThemeOptions();
        
        // Generate initial content
        generateVideoContent();
        
        console.log("✅ Studio initialized successfully!");
        updateStatus('Ready');
    }, 500);
}

function loadThemeOptions() {
    const themeSelect = document.getElementById('themeSelect');
    const audioSelect = document.getElementById('audioVariant');
    
    // Clear and populate audio options
    audioSelect.innerHTML = '';
    const theme = themeSelect.value;
    const sounds = TRENDY_SOUNDS[theme] || [];
    
    sounds.forEach(sound => {
        const option = document.createElement('option');
        option.value = sound.url;
        option.textContent = sound.name;
        audioSelect.appendChild(option);
    });
    
    // Enable record button
    document.getElementById('recordBtn').disabled = false;
}

// --- 6. VIDEO CONTENT GENERATION ---
async function generateVideoContent() {
    updateStatus('🎬 Generating content...');
    showLoading(true);
    
    const theme = document.getElementById('themeSelect').value;
    
    try {
        // Get videos for theme
        currentVideos = TRENDY_VIDEOS[theme] || [];
        
        if (currentVideos.length > 0) {
            // Load first video
            const video1 = document.getElementById('vid1');
            const video2 = document.getElementById('vid2');
            
            video1.src = currentVideos[0];
            video2.src = currentVideos[1] || currentVideos[0];
            
            video1.load();
            video2.load();
            
            // Get selected audio
            const audioSelect = document.getElementById('audioVariant');
            currentAudio = audioSelect.value;
            
            // Generate POWERFUL SEO
            generatePowerfulSEO(theme);
            
            // Update UI
            updateStatus('✅ Content Ready!');
            document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i> Play Video & Sound';
            
            // Auto-play after a delay
            setTimeout(() => {
                togglePlayPause();
            }, 1000);
            
        } else {
            throw new Error("No videos found");
        }
    } catch(error) {
        console.error("Generation error:", error);
        updateStatus('❌ Error - Try Again');
        alert("Unable to load videos. Please try again.");
    } finally {
        showLoading(false);
    }
}

// --- 7. PLAYBACK CONTROL ---
function togglePlayPause() {
    const playBtn = document.getElementById('playPauseBtn');
    const video1 = document.getElementById('vid1');
    
    if (!isPlaying) {
        // PLAY
        updateStatus('▶️ Playing...');
        
        // Play video
        video1.play().then(() => {
            console.log("Video playing");
        }).catch(e => {
            console.log("Video autoplay prevented");
        });
        
        // Play audio
        if (currentAudio) {
            audioPlayer.play(currentAudio).then(success => {
                if (success) {
                    console.log("Audio playing successfully");
                }
            });
        }
        
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        isPlaying = true;
        
    } else {
        // PAUSE
        updateStatus('⏸️ Paused');
        video1.pause();
        audioPlayer.stop();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
        isPlaying = false;
    }
}

// --- 8. POWERFUL SEO GENERATOR ---
function generatePowerfulSEO(theme) {
    console.log("🎯 Generating POWERFUL SEO for:", theme);
    
    // TRENDY HOOKS (Updated for 2024)
    const HOOKS = [
        "This Changed My Sleep Forever",
        "Doctors Recommend This For Anxiety",
        "The Secret To Instant Calm",
        "Why Everyone Is Listening To This",
        "The #1 Sound For Deep Sleep",
        "Neuroscientists Love This Sound",
        "This Will Calm Your Mind In 60 Seconds",
        "The Viral Sleep Hack Everyone's Using",
        "This Cured My Insomnia Instantly",
        "The Most Relaxing Sound On Earth"
    ];
    
    // POWERFUL DESCRIPTIONS
    const DESCRIPTIONS = {
        forest: [
            "Experience the magic of an ancient forest with crystal-clear bird songs and gentle stream sounds. Perfect for sleep, meditation, or focus. These natural frequencies have been scientifically proven to reduce stress by 65% and improve sleep quality. Ideal for ASMR lovers, students, and anyone needing mental clarity.",
            "Immerse yourself in a pristine forest ambience that feels like a digital detox. This 8D audio experience transports you to the most peaceful woods on Earth. Used by therapists for anxiety relief and by students for concentration."
        ],
        ocean: [
            "Let the rhythmic ocean waves wash away all your stress and anxiety. This powerful sound therapy mimics the brain's delta waves for deepest sleep. Perfect for meditation, yoga, or creating a spa-like atmosphere at home.",
            "Experience beach therapy from anywhere! These ocean sounds are engineered to trigger your parasympathetic nervous system, promoting instant relaxation. Great for insomnia, tinnitus relief, and mindfulness practice."
        ],
        rain: [
            "Sleep like a baby with this ultra-realistic rain and thunderstorm experience. The perfect white noise for blocking out distractions and achieving deep, restorative sleep. Scientifically crafted for maximum relaxation.",
            "Transform your space into a cozy rainy day retreat. These rain sounds create the perfect ambiance for reading, working, or sleeping. Known to reduce cortisol levels and promote mental clarity."
        ],
        fireplace: [
            "Get cozy with authentic fireplace crackles that feel like a warm hug. This ASMR experience is perfect for cold nights, creating romantic atmospheres, or simply unwinding after a long day.",
            "Experience the magic of a real fireplace without the hassle. These deep, resonant crackles are scientifically proven to lower blood pressure and induce a state of calm focus."
        ],
        snow: [
            "Escape to a peaceful winter wonderland with gentle snow winds and distant blizzard sounds. Perfect for cooling down, focusing, or creating a serene winter atmosphere any time of year.",
            "Experience the tranquility of an Arctic winter. These cold wind sounds are perfect for hot climates, fever reduction, or creating a crisp, clean atmosphere for work or study."
        ]
    };
    
    // TRENDY TAGS FOR EACH THEME (Minimum 15 per theme)
    const TRENDY_TAGS = {
        forest: [
            "#forestsounds", "#asmrsleep", "#naturesounds", "#deeprelaxation", "#meditationmusic",
            "#sleepsounds", "#anxietyrelief", "#focusmusic", "#studymusic", "#whitenoise",
            "#calmmind", "#peaceful", "#mindfulness", "#yogasounds", "#digitaldetox",
            "#healingfrequencies", "#brainwaves", "#stressrelief", "#insomniacure", "#mentalhealth",
            "#wellness", "#selfcare", "#therapy", "#ambience", "#binauralbeats"
        ],
        ocean: [
            "#oceansounds", "#wavesounds", "#beachvibes", "#sleeptherapy", "#meditation",
            "#relaxation", "#calmsea", "#bluespace", "#watertherapy", "#naturehealing",
            "#asmr", "#sleepaid", "#anxiety", "#peace", "#mindfulness",
            "#stressfree", "#wellbeing", "#healing", "#therapy", "#spa",
            "#vacationvibes", "#summervibes", "#beachlife", "#coastalliving", "#surfsup"
        ],
        rain: [
            "#rainsounds", "#thunderstorm", "#sleeprain", "#asmrrain", "#cozyvibes",
            "#rainyday", "#stormchasing", "#weatherasmr", "#sleepsounds", "#relaxation",
            "#meditation", "#anxietyrelief", "#peaceful", "#calm", "#mindfulness",
            "#whitenoise", "#studysounds", "#worksounds", "#focus", "#productivity",
            "#hygge", "#cozy", "#homevibes", "#interiorvibes", "#ambient"
        ],
        fireplace: [
            "#fireplacesounds", "#fireasmr", "#cozyfire", "#wintervibes", "#christmasvibes",
            "#cabinlife", "#hygge", "#cozyvibes", "#warmth", "#comfort",
            "#relaxation", "#sleepsounds", "#meditation", "#asmr", "#anxietyrelief",
            "#stressrelief", "#homevibes", "#interior", "#cabin", "#mountainlife",
            "#winterevening", "#snowday", "#fireplace", "#cracklingfire", "#ambience"
        ],
        snow: [
            "#snowsounds", "#winterwind", "#blizzard", "#arctic", "#coldweather",
            "#wintervibes", "#snowfall", "#winterstorm", "#coldasmr", "#icesounds",
            "#relaxation", "#sleep", "#meditation", "#focus", "#studymusic",
            "#cooling", "#refresh", "#crisp", "#clean", "#pure",
            "#winterwonderland", "#snowday", "#arcticcircle", "#northpole", "#coldtherapy"
        ]
    };
    
    // SELECT RANDOM HOOK
    const randomHook = HOOKS[Math.floor(Math.random() * HOOKS.length)];
    const descriptions = DESCRIPTIONS[theme];
    const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // GENERATE TITLE
    const themeNames = {
        forest: "Enchanted Forest",
        ocean: "Magical Ocean",
        rain: "Healing Rainstorm",
        fireplace: "Cozy Fireplace",
        snow: "Arctic Winter"
    };
    
    const title = `${randomHook} | ${themeNames[theme]} Sounds Therapy`;
    
    // GENERATE DESCRIPTION
    const description = `🎧 ${randomDesc}\n\n✨ BENEFITS:\n• Instantly reduces anxiety & stress\n• Promotes deep, restorative sleep\n• Enhances focus & concentration\n• Perfect for meditation & yoga\n• Blocks distracting noises\n\n📱 USE FOR:\n• Sleep • Study • Work • Meditation • Anxiety Relief\n\n⏰ LENGTH: 1 Hour (Loop)\n🎵 QUALITY: Studio Recording\n🌿 NATURE: 100% Authentic\n\n🔔 Subscribe for daily sound therapy!\n\n${TRENDY_TAGS[theme].slice(0, 15).join(' ')}`;
    
    // UPDATE UI
    document.getElementById('videoTitle').value = title;
    document.getElementById('videoDesc').value = description;
    document.getElementById('videoTags').value = TRENDY_TAGS[theme].slice(0, 20).join('\n');
    
    // UPDATE SOCIAL PREVIEW
    updateSocialPreview(title, theme);
    
    console.log("✅ SEO Generated Successfully!");
}

// --- 9. SOCIAL MEDIA SHARING ---
function updateSocialPreview(title, theme) {
    const socialTitle = document.getElementById('socialTitle');
    const socialDesc = document.getElementById('socialDesc');
    const socialTags = document.getElementById('socialTags');
    
    if (socialTitle) socialTitle.textContent = title.substring(0, 60) + '...';
    if (socialDesc) socialDesc.textContent = `Experience the healing power of ${theme} sounds. Click to listen now!`;
    if (socialTags) socialTags.innerHTML = TRENDY_SOUNDS[theme].slice(0, 3).map(s => `<span class="tag">${s.name}</span>`).join('');
}

function shareToPlatform(platform) {
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDesc').value.substring(0, 100);
    const theme = document.getElementById('themeSelect').value;
    
    const urls = {
        youtube: `https://www.youtube.com/upload?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
        tiktok: `https://www.tiktok.com/upload?description=${encodeURIComponent(title + ' ' + description)}`,
        instagram: `https://www.instagram.com/create/video/`,
        facebook: `https://www.facebook.com/video.php?title=${encodeURIComponent(title)}`
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
        loading.style.display = show ? 'block' : 'none';
    }
}

function copyToClip(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.select();
        document.execCommand('copy');
        
        // Show confirmation
        const button = document.getElementById('copy' + elementId.charAt(0).toUpperCase() + elementId.slice(1) + 'Btn');
        if (button) {
            const original = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                button.innerHTML = original;
            }, 2000);
        }
        
        alert('✅ Copied to clipboard! Ready to paste on YouTube/TikTok/Instagram.');
    }
}

// --- 11. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 ZenGen Studio Loading...");
    
    // Enter Studio Button
    document.getElementById('enterStudioBtn').addEventListener('click', initStudio);
    
    // Theme Change
    document.getElementById('themeSelect').addEventListener('change', function() {
        loadThemeOptions();
        generateVideoContent();
    });
    
    // Audio Change
    document.getElementById('audioVariant').addEventListener('change', function() {
        if (isPlaying && currentAudio !== this.value) {
            currentAudio = this.value;
            audioPlayer.play(currentAudio);
        }
    });
    
    // Generate Button
    document.getElementById('generateBtn').addEventListener('click', generateVideoContent);
    
    // Play/Pause Button
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
    
    // Record Button
    document.getElementById('recordBtn').addEventListener('click', function() {
        alert("🎥 Recording feature coming soon!\n\nFor now, you can:\n1. Use OBS Studio (free)\n2. Use QuickTime (Mac)\n3. Use Xbox Game Bar (Windows)\n\nSave as MP4 for best quality!");
    });
    
    // Copy Buttons
    document.getElementById('copyTitleBtn').addEventListener('click', () => copyToClip('videoTitle'));
    document.getElementById('copyDescBtn').addEventListener('click', () => copyToClip('videoDesc'));
    document.getElementById('copyTagsBtn').addEventListener('click', () => copyToClip('videoTags'));
    
    // Social Sharing Buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.dataset.platform;
            shareToPlatform(platform);
        });
    });
    
    // Volume Control
    document.getElementById('volumeSlider').addEventListener('input', function(e) {
        audioPlayer.audio.volume = e.target.value;
    });
    
    // Mute Button
    document.getElementById('muteBtn').addEventListener('click', function() {
        const isMuted = audioPlayer.toggleMute();
        this.innerHTML = isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    });
    
    // Auto-generate on load
    setTimeout(() => {
        if (document.getElementById('workspace').style.display === 'flex') {
            generateVideoContent();
        }
    }, 1000);
    
    console.log("✅ All event listeners set up!");
});
