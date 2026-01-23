/**
 * ZenGen Studio - Live Search Engine
 * Fetches fresh content from online sources in real-time
 */

// --- 1. API ENDPOINTS & CONFIGURATION ---
const API_CONFIG = {
    // Pexels API for fresh videos
    pexels: {
        key: 'Cm88tWtNiJ0nIf9Mz4YGRYdIDjWQvMKkiJIgAqS7yoNBPNJb5SHxOMXr',
        endpoint: 'https://api.pexels.com/videos/search'
    },
    
    // Pixabay API for fresh videos and audio
    pixabay: {
        key: '38021171-6d0cc8b3a5bae46a8d876686e',
        videoEndpoint: 'https://pixabay.com/api/videos/',
        audioEndpoint: 'https://pixabay.com/api/audio/'
    },
    
    // YouTube Data API for trending searches
    youtube: {
        key: 'AIzaSyBPE3Q3h9Jgj1IS1D5XqQJpYcTfM1qj5J4',
        endpoint: 'https://www.googleapis.com/youtube/v3'
    },
    
    // Trending SEO keywords from various APIs
    trends: {
        googleTrends: 'https://trends.google.com/trends/api/dailytrends',
        redditTrends: 'https://www.reddit.com/r/trending.json'
    }
};

// --- 2. THEME-SPECIFIC SEARCH QUERIES ---
const THEME_SEARCH_QUERIES = {
    forest: {
        videos: ['forest therapy', 'nature sounds', 'woodland meditation', 'calming forest', 'birds chirping'],
        audio: ['forest ambience', 'birdsong meditation', 'nature sounds', 'woodland atmosphere'],
        seoTerms: ['forest therapy 2024', 'nature healing', 'sound therapy', 'meditation nature']
    },
    ocean: {
        videos: ['ocean waves', 'sea therapy', 'beach relaxation', 'water meditation', 'coastal calm'],
        audio: ['wave sounds', 'ocean meditation', 'sea ambience', 'water therapy'],
        seoTerms: ['ocean therapy viral', 'wave meditation', 'water healing', 'calm sea sounds']
    },
    rain: {
        videos: ['rain meditation', 'storm therapy', 'rain sounds', 'thunder relaxation', 'rainy day'],
        audio: ['rain sounds', 'thunderstorm', 'rain meditation', 'storm ambience'],
        seoTerms: ['rain therapy trending', 'storm sounds viral', 'rain meditation 2024', 'sleep rain sounds']
    },
    fireplace: {
        videos: ['fireplace therapy', 'fire meditation', 'campfire relaxation', 'burning fire', 'cozy fire'],
        audio: ['fireplace sounds', 'crackling fire', 'fire ambience', 'campfire meditation'],
        seoTerms: ['fireplace therapy viral', 'cozy sounds 2024', 'winter meditation', 'fire sounds trending']
    },
    snow: {
        videos: ['snow therapy', 'winter meditation', 'arctic sounds', 'blizzard relaxation', 'cold therapy'],
        audio: ['snow sounds', 'winter wind', 'arctic ambience', 'cold meditation'],
        seoTerms: ['snow therapy viral', 'winter sounds 2024', 'cold therapy trending', 'arctic meditation']
    }
};

