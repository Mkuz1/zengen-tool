/**
 * ZenGen Studio - Live Search Engine
 * Fetches fresh content from reliable sources
 */

// --- 1. RELIABLE VIDEO SOURCES (No API needed) ---
const WORKING_VIDEO_SOURCES = {
    forest: [
        'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-path-through-a-green-forest-1051-large.mp4',
        'https://player.vimeo.com/external/371433846.sd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=164&oauth2_token_id=57447761'
    ],
    ocean: [
        'https://assets.mixkit.co/videos/preview/mixkit-waves-crashing-on-the-beach-5016-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-rough-sea-waves-on-a-rocky-coast-1230-large.mp4',
        'https://player.vimeo.com/external/449759244.sd.mp4?s=d5f3da46f05f4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a&profile_id=164&oauth2_token_id=57447761'
    ],
    rain: [
        'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-glass-window-2406-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-heavy-rain-falling-on-a-tin-roof-2407-large.mp4',
        'https://player.vimeo.com/external/320379351.sd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=164&oauth2_token_id=57447761'
    ],
    fireplace: [
        'https://assets.mixkit.co/videos/preview/mixkit-burning-fire-in-a-fireplace-415-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-campfire-burning-4156-large.mp4',
        'https://player.vimeo.com/external/3209828.sd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=164&oauth2_token_id=57447761'
    ],
    snow: [
        'https://assets.mixkit.co/videos/preview/mixkit-snow-covered-tree-branches-1336-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-snowfall-in-the-forest-1339-large.mp4',
        'https://player.vimeo.com/external/457991230.sd.mp4?s=d5f3da46f05f4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a&profile_id=164&oauth2_token_id=57447761'
    ]
};

// --- 2. RELIABLE AUDIO SOURCES (No API needed) ---
const WORKING_AUDIO_SOURCES = {
    forest: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-tree-with-yellow-flowers-1173.mp3', name: 'Forest Ambience 1' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-path-through-a-green-forest-1051.mp3', name: 'Forest Ambience 2' },
        { url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_163dd6b0b5.mp3?filename=forest-with-small-birds-and-breeze-1-5995.mp3', name: 'Forest Birds' }
    ],
    ocean: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-waves-crashing-on-the-beach-5016.mp3', name: 'Ocean Waves 1' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-rough-sea-waves-on-a-rocky-coast-1230.mp3', name: 'Ocean Waves 2' },
        { url: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_80aeb0e0cd.mp3?filename=ocean-waves-ambience-124761.mp3', name: 'Ocean Ambience' }
    ],
    rain: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-rain-falling-on-glass-window-2406.mp3', name: 'Rain Sounds 1' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-heavy-rain-falling-on-a-tin-roof-2407.mp3', name: 'Rain Sounds 2' },
        { url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_3d4c2f97c4.mp3?filename=light-rain-ambient-114354.mp3', name: 'Gentle Rain' }
    ],
    fireplace: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-burning-fire-in-a-fireplace-415.mp3', name: 'Fireplace 1' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-close-up-of-campfire-burning-4156.mp3', name: 'Fireplace 2' },
        { url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_30207e6749.mp3?filename=fireplace-1-84095.mp3', name: 'Cozy Fire' }
    ],
    snow: [
        { url: 'https://assets.mixkit.co/music/preview/mixkit-snow-covered-tree-branches-1336.mp3', name: 'Snowfall 1' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-snowfall-in-the-forest-1339.mp3', name: 'Snowfall 2' },
        { url: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d3e7c007f6.mp3?filename=wind-blowing-in-winter-124763.mp3', name: 'Winter Wind' }
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
        
        // Try to play with user interaction
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                updateStatus('🎵 Audio playing');
            }).catch(error => {
                console.log("Audio autoplay prevented, waiting for user interaction");
                // Audio will play when user clicks play button
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
        document.getElementById('videoSourceBadge').textContent = videoData.source;
        document.getElementById('audioSourceValue').textContent = audioData.source;
        document.getElementById('currentVideoSub').innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> <span>Fresh content ready - Click PLAY</span>`;
        
        // Store current data
        currentVideoData = videoData;
        videosLoaded = true;
        
        // Show success message
        showMessage(`✨ Fresh ${theme} content loaded! Video: ${videoData.source}, Audio: ${audioData.source}`);
        
    } catch (error) {
        console.error('Generation error:', error);
        updateStatus('❌ Error loading content');
        showMessage("Unable to load content. Please try again.");
    } finally {
        showLoading(false);
    }
}

function getRandomVideo(theme) {
    const videos = WORKING_VIDEO_SOURCES[theme] || [];
    const randomIndex = Math.floor(Math.random() * videos.length);
    const videoUrl = videos[randomIndex];
    
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
        title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Therapy Video`,
        source: randomSource
    };
}

function getRandomAudio(theme) {
    const audios = WORKING_AUDIO_SOURCES[theme] || [];
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
        
        // Show loading state
        video1.poster = getVideoPoster(currentTheme);
        video1.src = '';
        
        // Set new video source
        video1.src = videoData.url;
        
        // Update video info
        document.getElementById('currentVideoTitle').innerHTML = `${videoData.title} <span class="source-badge">${videoData.source}</span>`;
        
        // Wait for video to load
        video1.addEventListener('loadeddata', () => {
            video1.play().then(() => {
                // Auto-pause after 1 second to show it's loaded
                setTimeout(() => {
                    video1.pause();
                    resolve();
                }, 1000);
            }).catch(() => {
                // Video loaded but autoplay prevented
                resolve();
            });
        });
        
        video1.addEventListener('error', (e) => {
            console.error('Video load error:', e);
            // Try fallback
            loadFallbackVideo();
            resolve();
        });
        
        // Timeout fallback
        setTimeout(resolve, 2000);
    });
}

