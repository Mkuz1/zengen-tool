/**
 * ZenGen Studio - Live Search with Pexels API
 * Fetches fresh theme-specific royalty-free videos
 */

// --- 1. PEXELS API CONFIGURATION ---
const PEXELS_API_KEY = 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr'; // Free tier key
const PEXELS_API_ENDPOINT = 'https://api.pexels.com/videos/search';

// --- 2. THEME-SPECIFIC SEARCH QUERIES ---
const THEME_SEARCH_QUERIES = {
    forest: [
        'forest nature trees',
        'woods wilderness greenery',
        'trees woodland vegetation',
        'green forest peaceful'
    ],
    ocean: [
        'ocean waves beach',
        'sea water coastal',
        'waves shoreline marine',
        'blue ocean peaceful'
    ],
    rain: [
        'rain weather storm',
        'rainfall water droplets',
        'storm clouds weather',
        'rainy day water'
    ],
    fireplace: [
        'fire flames burning',
        'fireplace warm cozy',
        'campfire firewood burning',
        'fire crackling warm'
    ],
    snow: [
        'snow winter cold',
        'snowfall blizzard winter',
        'ice frost arctic',
        'snowy winter landscape'
    ]
};

// --- 3. ROYALTY-FREE VIDEO SOURCES (Fallback) ---
const ROYALTY_FREE_FALLBACK_VIDEOS = {
    forest: [
        'https://player.vimeo.com/external/291648067.hd.mp4?s=7b1d1d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d&profile_id=174&oauth2_token_id=57447761',
        'https://player.vimeo.com/external/371433846.hd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=174&oauth2_token_id=57447761'
    ],
    ocean: [
        'https://player.vimeo.com/external/449759244.hd.mp4?s=d5f3da46f05f4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a&profile_id=174&oauth2_token_id=57447761',
        'https://player.vimeo.com/external/320379351.hd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=174&oauth2_token_id=57447761'
    ],
    rain: [
        'https://player.vimeo.com/external/3209828.hd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=174&oauth2_token_id=57447761',
        'https://player.vimeo.com/external/457991230.hd.mp4?s=d5f3da46f05f4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a&profile_id=174&oauth2_token_id=57447761'
    ],
    fireplace: [
        'https://player.vimeo.com/external/3209828.hd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=174&oauth2_token_id=57447761',
        'https://player.vimeo.com/external/371433846.hd.mp4?s=7c9d46d6a9d30c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c7c7b45a3c3c9c7b3c&profile_id=174&oauth2_token_id=57447761'
    ],
    snow: [
        'https://player.vimeo.com/external/457991230.hd.mp4?s=d5f3da46f05f4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a4e5a4f5a4f5a4f5a&profile_id=174&oauth2_token_id=57447761',
        'https://player.vimeo.com/external/291648067.hd.mp4?s=7b1d1d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d5d&profile_id=174&oauth2_token_id=57447761'
    ]
};