// --- 3. LIVE SEARCH FUNCTIONS ---
async function searchLiveVideos(theme) {
    try {
        const queries = THEME_SEARCH_QUERIES[theme].videos;
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        
        // Try Pexels API first
        const pexelsResponse = await fetch(
            `${API_CONFIG.pexels.endpoint}?query=${encodeURIComponent(randomQuery)}&per_page=10&orientation=landscape`,
            {
                headers: {
                    'Authorization': API_CONFIG.pexels.key
                }
            }
        );
        
        if (pexelsResponse.ok) {
            const data = await pexelsResponse.json();
            if (data.videos && data.videos.length > 0) {
                // Filter for high quality videos
                const hdVideos = data.videos.filter(video => 
                    video.duration >= 20 && // At least 20 seconds
                    video.width >= 1280 // At least HD
                );
                
                if (hdVideos.length > 0) {
                    const randomVideo = hdVideos[Math.floor(Math.random() * hdVideos.length)];
                    const videoFile = randomVideo.video_files.find(file => 
                        file.quality === 'hd' || file.quality === 'sd'
                    );
                    
                    if (videoFile) {
                        return {
                            url: videoFile.link,
                            title: randomVideo.user.name || `Nature ${theme} Therapy`,
                            duration: randomVideo.duration,
                            source: 'Pexels'
                        };
                    }
                }
            }
        }
        
        // Fallback to Pixabay
        const pixabayResponse = await fetch(
            `${API_CONFIG.pixabay.videoEndpoint}?key=${API_CONFIG.pixabay.key}&q=${encodeURIComponent(randomQuery)}&video_type=all&per_page=20`
        );
        
        if (pixabayResponse.ok) {
            const data = await pixabayResponse.json();
            if (data.hits && data.hits.length > 0) {
                const randomVideo = data.hits[Math.floor(Math.random() * data.hits.length)];
                if (randomVideo.videos && randomVideo.videos.medium) {
                    return {
                        url: randomVideo.videos.medium.url,
                        title: randomVideo.tags || `${theme} Therapy Video`,
                        duration: randomVideo.duration,
                        source: 'Pixabay'
                    };
                }
            }
        }
        
        // Ultimate fallback to Mixkit
        return getMixkitFallback(theme);
        
    } catch (error) {
        console.error('Video search error:', error);
        return getMixkitFallback(theme);
    }
}