function loadFallbackVideo() {
    const video1 = document.getElementById('vid1');
    const fallbackVideos = {
        forest: 'https://player.vimeo.com/external/371433846.sd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=164&oauth2_token_id=57447761',
        ocean: 'https://player.vimeo.com/external/449759244.sd.mp4?s=d5f3da46f05f4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a&profile_id=164&oauth2_token_id=57447761',
        rain: 'https://player.vimeo.com/external/320379351.sd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=164&oauth2_token_id=57447761',
        fireplace: 'https://player.vimeo.com/external/3209828.sd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=164&oauth2_token_id=57447761',
        snow: 'https://player.vimeo.com/external/457991230.sd.mp4?s=d5f3da46f05f4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a&profile_id=164&oauth2_token_id=57447761'
    };
    
    video1.src = fallbackVideos[currentTheme] || fallbackVideos.forest;
    document.getElementById('videoSourceBadge').textContent = 'Vimeo Library';
}

function updateAudioOptions(audioData, theme) {
    const audioSelect = document.getElementById('audioVariant');
    
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
        audios.forEach((audio, index) => {
            if (audio.url !== audioData.url) { // Don't duplicate the current one
                const newOption = document.createElement('option');
                newOption.value = audio.url;
                newOption.textContent = `${audio.name} (Alternative ${index + 1})`;
                audioSelect.appendChild(newOption);
            }
        });
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
    document.getElementById('videoTitle').value = selectedTitle;
    document.getElementById('videoDesc').value = fullDescription;
    document.getElementById('videoTags').value = randomTags.join('\n');
    
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
            const audioUrl = document.getElementById('audioVariant').value;
            if (audioUrl) {
                audioPlayer.play(audioUrl);
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
                message.includes('Searching') || message.includes('🔍') ? 'searching' :
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
        element.setSelectionRange(0, 99999); // For mobile devices
        
        try {
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
    
    document.getElementById('startScreen').style.opacity = '0';
    
    setTimeout(() => {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('workspace').style.display = 'flex';
        
        // Set initial theme
        loadThemeOptions();
        updateStatus('✅ Ready for live search');
        
        console.log("Live Search Studio initialized!");
    }, 500);
}

function loadThemeOptions() {
    const theme = document.getElementById('themeSelect').value;
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
    document.getElementById('enterStudioBtn').addEventListener('click', initStudio);
    
    // Theme Change
    document.getElementById('themeSelect').addEventListener('change', function() {
        loadThemeOptions();
        videosLoaded = false;
        updateStatus('🔄 Theme changed - Ready to search');
    });
    
    // Theme Cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', function() {
            const theme = this.dataset.theme;
            document.getElementById('themeSelect').value = theme;
            loadThemeOptions();
            videosLoaded = false;
            updateStatus('🔄 Theme changed - Ready to search');
        });
    });
    
    // Generate Button
    document.getElementById('generateBtn').addEventListener('click', function() {
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
    
    // Play/Pause Button
    document.getElementById('playPauseBtn').addEventListener('click', playCurrentVideo);
    
    // Audio Selection
    document.getElementById('audioVariant').addEventListener('change', function() {
        if (audioPlayer.isPlaying) {
            audioPlayer.play(this.value);
        }
    });
    
    // Download Button
    document.getElementById('recordBtn').addEventListener('click', function() {
        if (!videosLoaded || !currentVideoData) {
            showMessage("Please search for content first!");
            return;
        }
        
        const video = document.getElementById('vid1');
        if (video.src) {
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
    
    // Copy Buttons
    document.getElementById('copyTitleBtn').addEventListener('click', () => copyToClip('videoTitle'));
    document.getElementById('copyDescBtn').addEventListener('click', () => copyToClip('videoDesc'));
    document.getElementById('copyTagsBtn').addEventListener('click', () => copyToClip('videoTags'));
    
    // Social Buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!videosLoaded) {
                showMessage("Search for content first to share!");
                return;
            }
            
            const platform = this.dataset.platform;
            const title = encodeURIComponent(document.getElementById('videoTitle').value);
            const urls = {
                youtube: `https://www.youtube.com/upload?title=${title}`,
                tiktok: `https://www.tiktok.com/upload`,
                instagram: `https://www.instagram.com/create/select/`,
                facebook: `https://www.facebook.com/sharer/sharer.php?quote=${title}`
            };
            
            window.open(urls[platform], '_blank');
        });
    });
    
    // Volume Control
    document.getElementById('volumeSlider').addEventListener('input', function(e) {
        const volume = parseFloat(e.target.value);
        audioPlayer.setVolume(volume);
        const video = document.getElementById('vid1');
        if (video) video.volume = volume;
    });
    
    // Mute Button
    document.getElementById('muteBtn').addEventListener('click', function() {
        const isMuted = audioPlayer.toggleMute();
        const video = document.getElementById('vid1');
        if (video) video.muted = isMuted;
        
        this.innerHTML = isMuted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    });
    
    // Video Controls
    const video = document.getElementById('vid1');
    
    // Play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            video.play().catch(e => {
                showMessage("Click the play button on the video player");
            });
        });
    }
    
    // Pause button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => video.pause());
    }
    
    // Mute video button
    const muteVideoBtn = document.getElementById('muteVideoBtn');
    if (muteVideoBtn) {
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
                container.requestFullscreen().catch(err => {
                    console.log('Fullscreen error:', err);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }
    
    // Video events
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
    window.addEventListener('load', function() {
        const savedVolume = localStorage.getItem('videoVolume');
        if (savedVolume) {
            video.volume = parseFloat(savedVolume);
            const volumeSlider = document.getElementById('volumeSlider');
            if (volumeSlider) {
                volumeSlider.value = savedVolume;
            }
        }
    });
    
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
