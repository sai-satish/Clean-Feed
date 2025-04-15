import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Info } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface VimeoVideoProps {
  videoUrl: string;
  reelId: string;
  isMuted: boolean;
  playingReel: string | null;
  togglePlay: (reelId: string) => void;
  toggleMute: (e: React.MouseEvent) => void;
  toggleDetails: (reelId: string, e: React.MouseEvent) => void;
  toggleExpandReel: (reelId: string, e: React.MouseEvent) => void;
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>;
  isExpanded?: boolean;
  setProgress?: (reelId: string, progress: number) => void;
}

const VimeoVideo: React.FC<VimeoVideoProps> = React.memo(({
  videoUrl,
  reelId,
  isMuted,
  playingReel,
  togglePlay,
  toggleMute,
  toggleDetails,
  toggleExpandReel,
  videoRefs,
  isExpanded = false,
  setProgress
}) => {
  const [isPaused, setIsPaused] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Extract video ID from Vimeo URL
  const videoId = useMemo(() => {
    try {
      const url = new URL(videoUrl);
      if (url.hostname.includes('vimeo.com')) {
        // Handle standard vimeo URLs
        const pathParts = url.pathname.split('/');
        return pathParts[pathParts.length - 1];
      } else if (url.searchParams.has('video_id')) {
        // Handle player.vimeo.com URLs with video_id parameter
        return url.searchParams.get('video_id');
      }
    } catch (error) {
      console.error('Invalid URL format:', videoUrl);
    }
    return '';
  }, [videoUrl]);

  // Construct the embed URL
  const embedUrl = useMemo(() => {
    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=${reelId}&app_id=58479&muted=${isMuted ? 1 : 0}&autoplay=${isExpanded ? 1 : 0}&loop=1&background=${isExpanded ? 0 : 1}`;
  }, [videoId, reelId, isMuted, isExpanded]);

  // Initialize player and set up fake video element for compatibility
  useEffect(() => {
    // Load Vimeo player API if not already available
    if (!window.Vimeo) {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;
      script.onload = initPlayer;
      document.body.appendChild(script);
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (!iframeRef.current) return;

      try {
        // Initialize the Vimeo player
        playerRef.current = new window.Vimeo.Player(iframeRef.current);

        // Create a fake video element for compatibility with parent component
        const fakeVideoElement = document.createElement('video');
        Object.defineProperty(fakeVideoElement, 'paused', {
          get: () => isPaused
        });

        fakeVideoElement.muted = isMuted;

        fakeVideoElement.play = () => {
          if (playerRef.current) {
            playerRef.current.play().catch((error: Error) => {
              console.warn('Vimeo play failed, likely due to autoplay restrictions:', error);
            });
            setIsPaused(false);
          }
          return Promise.resolve();
        };

        fakeVideoElement.pause = () => {
          if (playerRef.current) {
            playerRef.current.pause();
            setIsPaused(true);
          }
          return Promise.resolve();
        };

        // Register events
        playerRef.current.on('play', () => setIsPaused(false));
        playerRef.current.on('pause', () => setIsPaused(true));
        playerRef.current.on('loaded', () => {
          setIsLoaded(true);
          setIsLoading(false);
        });

        if (setProgress) {
          playerRef.current.on('timeupdate', (data: { percent: number }) => {
            setProgress(reelId, data.percent * 100);
          });
        }

        // Register the fake video element
        videoRefs.current[reelId] = fakeVideoElement;
      } catch (error) {
        console.error('Failed to initialize Vimeo player:', error);
        setIsLoading(false);
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.off('play');
        playerRef.current.off('pause');
        playerRef.current.off('loaded');
        playerRef.current.off('timeupdate');
        playerRef.current = null;
      }

      // Clean up fake video reference
      videoRefs.current[reelId] = null;
    };
  }, [reelId, videoRefs, setProgress, isMuted, isPaused]);

  // Handle mute/unmute
  useEffect(() => {
    if (playerRef.current && isLoaded) {
      playerRef.current.setVolume(isMuted ? 0 : 1);
    }
  }, [isMuted, isLoaded]);

  // Handle play/pause when playingReel changes
  useEffect(() => {
    if (!playerRef.current || !isLoaded) return;

    if (playingReel === reelId) {
      if (isPaused) {
        playerRef.current.play().catch((error: Error) => {
          console.warn('Vimeo play failed:', error);
        });
      }
    } else {
      playerRef.current.pause();
    }
  }, [playingReel, reelId, isPaused, isLoaded]);

  // Event handlers with useCallback to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    togglePlay(reelId);
  }, [reelId, togglePlay]);

  const handleInfoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleDetails(reelId, e);
  }, [reelId, toggleDetails]);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpandReel(reelId, e);
  }, [reelId, toggleExpandReel]);

  const handleMuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute(e);
  }, [toggleMute]);

  const handleIframeLoad = useCallback(() => {
    // We still keep this as a backup in case the player events don't fire
    setIsLoading(false);
  }, []);

  // Calculate aspect ratio (default to 16:9 or 9:16 based on context)
  const aspectRatio = isExpanded ? "56.25%" : "177.78%"; // 16:9 (56.25%) or 9:16 (177.78%)

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onClick={handleClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
          <LoadingSpinner size="lg" className="border-white" />
        </div>
      )}

      <div className="relative" style={{ paddingBottom: aspectRatio }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          className="absolute top-0 left-0 w-full h-full"
          title={`Vimeo Video ${reelId}`}
          onLoad={handleIframeLoad}
        />
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
        {/* Top controls */}
        <div className="flex justify-between">
          <div className="flex-1"></div>
          <button
            className="bg-black/30 hover:bg-black/50 rounded-full p-1 text-white pointer-events-auto"
            onClick={handleInfoClick}
          >
            <Info size={16} />
          </button>
        </div>

        {/* Center play/pause button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {playingReel === reelId && isPaused && (
            <div className="bg-black/30 hover:bg-black/50 rounded-full p-3 text-white">
              <Play size={24} />
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center">
            <button
              className="bg-black/30 hover:bg-black/50 rounded-full p-1 text-white pointer-events-auto"
              onClick={handleExpandClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>

            <button
              className="bg-black/30 hover:bg-black/50 rounded-full p-2 text-white pointer-events-auto"
              onClick={handleMuteClick}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VimeoVideo.displayName = 'VimeoVideo';

export default VimeoVideo;