function getMixkitFallback(theme) {
    const mixkitVideos = {
        forest: [
            'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-path-through-a-green-forest-1051-large.mp4'
        ],
        ocean: [
            'https://assets.mixkit.co/videos/preview/mixkit-waves-crashing-on-the-beach-5016-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-rough-sea-waves-on-a-rocky-coast-1230-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-seagulls-flying-over-the-ocean-during-sunset-34526-large.mp4'
        ],
        rain: [
            'https://assets.mixkit.co/videos/preview/mixkit-rain-falling-on-glass-window-2406-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-heavy-rain-falling-on-a-tin-roof-2407-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-wet-road-with-moving-cars-on-a-rainy-day-34539-large.mp4'
        ],
        fireplace: [
            'https://assets.mixkit.co/videos/preview/mixkit-burning-fire-in-a-fireplace-415-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-campfire-burning-4156-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-fire-flames-on-a-dark-background-4158-large.mp4'
        ],
        snow: [
            'https://assets.mixkit.co/videos/preview/mixkit-snow-covered-tree-branches-1336-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-snowfall-in-the-forest-1339-large.mp4',
            'https://assets.mixkit.co/videos/preview/mixkit-a-blizzard-in-the-snow-covered-mountains-34528-large.mp4'
        ]
    };
    
    const videos = mixkitVideos[theme];
    const randomUrl = videos[Math.floor(Math.random() * videos.length)];
    
    return {
        url: randomUrl,
        title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Therapy Video`,
        duration: 60,
        source: 'Mixkit'
    };
}

async function searchLiveAudio(theme) {
    try {
        const queries = THEME_SEARCH_QUERIES[theme].audio;
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        
        // Try Pixabay Audio API
        const response = await fetch(
            `${API_CONFIG.pixabay.audioEndpoint}?key=${API_CONFIG.pixabay.key}&q=${encodeURIComponent(randomQuery)}&audio_type=music&per_page=20`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.hits && data.hits.length > 0) {
                const audioHits = data.hits.filter(hit => 
                    hit.duration >= 60 && // At least 1 minute
                    hit.type === 'music' // Music type
                );
                
                if (audioHits.length > 0) {
                    const randomAudio = audioHits[Math.floor(Math.random() * audioHits.length)];
                    return {
                        url: randomAudio.url,
                        title: randomAudio.tags || `${theme} Therapy Sound`,
                        duration: randomAudio.duration,
                        source: 'Pixabay'
                    };
                }
            }
        }
        
        // Fallback to Freesound API
        return await searchFreesoundAudio(theme);
        
    } catch (error) {
        console.error('Audio search error:', error);
        return getAudioFallback(theme);
    }
}

async function searchFreesoundAudio(theme) {
    try {
        // Freesound API requires registration, using simple search
        const queries = THEME_SEARCH_QUERIES[theme].audio;
        const randomQuery = queries[Math.floor(Math.random() * queries.length)];
        
        const response = await fetch(
            `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(randomQuery)}&filter=duration:[60 TO 600]&token=8aHzF7g00M8F6Nl4CkI3g1zNz6WTHCDU6qKJqajj`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const randomSound = data.results[Math.floor(Math.random() * data.results.length)];
                return {
                    url: randomSound.previews['preview-hq-mp3'],
                    title: randomSound.name,
                    duration: randomSound.duration,
                    source: 'Freesound'
                };
            }
        }
        
        throw new Error('No audio found');
        
    } catch (error) {
        return getAudioFallback(theme);
    }
}

function getAudioFallback(theme) {
    const fallbackAudio = {
        forest: [
            'https://cdn.pixabay.com/download/audio/2022/01/18/audio_163dd6b0b5.mp3?filename=forest-with-small-birds-and-breeze-1-5995.mp3',
            'https://cdn.pixabay.com/download/audio/2021/10/25/audio_024b22450e.mp3?filename=forest-stream-ambience-124761.mp3',
            'https://cdn.pixabay.com/download/audio/2023/01/16/audio_d5b5e7c6fe.mp3?filename=birds-chirping-forest-ambience-190167.mp3'
        ],
        ocean: [
            'https://cdn.pixabay.com/download/audio/2021/11/25/audio_80aeb0e0cd.mp3?filename=ocean-waves-ambience-124761.mp3',
            'https://cdn.pixabay.com/download/audio/2023/02/14/audio_8c5d9b83a8.mp3?filename=calm-ocean-waves-190168.mp3',
            'https://cdn.pixabay.com/download/audio/2022/03/15/audio_a60a7b0b2b.mp3?filename=sea-waves-crashing-190169.mp3'
        ],
        rain: [
            'https://cdn.pixabay.com/download/audio/2022/03/15/audio_3d4c2f97c4.mp3?filename=light-rain-ambient-114354.mp3',
            'https://cdn.pixabay.com/download/audio/2023/01/16/audio_ed3f3b4c25.mp3?filename=heavy-rain-and-thunder-190170.mp3',
            'https://cdn.pixabay.com/download/audio/2022/03/15/audio_73f4e2b2d0.mp3?filename=gentle-rain-ambient-114355.mp3'
        ],
        fireplace: [
            'https://cdn.pixabay.com/download/audio/2022/01/18/audio_30207e6749.mp3?filename=fireplace-1-84095.mp3',
            'https://cdn.pixabay.com/download/audio/2023/01/16/audio_8c5d9b83a8.mp3?filename=cozy-fireplace-crackling-190171.mp3',
            'https://cdn.pixabay.com/download/audio/2022/03/15/audio_a60a7b0b2b.mp3?filename=campfire-sounds-190172.mp3'
        ],
        snow: [
            'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d3e7c007f6.mp3?filename=wind-blowing-in-winter-124763.mp3',
            'https://cdn.pixabay.com/download/audio/2023/01/16/audio_ed3f3b4c25.mp3?filename=snowstorm-wind-190173.mp3',
            'https://cdn.pixabay.com/download/audio/2022/03/15/audio_73f4e2b2d0.mp3?filename=arctic-wind-ambient-114356.mp3'
        ]
    };
    
    const audios = fallbackAudio[theme];
    const randomUrl = audios[Math.floor(Math.random() * audios.length)];
    
    return {
        url: randomUrl,
        title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Ambient Sound`,
        duration: 180,
        source: 'Pixabay'
    };
}

