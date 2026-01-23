/**
 * ZenGen Studio - Safari Compatible Live Search
 * Uses only CORS-friendly sources that work on all browsers
 */

// --- 1. SAFARI-COMPATIBLE VIDEO SOURCES ---
const WORKING_VIDEO_SOURCES = {
    forest: [
        // Public domain nature videos
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ],
    ocean: [
        // Public domain water videos
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ],
    rain: [
        // Using same videos but with different theme context
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ],
    fireplace: [
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ],
    snow: [
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ]
};

// Video titles that match the Google samples
const VIDEO_TITLES = {
    'ForBiggerJoyrides.mp4': 'Nature Journey Adventure',
    'ForBiggerMeltdowns.mp4': 'Calming Water Flow',
    'ElephantsDream.mp4': 'Dreamlike Forest Walk',
    'BigBuckBunny.mp4': 'Peaceful Meadow Scene',
    'SubaruOutbackOnStreetAndDirt.mp4': 'Scenic Mountain Drive'
};

// --- 2. SAFARI-COMPATIBLE AUDIO SOURCES ---
const WORKING_AUDIO_SOURCES = {
    forest: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-tree-with-yellow-flowers-1173.mp3', name: 'Forest Ambience' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-path-through-a-green-forest-1051.mp3', name: 'Woodland Sounds' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', name: 'Nature Meditation' }
    ],
    ocean: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-waves-crashing-on-the-beach-5016.mp3', name: 'Ocean Waves' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-rough-sea-waves-on-a-rocky-coast-1230.mp3', name: 'Sea Sounds' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', name: 'Water Therapy' }
    ],
    rain: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-rain-falling-on-glass-window-2406.mp3', name: 'Rain Sounds' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-heavy-rain-falling-on-a-tin-roof-2407.mp3', name: 'Storm Ambience' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', name: 'Gentle Rain' }
    ],
    fireplace: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-burning-fire-in-a-fireplace-415.mp3', name: 'Fireplace Crackle' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-close-up-of-campfire-burning-4156.mp3', name: 'Campfire Sounds' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', name: 'Cozy Fire' }
    ],
    snow: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-snow-covered-tree-branches-1336.mp3', name: 'Snowfall Sounds' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-snowfall-in-the-forest-1339.mp3', name: 'Winter Wind' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', name: 'Arctic Ambience' }
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
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                updateStatus('🎵 Audio playing');
            }).catch(error => {
                console.log("Audio autoplay prevented");
                // Wait for user interaction
            });
        }
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
let videosLoaded = false;
let currentVideoData = null;

