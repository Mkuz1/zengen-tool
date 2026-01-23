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
        `