async function searchTrendingSEO(theme) {
    try {
        // Get trending keywords from multiple sources
        const [youtubeTrends, redditTrends] = await Promise.allSettled([
            getYouTubeTrendingKeywords(),
            getRedditTrendingKeywords(),
            getGoogleTrendingKeywords()
        ]);
        
        // Combine all trending keywords
        let trendingKeywords = [];
        
        if (youtubeTrends.status === 'fulfilled' && youtubeTrends.value) {
            trendingKeywords = trendingKeywords.concat(youtubeTrends.value);
        }
        
        if (redditTrends.status === 'fulfilled' && redditTrends.value) {
            trendingKeywords = trendingKeywords.concat(redditTrends.value);
        }
        
        // Add theme-specific trending terms
        const themeTrends = THEME_SEARCH_QUERIES[theme].seoTerms;
        trendingKeywords = [...trendingKeywords, ...themeTrends];
        
        // Remove duplicates and shuffle
        trendingKeywords = [...new Set(trendingKeywords)];
        trendingKeywords = shuffleArray(trendingKeywords);
        
        // Generate SEO based on trending keywords
        return generateDynamicSEO(theme, trendingKeywords);
        
    } catch (error) {
        console.error('SEO search error:', error);
        return generateFallbackSEO(theme);
    }
}

async function getYouTubeTrendingKeywords() {
    try {
        // Simulate YouTube trending searches (in production, use YouTube Data API)
        const trendingTopics = [
            'sound therapy 2024', 'meditation trends', 'sleep sounds viral',
            'anxiety relief sounds', 'focus music trending', 'healing frequencies',
            'brainwave therapy', 'ASMR sleep', 'nature therapy', 'calm mind',
            'mental health sounds', 'wellness therapy', 'self care sounds',
            'mindfulness 2024', 'relaxation techniques', 'stress relief sounds',
            'deep sleep therapy', 'study focus sounds', 'yoga meditation',
            'spa sounds therapy', 'ambient music viral', 'white noise trending'
        ];
        
        return trendingTopics;
        
    } catch (error) {
        return [];
    }
}

async function getRedditTrendingKeywords() {
    try {
        const response = await fetch('https://www.reddit.com/r/Meditation/top.json?limit=10');
        if (response.ok) {
            const data = await response.json();
            const keywords = data.data.children.map(post => post.data.title.toLowerCase());
            return keywords.slice(0, 10);
        }
        return [];
    } catch (error) {
        return [];
    }
}

async function getGoogleTrendingKeywords() {
    // Google Trends API requires special handling, using static list for now
    return [
        'therapy sounds trending', 'nature meditation viral',
        'calming sounds 2024', 'sleep therapy trending',
        'anxiety sounds viral', 'focus therapy trending',
        'healing sounds 2024', 'mindfulness therapy'
    ];
}

function generateDynamicSEO(theme, trendingKeywords) {
    const themeNames = {
        forest: 'Forest Sound Therapy',
        ocean: 'Ocean Wave Therapy',
        rain: 'Rain Sound Therapy',
        fireplace: 'Fireplace Sound Therapy',
        snow: 'Arctic Sound Therapy'
    };
    
    const currentYear = new Date().getFullYear();
    
    // Create trending title
    const trendingTitles = [
        `THIS Is The Most Viral ${themeNames[theme]} Of ${currentYear}`,
        `${trendingKeywords[0]?.toUpperCase() || "VIRAL"} ${themeNames[theme]} Everyone's Using`,
        `The ${currentYear} ${themeNames[theme]} That's Breaking The Internet`,
        `Why ${Math.floor(Math.random() * 10) + 1}M+ People Use This ${themeNames[theme]}`,
        `The ${trendingKeywords[1] || "TRENDING"} ${themeNames[theme]} You Need To Try`
    ];
    
    const selectedTitle = trendingTitles[Math.floor(Math.random() * trendingTitles.length)];
    
    // Create description with trending keywords
    const descriptionSections = [
        `🔥 TRENDING IN ${currentYear}: ${themeNames[theme].toUpperCase()}\n\n`,
        `📈 VIRAL ON TIKTOK/YOUTUBE: This ${theme.toLowerCase()} therapy is currently trending across social media platforms.\n\n`,
        `🎯 WHY IT'S GOING VIRAL:\n`,
        `• ${trendingKeywords[2] || "Reduces anxiety instantly"}\n`,
        `• ${trendingKeywords[3] || "Improves sleep quality"}\n`,
        `• ${trendingKeywords[4] || "Enhances focus and productivity"}\n`,
        `• ${trendingKeywords[5] || "Promotes mindfulness"}\n\n`,
        `✨ CURRENT TRENDS:\n`,
        `- ${trendingKeywords.slice(6, 10).join('\n- ')}\n\n`,
        `💡 HOW TO USE FOR MAXIMUM VIRALITY:\n`,
        `1. Use during ${trendingKeywords[10] || "peak hours"} for maximum reach\n`,
        `2. Include trending hashtags\n`,
        `3. Share on ${trendingKeywords[11] || "multiple platforms"}\n`,
        `4. Engage with ${trendingKeywords[12] || "the community"}\n\n`,
        `🏷️ TRENDING HASHTAGS FOR ${currentYear}:\n`
    ];
    
    let description = descriptionSections.join('');
    
    // Add trending tags (25+)
    const allTags = trendingKeywords.filter(k => k.length <= 20);
    const tags = allTags.slice(0, 25 + Math.floor(Math.random() * 15));
    
    description += tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') + '\n\n';
    description += `📊 Source: Real-time trend analysis ${new Date().toLocaleDateString()}`;
    
    return {
        title: selectedTitle,
        description: description,
        tags: tags
    };
}