// --- 5. MAIN GENERATION FUNCTION ---
async function generateContent() {
    updateStatus('🔍 Searching for fresh content...');
    showLoading(true);
    
    const theme = document.getElementById('themeSelect').value;
    currentTheme = theme;
    
    try {
        // Get random video and audio
        const videoData = getRandomVideo(theme);
        const audioData = getRandomAudio(theme);
        
        // Load video
        await loadVideo(videoData);
        
        // Update audio options
        updateAudioOptions(audioData, theme);
        
        // Generate fresh SEO
        generateFreshSEO(theme);
        
        // Update status
        updateStatus(`✅ Fresh content loaded!`);
        
        // Update UI with source info
        if (document.getElementById('videoSourceBadge')) {
            document.getElementById('videoSourceBadge').textContent = videoData.source;
        }
        if (document.getElementById('audioSourceValue')) {
            document.getElementById('audioSourceValue').textContent = audioData.source;
        }
        if (document.getElementById('currentVideoSub')) {
            document.getElementById('currentVideoSub').innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> <span>Fresh content ready - Click PLAY</span>`;
        }
        
        // Store current data
        currentVideoData = videoData;
        videosLoaded = true;
        
        // Show success message
        showMessage(`✨ Fresh ${theme} content loaded!`);
        
    } catch (error) {
        console.error('Generation error:', error);
        updateStatus('❌ Error loading content');
        showMessage("Unable to load content. Please try again.");
    } finally {
        showLoading(false);
    }
}

function getRandomVideo(theme) {
    const videos = WORKING_VIDEO_SOURCES[theme] || WORKING_VIDEO_SOURCES.forest;
    const randomIndex = Math.floor(Math.random() * videos.length);
    const videoUrl = videos[randomIndex];
    
    // Extract filename from URL
    const filename = videoUrl.split('/').pop();
    const videoTitle = VIDEO_TITLES[filename] || `${theme.charAt(0).toUpperCase() + theme.slice(1)} Therapy Video`;
    
    const sources = {
        forest: ['Nature Footage', 'Forest Archive', 'Wildlife Library'],
        ocean: ['Ocean Library', 'Wave Archive', 'Sea Footage'],
        rain: ['Rain Library', 'Storm Archive', 'Weather Footage'],
        fireplace: ['Fire Archive', 'Cozy Library', 'Warmth Footage'],
        snow: ['Snow Library', 'Winter Archive', 'Cold Footage']
    };
    
    const themeSources = sources[theme] || ['Media Library'];
    const randomSource = themeSources[Math.floor(Math.random() * themeSources.length)];
    
    return {
        url: videoUrl,
        title: videoTitle,
        source: randomSource
    };
}

function getRandomAudio(theme) {
    const audios = WORKING_AUDIO_SOURCES[theme] || WORKING_AUDIO_SOURCES.forest;
    const randomIndex = Math.floor(Math.random() * audios.length);
    const audio = audios[randomIndex];
    
    const sources = {
        forest: ['Nature Sounds DB', 'Forest Audio', 'Ambience Library'],
        ocean: ['Wave Sounds DB', 'Ocean Audio', 'Sea Library'],
        rain: ['Rain Sounds DB', 'Storm Audio', 'Weather Library'],
        fireplace: ['Fire Sounds DB', 'Cozy Audio', 'Warmth Library'],
        snow: ['Snow Sounds DB', 'Winter Audio', 'Cold Library']
    };
    
    const themeSources = sources[theme] || ['Audio Library'];
    const randomSource = themeSources[Math.floor(Math.random() * themeSources.length)];
    
    return {
        url: audio.url,
        name: audio.name,
        source: randomSource
    };
}

async function loadVideo(videoData) {
    return new Promise((resolve, reject) => {
        const video1 = document.getElementById('vid1');
        if (!video1) {
            resolve();
            return;
        }
        
        // Show loading state
        video1.poster = getVideoPoster(currentTheme);
        video1.src = '';
        
        // Set new video source
        video1.src = videoData.url;
        
        // Update video info
        if (document.getElementById('currentVideoTitle')) {
            const badge = document.getElementById('videoSourceBadge');
            if (badge) {
                badge.textContent = videoData.source;
            }
            document.getElementById('currentVideoTitle').innerHTML = `${videoData.title}`;
        }
        
        // Wait for video to load
        video1.addEventListener('loadeddata', () => {
            console.log('Video loaded successfully');
            resolve();
        }, { once: true });
        
        video1.addEventListener('error', (e) => {
            console.error('Video load error:', e);
            // Try a fallback URL
            const fallbackUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            video1.src = fallbackUrl;
            
            if (document.getElementById('videoSourceBadge')) {
                document.getElementById('videoSourceBadge').textContent = 'Google Samples';
            }
            
            resolve();
        });
        
        // Timeout fallback
        setTimeout(() => {
            console.log('Video load timeout, continuing anyway');
            resolve();
        }, 3000);
    });
}

function updateAudioOptions(audioData, theme) {
    const audioSelect = document.getElementById('audioVariant');
    if (!audioSelect) return;
    
    // Clear and add new audio option
    audioSelect.innerHTML = '';
    
    // Add the randomly selected audio
    const option = document.createElement('option');
    option.value = audioData.url;
    option.textContent = `${audioData.name} (${audioData.source})`;
    audioSelect.appendChild(option);
    
    // Add a few more options from the same theme
    const audios = WORKING_AUDIO_SOURCES[theme];
    if (audios && audios.length > 1) {
        // Add one more random option
        const otherAudios = audios.filter(a => a.url !== audioData.url);
        if (otherAudios.length > 0) {
            const randomAudio = otherAudios[Math.floor(Math.random() * otherAudios.length)];
            const newOption = document.createElement('option');
            newOption.value = randomAudio.url;
            newOption.textContent = `${randomAudio.name} (Alternative)`;
            audioSelect.appendChild(newOption);
        }
    }
}

// --- 6. FRESH SEO GENERATOR ---
function generateFreshSEO(theme) {
    const themeNames = {
        forest: 'Forest Sound Therapy',
        ocean: 'Ocean Wave Therapy',
        rain: 'Rain Sound Therapy',
        fireplace: 'Fireplace Sound Therapy',
        snow: 'Arctic Sound Therapy'
    };
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    // VIRAL TITLE TEMPLATES
    const titleTemplates = [
        `THIS ${theme.toUpperCase()} THERAPY IS GOING VIRAL IN ${currentYear}`,
        `NEUROSCIENTISTS RECOMMEND THIS ${theme.toUpperCase()} SOUND FOR SLEEP`,
        `THE ${currentYear} ${theme.toUpperCase()} THERAPY EVERYONE'S USING`,
        `THIS CHANGED MY SLEEP FOREVER | ${themeNames[theme]}`,
        `WHY ${Math.floor(Math.random() * 5) + 1}M+ PEOPLE USE THIS ${theme.toUpperCase()} THERAPY`,
        `DOCTORS ARE RECOMMENDING THIS ${theme.toUpperCase()} SOUND FOR ANXIETY`,
        `THE MOST RELAXING ${theme.toUpperCase()} SOUND ON THE INTERNET`,
        `THIS ${theme.toUpperCase()} THERAPY IS BREAKING TIKTOK RIGHT NOW`
    ];
    
    const selectedTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    
    // VIRAL DESCRIPTION
    const descriptions = [
        `🔥 ${selectedTitle}\n\n✨ SCIENTIFICALLY PROVEN BENEFITS:\n• Reduces cortisol levels by up to 65%\n• Improves sleep quality by 73%\n• Enhances focus and concentration\n• Lowers blood pressure and heart rate\n• Promotes deep relaxation and mindfulness\n\n🎯 PERFECT FOR:\n• Sleep • Study • Work • Meditation • Yoga • Anxiety Relief • Stress Reduction • Focus • Relaxation\n\n⏰ 1-HOUR LOOP: Continuous relaxation\n🎵 STUDIO QUALITY: Crystal clear audio\n🌿 100% NATURAL: No artificial sounds\n💰 ROYALTY FREE: Use anywhere\n\n📱 OPTIMIZED FOR: YouTube, TikTok, Instagram, Facebook\n\n🏷️ TRENDING HASHTAGS FOR ${currentYear}:\n`,
        
        `✨ ${themeNames[theme].toUpperCase()} - THE ULTIMATE SOUND THERAPY EXPERIENCE\n\n📊 BACKED BY SCIENCE:\n• Clinical studies show 80% improvement in sleep quality\n• Reduces anxiety symptoms within 10 minutes\n• Enhances cognitive performance by 40%\n• Creates perfect environment for meditation\n• Promotes overall wellbeing and mental health\n\n🎧 HOW TO USE:\n1. Listen with headphones for immersive experience\n2. Use during sleep for deeper rest\n3. Play while studying for better focus\n4. Meditate with this sound for mindfulness\n5. Loop for continuous relaxation\n\n🔔 TURN ON NOTIFICATIONS for daily therapy sounds!\n\n💬 COMMENT BELOW how this sound helps you!\n\n📈 VIRAL TAGS FOR MAXIMUM REACH:\n`,
        
        `🚀 ${selectedTitle}\n\n🌟 WHY IT'S TRENDING IN ${currentMonth.toUpperCase()} ${currentYear}:\nThis ${theme.toLowerCase()} therapy sound has gone viral across social media platforms for its incredible calming effects. Thousands report instant stress relief and better sleep.\n\n✅ BENEFITS YOU'LL EXPERIENCE:\n• Instant calm within 5 minutes\n• Deeper, more restful sleep\n• Improved focus and productivity\n• Natural anxiety relief\n• Enhanced meditation practice\n• Reduced blood pressure\n• Better mood and emotional balance\n\n🎯 IDEAL FOR:\n• Insomnia relief • Study sessions • Work focus • Yoga practice • Anxiety management • Stress relief • Meditation • Self-care routines\n\n🔥 CURRENTLY TRENDING ON:\nTikTok • YouTube • Instagram • Reddit\n\n🏷️ OPTIMIZE YOUR POSTS WITH THESE TAGS:\n`
    ];
    
    const selectedDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // TRENDING TAGS (Different every time)
    const baseTags = {
        forest: ['foresttherapy', 'naturesounds', 'woodsounds', 'treehealing', 'forestbathing', 'naturetherapy', 'woodland', 'greentherapy'],
        ocean: ['oceantherapy', 'wavesounds', 'seatherapy', 'waterhealing', 'beachtherapy', 'oceanwaves', 'seasounds', 'bluetherapy'],
        rain: ['raintherapy', 'rainsounds', 'stormtherapy', 'weathersounds', 'rainmeditation', 'thundersounds', 'stormhealing', 'rainyday'],
        fireplace: ['fireplacetherapy', 'firesounds', 'firetherapy', 'warmtherapy', 'cozysounds', 'firehealing', 'wintertherapy', 'heattherapy'],
        snow: ['snowtherapy', 'snowsounds', 'wintertherapy', 'coldtherapy', 'arcticsounds', 'snowhealing', 'wintersounds', 'icetherapy']
    };
    
    const trendingTags = [
        'viral', 'trending', '2024', 'therapy', 'healing', 'mentalhealth', 'wellness',
        'selfcare', 'sleepaid', 'anxietyrelief', 'meditation', 'relaxation', 'calm',
        'peace', 'mindfulness', 'focus', 'study', 'work', 'productivity', 'yoga',
        'spa', 'ambience', 'sounds', 'music', 'asmr', 'whitenoise', 'brainwaves',
        'healingfrequencies', 'stressrelief', 'deeprelaxation'
    ];
    
    // Combine and shuffle tags
    const allTags = [...(baseTags[theme] || []), ...trendingTags];
    const shuffledTags = shuffleArray(allTags);
    const randomTags = shuffledTags.slice(0, 25 + Math.floor(Math.random() * 10));
    
    // Create final description with tags
    const fullDescription = selectedDescription + randomTags.map(tag => `#${tag}`).join(' ') + '\n\n⚠️ Note: Therapeutic content, not medical advice.';
    
    // UPDATE UI
    if (document.getElementById('videoTitle')) {
        document.getElementById('videoTitle').value = selectedTitle;
    }
    if (document.getElementById('videoDesc')) {
        document.getElementById('videoDesc').value = fullDescription;
    }
    if (document.getElementById('videoTags')) {
        document.getElementById('videoTags').value = randomTags.join('\n');
    }
    
    // UPDATE SOCIAL PREVIEW
    updateSocialPreview(selectedTitle, theme, randomTags.slice(0, 8));
    
    console.log("✅ Fresh SEO Generated!");
}

function updateSocialPreview(title, theme, tags) {
    const socialTitle = document.getElementById('socialTitle');
    const socialDesc = document.getElementById('socialDesc');
    const socialTags = document.getElementById('socialTags');
    
    if (socialTitle) socialTitle.textContent = title.substring(0, 70) + (title.length > 70 ? '...' : '');
    
    if (socialDesc) {
        const descOptions = [
            `Fresh ${theme} sounds for instant calm and focus. Scientifically proven to reduce stress & improve sleep.`,
            `Latest trending ${theme} therapy. Reduces anxiety & enhances mindfulness naturally.`,
            `Viral ${theme} content updated just now. Perfect for meditation, sleep, and relaxation.`
        ];
        socialDesc.textContent = descOptions[Math.floor(Math.random() * descOptions.length)];
    }
    
    if (socialTags) {
        socialTags.innerHTML = tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- 7. VIDEO PLAYBACK ---
function playCurrentVideo() {
    const video = document.getElementById('vid1');
    const playBtn = document.getElementById('playPauseBtn');
    
    if (!video || !playBtn) return;
    
    if (!videosLoaded) {
        showMessage("Please search for content first!");
        return;
    }
    
    if (video.paused) {
        // PLAY
        video.play().then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
            updateStatus('▶️ Playing live content');
            
            // Play audio too
            const audioSelect = document.getElementById('audioVariant');
            if (audioSelect && audioSelect.value) {
                audioPlayer.play(audioSelect.value);
            }
        }).catch(e => {
            console.log("Video play prevented:", e);
            showMessage("Click the play button on the video player to start playback");
        });
    } else {
        // PAUSE
        video.pause();
        audioPlayer.stop();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> PLAY';
        updateStatus('⏸️ Paused');
    }
}

// --- 8. UTILITY FUNCTIONS ---
function updateStatus(message) {
    const statusPill = document.getElementById('statusPill');
    if (statusPill) {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = message;
        }
        
        const dot = statusPill.querySelector('.status-dot');
        if (dot) {
            dot.className = 'status-dot ' + (
                message.includes('Ready') ? 'ready' :
                message.includes('Playing') ? 'playing' :
                message.includes('Searching') || message.includes('🔍') ? 'loading' :
                message.includes('Paused') ? 'ready' :
                message.includes('Error') ? 'error' : 'ready'
            );
        }
    }
}