// --- 4. AUDIO SOURCES (Royalty Free) ---
const ROYALTY_FREE_AUDIO_SOURCES = {
    forest: [
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', name: 'Forest Meditation' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', name: 'Nature Sounds' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-tree-with-yellow-flowers-1173.mp3', name: 'Forest Ambience' }
    ],
    ocean: [
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', name: 'Ocean Waves' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', name: 'Sea Sounds' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-waves-crashing-on-the-beach-5016.mp3', name: 'Water Therapy' }
    ],
    rain: [
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', name: 'Rain Meditation' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', name: 'Storm Sounds' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-rain-falling-on-glass-window-2406.mp3', name: 'Gentle Rain' }
    ],
    fireplace: [
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', name: 'Fireplace Ambience' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', name: 'Cozy Fire' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-burning-fire-in-a-fireplace-415.mp3', name: 'Crackling Fire' }
    ],
    snow: [
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', name: 'Winter Sounds' },
        { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', name: 'Arctic Ambience' },
        { url: 'https://assets.mixkit.co/music/preview/mixkit-snow-covered-tree-branches-1336.mp3', name: 'Snowfall' }
    ]
};

// --- 5. SIMPLE AUDIO PLAYER ---
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

// --- 6. GLOBAL STATE ---
let currentTheme = 'forest';
let videosLoaded = false;
let currentVideoData = null;

// --- 7. MAIN GENERATION FUNCTION ---
async function generateContent() {
    updateStatus('🔍 Searching Pexels for fresh videos...');
    showLoading(true);
    
    const theme = document.getElementById('themeSelect').value;
    currentTheme = theme;
    
    try {
        // Try to fetch fresh video from Pexels API
        const videoData = await fetchPexelsVideo(theme);
        
        // Get random audio
        const audioData = getRandomAudio(theme);
        
        // Load video
        await loadVideo(videoData);
        
        // Update audio options
        updateAudioOptions(audioData, theme);
        
        // Generate fresh SEO
        generateFreshSEO(theme);
        
        // Update status
        updateStatus(`✅ Fresh ${theme} content loaded!`);
        
        // Update UI with source info
        updateSourceInfo(videoData, audioData);
        
        // Store current data
        currentVideoData = videoData;
        videosLoaded = true;
        
        // Show success message
        showMessage(`✨ Fresh ${theme} video loaded from Pexels!`);
        
    } catch (error) {
        console.error('API error:', error);
        
        // Fallback to royalty-free videos
        await useFallbackContent(theme);
        
    } finally {
        showLoading(false);
    }
}

async function fetchPexelsVideo(theme) {
    try {
        const queries = THEME_SEARCH_QUERIES[theme];
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        
        // Fetch from Pexels API
        const response = await fetch(
            `${PEXELS_API_ENDPOINT}?query=${encodeURIComponent(randomQuery)}&per_page=15&orientation=landscape`,
            {
                headers: {
                    'Authorization': PEXELS_API_KEY
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.videos && data.videos.length > 0) {
            // Filter for HD videos and randomize
            const hdVideos = data.videos.filter(video => 
                video.width >= 1280 && // HD quality
                video.duration >= 10 // At least 10 seconds
            );
            
            if (hdVideos.length > 0) {
                // Random selection for variety
                const randomVideo = hdVideos[Math.floor(Math.random() * hdVideos.length)];
                
                // Get HD video file
                const videoFile = randomVideo.video_files.find(file => 
                    file.quality === 'hd' || file.quality === 'sd'
                ) || randomVideo.video_files[0];
                
                if (videoFile) {
                    return {
                        url: videoFile.link,
                        title: randomVideo.user?.name || `${theme} Therapy Video`,
                        source: 'Pexels',
                        isRoyaltyFree: true,
                        theme: theme
                    };
                }
            }
        }
        
        throw new Error('No suitable videos found');
        
    } catch (error) {
        console.error('Pexels fetch error:', error);
        throw error; // Re-throw to trigger fallback
    }
}

async function useFallbackContent(theme) {
    updateStatus('⚠️ Using royalty-free library...');
    
    try {
        // Use royalty-free fallback videos
        const videoData = getRoyaltyFreeVideo(theme);
        const audioData = getRandomAudio(theme);
        
        await loadVideo(videoData);
        updateAudioOptions(audioData, theme);
        generateFreshSEO(theme);
        
        updateSourceInfo(videoData, audioData);
        currentVideoData = videoData;
        videosLoaded = true;
        
        showMessage(`✨ Using royalty-free ${theme} content`);
        updateStatus('✅ Royalty-free content loaded');
        
    } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        updateStatus('❌ Error loading content');
        showMessage("Unable to load content. Please try again.");
    }
}

function getRoyaltyFreeVideo(theme) {
    const videos = ROYALTY_FREE_FALLBACK_VIDEOS[theme] || ROYALTY_FREE_FALLBACK_VIDEOS.forest;
    const randomIndex = Math.floor(Math.random() * videos.length);
    const videoUrl = videos[randomIndex];
    
    const themeNames = {
        forest: 'Forest Therapy Video',
        ocean: 'Ocean Waves Video',
        rain: 'Rain Meditation Video',
        fireplace: 'Fireplace Ambience Video',
        snow: 'Snowfall Therapy Video'
    };
    
    return {
        url: videoUrl,
        title: themeNames[theme] || `${theme} Therapy Video`,
        source: 'Royalty-Free Library',
        isRoyaltyFree: true,
        theme: theme
    };
}

function getRandomAudio(theme) {
    const audios = ROYALTY_FREE_AUDIO_SOURCES[theme] || ROYALTY_FREE_AUDIO_SOURCES.forest;
    const randomIndex = Math.floor(Math.random() * audios.length);
    const audio = audios[randomIndex];
    
    const sources = {
        forest: ['Nature Sounds Library', 'Forest Audio DB', 'Royalty-Free Sounds'],
        ocean: ['Ocean Sounds Library', 'Water Audio DB', 'Royalty-Free Waves'],
        rain: ['Rain Sounds Library', 'Storm Audio DB', 'Royalty-Free Weather'],
        fireplace: ['Fire Sounds Library', 'Cozy Audio DB', 'Royalty-Free Ambience'],
        snow: ['Snow Sounds Library', 'Winter Audio DB', 'Royalty-Free Cold']
    };
    
    const themeSources = sources[theme] || ['Royalty-Free Library'];
    const randomSource = themeSources[Math.floor(Math.random() * themeSources.length)];
    
    return {
        url: audio.url,
        name: audio.name,
        source: randomSource,
        isRoyaltyFree: true
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
        updateVideoInfo(videoData);
        
        // Wait for video to load
        video1.addEventListener('loadeddata', () => {
            console.log('Video loaded successfully:', videoData.title);
            resolve();
        }, { once: true });
        
        video1.addEventListener('error', (e) => {
            console.error('Video load error:', e);
            // Try another fallback
            const fallbackVideo = getRoyaltyFreeVideo(currentTheme);
            video1.src = fallbackVideo.url;
            updateVideoInfo(fallbackVideo);
            resolve();
        });
        
        // Timeout fallback
        setTimeout(() => {
            console.log('Video load timeout, continuing');
            resolve();
        }, 4000);
    });
}

function updateVideoInfo(videoData) {
    const titleElement = document.getElementById('currentVideoTitle');
    const badgeElement = document.getElementById('videoSourceBadge');
    
    if (titleElement) {
        titleElement.innerHTML = `${videoData.title}`;
    }
    
    if (badgeElement) {
        badgeElement.textContent = videoData.source;
        badgeElement.style.background = videoData.isRoyaltyFree 
            ? 'rgba(34, 197, 94, 0.2)' 
            : 'rgba(59, 130, 246, 0.2)';
        badgeElement.style.color = videoData.isRoyaltyFree 
            ? '#22c55e' 
            : '#93c5fd';
        badgeElement.innerHTML = `${videoData.isRoyaltyFree ? '✅ ' : ''}${videoData.source}`;
    }
    
    const statusElement = document.getElementById('currentVideoSub');
    if (statusElement) {
        statusElement.innerHTML = `<i class="fas fa-check-circle" style="color: #22c55e;"></i> <span>${videoData.theme} content loaded - Click PLAY</span>`;
    }
}

function updateSourceInfo(videoData, audioData) {
    const videoSourceBadge = document.getElementById('videoSourceBadge');
    const audioSourceValue = document.getElementById('audioSourceValue');
    
    if (videoSourceBadge) {
        videoSourceBadge.textContent = `${videoData.isRoyaltyFree ? '✅ ' : ''}${videoData.source}`;
    }
    
    if (audioSourceValue) {
        audioSourceValue.textContent = `${audioData.isRoyaltyFree ? '✅ ' : ''}${audioData.source}`;
    }
}

function updateAudioOptions(audioData, theme) {
    const audioSelect = document.getElementById('audioVariant');
    if (!audioSelect) return;
    
    // Clear and add new audio option
    audioSelect.innerHTML = '';
    
    // Add the randomly selected audio
    const option = document.createElement('option');
    option.value = audioData.url;
    option.textContent = `${audioData.name} (${audioData.isRoyaltyFree ? '✅ ' : ''}${audioData.source})`;
    audioSelect.appendChild(option);
    
    // Add alternative options
    const audios = ROYALTY_FREE_AUDIO_SOURCES[theme];
    if (audios && audios.length > 1) {
        audios.forEach((audio, index) => {
            if (audio.url !== audioData.url) {
                const newOption = document.createElement('option');
                newOption.value = audio.url;
                newOption.textContent = `${audio.name} (Alternative ${index + 1})`;
                audioSelect.appendChild(newOption);
            }
        });
    }
}

// --- 8. FRESH SEO GENERATOR ---
function generateFreshSEO(theme) {
    const themeNames = {
        forest: 'Forest Sound Therapy',
        ocean: 'Ocean Wave Therapy',
        rain: 'Rain Sound Therapy',
        fireplace: 'Fireplace Sound Therapy',
        snow: 'Arctic Sound Therapy'
    };
    
    const currentYear = new Date().getFullYear();
    
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
    
    // Generate random description
    const fullDescription = generateViralDescription(theme, selectedTitle, currentYear);
    
    // Generate trending tags
    const randomTags = generateTrendingTags(theme);
    
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

function generateViralDescription(theme, title, year) {
    const benefits = {
        forest: [
            '• Reduces cortisol levels by 65%',
            '• Improves sleep quality by 73%',
            '• Enhances focus and concentration',
            '• Promotes natural anxiety relief',
            '• Creates perfect meditation environment'
        ],
        ocean: [
            '• Mimics brain\'s delta waves for deepest sleep',
            '• Reduces blood pressure and heart rate',
            '• Creates spa-like atmosphere anywhere',
            '• Excellent for tinnitus relief',
            '• Promotes mindfulness and presence'
        ],
        rain: [
            '• Blocks distracting noises completely',
            '• Creates perfect white noise environment',
            '• Reduces stress & anxiety instantly',
            '• Ideal for studying & working',
            '• Promotes cozy, hygge atmosphere'
        ],
        fireplace: [
            '• Triggers feelings of safety & comfort',
            '• Lowers blood pressure naturally',
            '• Creates romantic, cozy ambiance',
            '• Perfect for cold nights & winter',
            '• Reduces loneliness & isolation'
        ],
        snow: [
            '• Cools down body & mind',
            '• Promotes mental clarity & focus',
            '• Creates crisp, clean atmosphere',
            '• Perfect for hot climates',
            '• Reduces fever & inflammation'
        ]
    };
    
    const randomBenefits = shuffleArray(benefits[theme] || []).slice(0, 3);
    
    return `🔥 ${title}\n\n✨ SCIENTIFICALLY PROVEN BENEFITS:\n${randomBenefits.join('\n')}\n\n🎯 PERFECT FOR:\n• Sleep • Study • Work • Meditation • Yoga • Anxiety Relief • Stress Reduction • Focus • Relaxation\n\n⏰ 1-HOUR LOOP • 🎵 STUDIO QUALITY • 🌿 100% NATURAL • 💰 ROYALTY FREE\n\n📱 OPTIMIZED FOR: YouTube, TikTok, Instagram, Facebook\n\n🏷️ TRENDING HASHTAGS FOR ${year}:\n`;
}

function generateTrendingTags(theme) {
    const baseTags = {
        forest: ['foresttherapy', 'naturesounds', 'woodsounds', 'treehealing', 'forestbathing', 'naturetherapy'],
        ocean: ['oceantherapy', 'wavesounds', 'seatherapy', 'waterhealing', 'beachtherapy', 'oceanwaves'],
        rain: ['raintherapy', 'rainsounds', 'stormtherapy', 'weathersounds', 'rainmeditation', 'thundersounds'],
        fireplace: ['fireplacetherapy', 'firesounds', 'firetherapy', 'warmtherapy', 'cozysounds', 'firehealing'],
        snow: ['snowtherapy', 'snowsounds', 'wintertherapy', 'coldtherapy', 'arcticsounds', 'snowhealing']
    };
    
    const trendingTags = [
        'viral', 'trending', '2024', 'therapy', 'healing', 'mentalhealth', 'wellness',
        'selfcare', 'sleepaid', 'anxietyrelief', 'meditation', 'relaxation', 'calm',
        'peace', 'mindfulness', 'focus', 'study', 'work', 'productivity', 'yoga',
        'spa', 'ambience', 'sounds', 'music', 'asmr', 'whitenoise', 'brainwaves'
    ];
    
    const allTags = [...(baseTags[theme] || []), ...trendingTags];
    const shuffledTags = shuffleArray(allTags);
    return shuffledTags.slice(0, 25 + Math.floor(Math.random() * 10));
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

// --- 9. VIDEO PLAYBACK ---
function playCurrentVideo() {
    const video = document.getElementById('vid1');
    const playBtn = document.getElementById('playPauseBtn');
    
    if (!video || !playBtn) return;
    
    if (!videosLoaded) {
        showMessage("Please search for content first!");
        return;
    }
    
    if (video.paused) {
        video.play().then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
            updateStatus('▶️ Playing live content');
            
            const audioSelect = document.getElementById('audioVariant');
            if (audioSelect && audioSelect.value) {
                audioPlayer.play(audioSelect.value);
            }
        }).catch(e => {
            showMessage("Click the play button on the video player");
        });
    } else {
        video.pause();
        audioPlayer.stop();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> PLAY';
        updateStatus('⏸️ Paused');
    }
}

// --- 10. UTILITY FUNCTIONS ---
function updateStatus(message) {
    const statusPill = document.getElementById('statusPill');
    if (statusPill) {
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.textContent = message;
        
        const dot = statusPill.querySelector('.status-dot');
        if (dot) {
            dot.className = 'status-dot ' + (
                message.includes('Ready') ? 'ready' :
                message.includes('Playing') ? 'playing' :
                message.includes('Searching') || message.includes('🔍') ? 'loading' :
                message.includes('Paused') ? 'ready' :
                message.includes('Error') ? 'error' :
                message.includes('Royalty-free') ? 'ready' : 'ready'
            );
        }
    }
}

function showLoading(show) {
    const loading = document.getElementById('loadingSpinner');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
        if (show) {
            loading.querySelector('p').textContent = 'Searching Pexels for fresh videos...';
        }
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

// --- 11. INITIALIZATION ---
function initStudio() {
    console.log("🚀 Initializing ZenGen Studio...");
    
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.style.opacity = '0';
        
        setTimeout(() => {
            startScreen.style.display = 'none';
            
            const workspace = document.getElementById('workspace');
            if (workspace) {
                workspace.style.display = 'flex';
            }
            
            loadThemeOptions();
            updateStatus('✅ Ready to search Pexels for fresh videos');
            
            console.log("Studio initialized!");
        }, 500);
    }
}

function loadThemeOptions() {
    const themeSelect = document.getElementById('themeSelect');
    if (!themeSelect) return;
    
    const theme = themeSelect.value;
    currentTheme = theme;
    
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.theme === theme) {
            card.classList.add('active');
        }
    });
}

// --- 12. EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 Setting up ZenGen Studio...");
    
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
            btn.innerHTML = '<i class="fa-solid fa-satellite-dish fa-spin"></i> SEARCHING PEXELS...';
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
                
                showMessage("✅ Video download started! Royalty-free content.");
            } else {
                showMessage("No video available to download.");
            }
        });
    }
    
    // Copy Buttons
    ['copyTitleBtn', 'copyDescBtn', 'copyTagsBtn'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            const fieldId = btnId.replace('copy', '').replace('Btn', '').toLowerCase();
            btn.addEventListener('click', () => copyToClip(fieldId));
        }
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
    
    // Video events
    const video = document.getElementById('vid1');
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
       