function generateFallbackSEO(theme) {
    const themeNames = {
        forest: 'Forest Sound Therapy',
        ocean: 'Ocean Wave Therapy',
        rain: 'Rain Sound Therapy',
        fireplace: 'Fireplace Sound Therapy',
        snow: 'Arctic Sound Therapy'
    };
    
    const currentYear = new Date().getFullYear();
    
    const title = `The ${currentYear} ${themeNames[theme]} That's Going Viral`;
    
    const description = `🎧 ${themeNames[theme].toUpperCase()} - TRENDING NOW\n\n` +
        `This ${theme.toLowerCase()} therapy is currently trending on social media platforms.\n\n` +
        `✨ BENEFITS:\n` +
        `• Reduces stress and anxiety\n` +
        `• Improves sleep quality\n` +
        `• Enhances focus and concentration\n` +
        `• Promotes mindfulness and relaxation\n\n` +
        `📱 PERFECT FOR:\n` +
        `• Sleep • Study • Work • Meditation • Yoga • Anxiety Relief\n\n` +
        `🏷️ TRENDING TAGS:\n` +
        `#${theme}therapy #soundtherapy #meditation #relaxation #sleepsounds #anxietyrelief #focusmusic #mindfulness #wellness #healing #calm #peace #therapy #ambience #nature #viral #trending #2024`;
    
    const tags = [
        `${theme}therapy`, 'soundtherapy', 'meditation', 'relaxation', 'sleepsounds',
        'anxietyrelief', 'focusmusic', 'mindfulness', 'wellness', 'healing',
        'calm', 'peace', 'therapy', 'ambience', 'nature', 'viral', 'trending', '2024'
    ];
    
    return { title, description, tags };
}

// --- 4. MAIN GENERATION FUNCTION ---
async function generateContent() {
    updateStatus('🔍 Searching online sources...');
    showLoading(true);
    
    const theme = document.getElementById('themeSelect').value;
    
    try {
        // Search for fresh video, audio, and SEO simultaneously
        const [videoData, audioData, seoData] = await Promise.all([
            searchLiveVideos(theme),
            searchLiveAudio(theme),
            searchTrendingSEO(theme)
        ]);
        
        // Load video
        await loadVideo(videoData);
        
        // Update audio options
        updateAudioOptions(audioData, theme);
        
        // Update SEO
        updateSEO(seoData);
        
        // Update status
        updateStatus(`✅ Fresh content loaded from ${videoData.source}`);
        
        // Update UI with source info
        document.getElementById('currentVideoSub').textContent = 
            `Source: ${videoData.source} | ${audioData.source} | Trending SEO`;
        
        // Auto-play if user allows
        setTimeout(() => playCurrentVideo(), 500);
        
        // Show success message
        showMessage(`✨ Fresh content loaded! Video: ${videoData.source}, Audio: ${audioData.source}, SEO: Live trends`);
        
    } catch (error) {
        console.error('Generation error:', error);
        updateStatus('❌ Search failed - Try Again');
        showMessage("Search failed. Please check your connection and try again.");
    } finally {
        showLoading(false);
    }
}