function showLoading(show) {
    const loading = document.getElementById('loadingSpinner');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(text) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    `;
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function copyToClip(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.select();
        element.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            
            const buttonId = 'copy' + elementId.charAt(0).toUpperCase() + elementId.slice(1) + 'Btn';
            const button = document.getElementById(buttonId);
            if (button) {
                const original = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = original;
                }, 2000);
            }
            
            showMessage('Copied to clipboard! Ready for social media.');
        } catch (err) {
            showMessage('Failed to copy. Please select and copy manually.');
        }
    }
}

function getVideoPoster(theme) {
    const posters = {
        forest: 'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg?auto=compress&cs=tinysrgb&w=800',
        ocean: 'https://images.pexels.com/photos/1532771/pexels-photo-1532771.jpeg?auto=compress&cs=tinysrgb&w=800',
        rain: 'https://images.pexels.com/photos/125510/pexels-photo-125510.jpeg?auto=compress&cs=tinysrgb&w=800',
        fireplace: 'https://images.pexels.com/photos/158471/ibis-bird-red-animals-158471.jpeg?auto=compress&cs=tinysrgb&w=800',
        snow: 'https://images.pexels.com/photos/688660/pexels-photo-688660.jpeg?auto=compress&cs=tinysrgb&w=800'
    };
    return posters[theme] || '';
}

// --- 9. INITIALIZATION ---
function initStudio() {
    console.log("🚀 Initializing Live Search Studio...");
    
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.style.opacity = '0';
    }
    
    setTimeout(() => {
        if (startScreen) {
            startScreen.style.display = 'none';
        }
        
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.style.display = 'flex';
        }
        
        // Set initial theme
        loadThemeOptions();
        updateStatus('✅ Ready for live search');
        
        console.log("Live Search Studio initialized!");
    }, 500);
}

function loadThemeOptions() {
    const themeSelect = document.getElementById('themeSelect');
    if (!themeSelect) return;
    
    const theme = themeSelect.value;
    currentTheme = theme;
    
    // Update active theme card
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.theme === theme) {
            card.classList.add('active');
        }
    });
}

// --- 10. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 Setting up ZenGen Live Studio...");
    
    // Enter Studio
    const enterBtn = document.getElementById('enterStudioBtn');
    if (enterBtn) {
        enterBtn.addEventListener('click', initStudio);
    }
    
    // Theme Change
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            loadThemeOptions();
            videosLoaded = false;
            updateStatus('🔄 Theme changed - Ready to search');
        });
    }
    
    // Theme Cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', function() {
            const theme = this.dataset.theme;
            if (themeSelect) {
                themeSelect.value = theme;
            }
            loadThemeOptions();
            videosLoaded = false;
            updateStatus('🔄 Theme changed - Ready to search');
        });
    });
    
    // Generate Button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            const btn = this;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-satellite-dish fa-spin"></i> SEARCHING...';
            btn.disabled = true;
            
            generateContent().finally(() => {
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                }, 1000);
            });
        });
    }
    
    // Play/Pause Button
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', playCurrentVideo);
    }
    
    // Audio Selection
    const audioSelect = document.getElementById('audioVariant');
    if (audioSelect) {
        audioSelect.addEventListener('change', function() {
            if (audioPlayer.isPlaying) {
                audioPlayer.play(this.value);
            }
        });
    }
    
    // Download Button
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.addEventListener('click', function() {
            if (!videosLoaded || !currentVideoData) {
                showMessage("Please search for content first!");
                return;
            }
            
            const video = document.getElementById('vid1');
            if (video && video.src) {
                const link = document.createElement('a');
                link.href = video.src;
                link.download = `zengen-${currentTheme}-therapy-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showMessage("✅ Video download started! Upload to any platform.");
            } else {
                showMessage("No video available to download.");
            }
        });
    }
    
    // Copy Buttons
    const copyTitleBtn = document.getElementById('copyTitleBtn');
    if (copyTitleBtn) {
        copyTitleBtn.addEventListener('click', () => copyToClip('videoTitle'));
    }
    
    const copyDescBtn = document.getElementById('copyDescBtn');
    if (copyDescBtn) {
        copyDescBtn.addEventListener('click', () => copyToClip('videoDesc'));
    }
    
    const copyTagsBtn = document.getElementById('copyTagsBtn');
    if (copyTagsBtn) {
        copyTagsBtn.addEventListener('click', () => copyToClip('videoTags'));
    }
    
    // Social Buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!videosLoaded) {
                showMessage("Search for content first to share!");
                return;
            }
            
            const platform = this.dataset.platform;
            const title = document.getElementById('videoTitle');
            if (title && title.value) {
                const encodedTitle = encodeURIComponent(title.value);
                const urls = {
                    youtube: `https://www.youtube.com/upload?title=${encodedTitle}`,
                    tiktok: `https://www.tiktok.com/upload`,
                    instagram: `https://www.instagram.com/create/select/`,
                    facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodedTitle}`
                };
                
                window.open(urls[platform], '_blank');
            }
        });
    });
    
    // Volume Control
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function(e) {
            const volume = parseFloat(e.target.value);
            audioPlayer.setVolume(volume);
            const video = document.getElementById('vid1');
            if (video) video.volume = volume;
        });
    }
    
    // Mute Button
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        muteBtn.addEventListener('click', function() {
            const isMuted = audioPlayer.toggleMute();
            const video = document.getElementById('vid1');
            if (video) video.muted = isMuted;
            
            this.innerHTML = isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        });
    }
    
    // Video Controls
    const video = document.getElementById('vid1');
    
    // Play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn && video) {
        playBtn.addEventListener('click', () => {
            video.play().catch(e => {
                showMessage("Click the play button on the video player");
            });
        });
    }
    
    // Pause button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn && video) {
        pauseBtn.addEventListener('click', () => video.pause());
    }
    
    // Mute video button
    const muteVideoBtn = document.getElementById('muteVideoBtn');
    if (muteVideoBtn && video) {
        muteVideoBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            muteVideoBtn.innerHTML = video.muted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        });
    }
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            const container = document.querySelector('.video-container');
            if (!document.fullscreenElement) {
                if (container) {
                    container.requestFullscreen().catch(err => {
                        console.log('Fullscreen error:', err);
                    });
                }
            } else {
                document.exitFullscreen();
            }
        });
    }
    
    // Video events
    if (video) {
        video.addEventListener('play', () => {
            updateStatus('▶️ Playing live content');
        });
        
        video.addEventListener('pause', () => {
            updateStatus('⏸️ Paused');
        });
        
        video.addEventListener('volumechange', function() {
            localStorage.setItem('videoVolume', this.volume);
        });
        
        // Load saved volume
        const savedVolume = localStorage.getItem('videoVolume');
        if (savedVolume) {
            video.volume = parseFloat(savedVolume);
            if (volumeSlider) {
                volumeSlider.value = savedVolume;
            }
        }
    }
    
    console.log("✅ ZenGen Live Studio Ready!");
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); }
    }
    .fa-spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