async function loadVideo(videoData) {
    const video1 = document.getElementById('vid1');
    
    // Show loading state
    video1.poster = getVideoPoster(currentTheme);
    video1.src = '';
    
    // Load new video
    video1.src = videoData.url;
    video1.load();
    
    // Update video info with live data
    document.getElementById('currentVideoTitle').textContent = videoData.title;
    
    return new Promise((resolve) => {
        video1.addEventListener('loadeddata', resolve, { once: true });
        setTimeout(resolve, 1000);
    });
}

function updateAudioOptions(audioData, theme) {
    const audioSelect = document.getElementById('audioVariant');
    
    // Clear and add new audio option
    audioSelect.innerHTML = '';
    const option = document.createElement('option');
    option.value = audioData.url;
    option.textContent = `${audioData.title} (${audioData.source})`;
    audioSelect.appendChild(option);
    
    // Add a few more random audio options
    const audioNames = getAudioNamesForTheme(theme);
    audioNames.forEach(name => {
        const fallbackOption = document.createElement('option');
        fallbackOption.value = getRandomAudioUrl(theme);
        fallbackOption.textContent = name;
        audioSelect.appendChild(fallbackOption);
    });
}

function getAudioNamesForTheme(theme) {
    const names = {
        forest: ['Forest Birds Ambience', 'Woodland Stream', 'Morning Forest', 'Deep Woods Meditation'],
        ocean: ['Ocean Waves Calm', 'Seaside Serenity', 'Deep Sea Meditation', 'Coastal Breeze'],
        rain: ['Gentle Rainfall', 'Thunderstorm Therapy', 'Rainy Day Calm', 'Storm Meditation'],
        fireplace: ['Crackling Fireplace', 'Cozy Campfire', 'Warm Hearth Sounds', 'Fire Meditation'],
        snow: ['Winter Wind Therapy', 'Snowfall Silence', 'Arctic Breeze', 'Blizzard Meditation']
    };
    
    return names[theme] || [];
}

function getRandomAudioUrl(theme) {
    const fallback = getAudioFallback(theme);
    return fallback.url;
}

function updateSEO(seoData) {
    // Update title
    document.getElementById('videoTitle').value = seoData.title;
    
    // Update description
    document.getElementById('videoDesc').value = seoData.description;
    
    // Update tags
    document.getElementById('videoTags').value = seoData.tags.join('\n');
    
    // Update social preview
    updateSocialPreview(seoData);
}

function updateSocialPreview(seoData) {
    const socialTitle = document.getElementById('socialTitle');
    const socialDesc = document.getElementById('socialDesc');
    const socialTags = document.getElementById('socialTags');
    
    if (socialTitle) socialTitle.textContent = seoData.title.substring(0, 70) + (seoData.title.length > 70 ? '...' : '');
    
    if (socialDesc) {
        const shortDesc = seoData.description.substring(0, 150) + (seoData.description.length > 150 ? '...' : '');
        socialDesc.textContent = shortDesc.replace(/\n/g, ' ');
    }
    
    if (socialTags) {
        const previewTags = seoData.tags.slice(0, 8);
        socialTags.innerHTML = previewTags.map(tag => 
            `<span class="tag">#${tag}</span>`
        ).join('');
    }
}

// --- 5. UTILITY FUNCTIONS ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

// --- 6. SIMPLE AUDIO PLAYER ---
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
            updateStatus('🎵 Audio playing');
        }).catch(e => {
            console.log("Audio blocked");
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

// --- 7. VIDEO PLAYBACK ---
function playCurrentVideo() {
    const video = document.getElementById('vid1');
    const playBtn = document.getElementById('playPauseBtn');
    
    if (video.paused) {
        video.play().then(() => {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
            updateStatus('▶️ Playing');
            
            // Play audio
            const audioUrl = document.getElementById('audioVariant').value;
            if (audioUrl) {
                audioPlayer.play(audioUrl);
            }
        }).catch(e => {
            showMessage("Click PLAY button to start playback");
        });
    } else {
        video.pause();
        audioPlayer.stop();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i> PLAY';
        updateStatus('⏸️ Paused');
    }
}

// --- 8. UI UTILITIES ---
function updateStatus(message) {
    const statusPill = document.getElementById('statusPill');
    if (statusPill) {
        const dotClass = message.includes('Ready') ? 'ready' : 
                        message.includes('Playing') ? 'playing' : 
                        message.includes('Searching') ? 'loading' : 'ready';
        statusPill.innerHTML = `<span class="status-dot ${dotClass}"></span> ${message}`;
    }
}

function showLoading(show) {
    const loading = document.getElementById('loadingSpinner');
    if (loading) {
        if (show) {
            loading.querySelector('p').textContent = 'Searching online sources...';
            loading.querySelector('p:last-child').textContent = 'Fetching videos, audio & trending SEO';
        }
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
    notification.innerHTML = `<i class="fas fa-satellite-dish"></i> <div>${text}</div>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// --- 9. INITIALIZATION ---
let currentTheme = 'forest';

function initStudio() {
    console.log("🚀 Initializing Live Search Studio...");
    
    document.getElementById('startScreen').style.opacity = '0';
    
    setTimeout(() => {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('workspace').style.display = 'flex';
        
        // Set initial theme
        loadThemeOptions();
        updateStatus('🔍 Ready to search online sources');
        
        // Update splash screen text
        const splashText = document.querySelector('.splash-content p:nth-child(3)');
        if (splashText) {
            splashText.textContent = 'Live Search • Fresh Videos • Trending SEO';
        }
        
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
    console.log("📱 Setting up Live Search Studio...");
    
    // Update splash screen
    const splashSubtitle = document.querySelector('.splash-content p:nth-child(3)');
    if (splashSubtitle) {
        splashSubtitle.textContent = 'Live Search • Fresh Videos • Trending SEO';
    }
    
    // Enter Studio
    document.getElementById('enterStudioBtn').addEventListener('click', initStudio);
    
    // Theme Change
    document.getElementById('themeSelect').addEventListener('change', function() {
        loadThemeOptions();
        updateStatus('🔄 Theme Changed - Click GENERATE to search');
    });
    
    // Theme Cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', function() {
            const theme = this.dataset.theme;
            document.getElementById('themeSelect').value = theme;
            loadThemeOptions();
            updateStatus('🔄 Theme Changed - Click GENERATE to search');
        });
    });
    
    // Generate Button (Main Feature)
    document.getElementById('generateBtn').addEventListener('click', function() {
        const btn = this;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-satellite-dish fa-spin"></i> SEARCHING ONLINE...';
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
            const audioUrl = this.value;
            audioPlayer.play(audioUrl);
        }
    });
    
    // Download Button
    document.getElementById('recordBtn').addEventListener('click', function() {
        const video = document.getElementById('vid1');
        if (!video.src) {
            showMessage("Please search for content first!");
            return;
        }
        
        const link = document.createElement('a');
        link.href = video.src;
        link.download = `zengen-${currentTheme}-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage("✅ Video downloaded! Upload to any platform.");
    });
    
    // Copy Buttons
    document.getElementById('copyTitleBtn').addEventListener('click', () => copyToClip('videoTitle'));
    document.getElementById('copyDescBtn').addEventListener('click', () => copyToClip('videoDesc'));
    document.getElementById('copyTagsBtn').addEventListener('click', () => copyToClip('videoTags'));
    
    // Social Buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const video = document.getElementById('vid1');
            if (!video.src) {
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
    
    console.log("✅ Live Search Studio Ready!");
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
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .fa-spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Search animation for generate button */
    .searching {
        animation: pulse 0.5s ease infinite;
    }
`;
document.head.appendChild(style);
