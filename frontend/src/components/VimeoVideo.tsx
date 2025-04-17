import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation to check the current path

interface VimeoVideoProps {
  videoUrl: string;
  isMuted: boolean;
  isPlaying: boolean;
  onTimeUpdate?: (time: number, duration: number) => void;
  onRef?: (ref: HTMLIFrameElement | null) => void;
}

const VimeoVideo: React.FC<VimeoVideoProps> = ({
  videoUrl,
  isMuted: propIsMuted,
  isPlaying: propIsPlaying,
  onTimeUpdate,
  onRef
}) => {
  const location = useLocation(); // Get current location
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef(null);

  // Local state to handle autoplay logic
  const [isReelsPage, setIsReelsPage] = useState(false);
  const [isMuted, setIsMuted] = useState(propIsMuted);
  const [isPlaying, setIsPlaying] = useState(propIsPlaying);

  // Extract Vimeo ID from URL
  const getVimeoId = (url: string): string => {
    const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    return match ? match[1] : '';
  };

  const vimeoId = getVimeoId(videoUrl);

  // Check if we're on the /reels page
  useEffect(() => {
    const isOnReelsPage = location.pathname === "/reels";
    setIsReelsPage(isOnReelsPage);

    // If we're on the reels page, we should mute and autoplay
    if (isOnReelsPage) {
      setIsMuted(true); // Ensure muted for autoplay
      setIsPlaying(true); // Set to autoplay
    } else {
      // Otherwise use the props
      setIsMuted(propIsMuted);
      setIsPlaying(propIsPlaying);
    }
  }, [location.pathname, propIsMuted, propIsPlaying]);

  useEffect(() => {
    // Initialize Vimeo player when iframe is ready
    const loadVimeoPlayer = () => {
      if (iframeRef.current && window.Vimeo && !playerRef.current) {
        playerRef.current = new window.Vimeo.Player(iframeRef.current);

        // Set up event listeners
        playerRef.current.on('timeupdate', (data: { seconds: number, duration: number }) => {
          if (onTimeUpdate) {
            onTimeUpdate(data.seconds, data.duration);
          }
        });

        // Apply initial state for autoplay
        if (isReelsPage) {
          playerRef.current.setMuted(true);
          playerRef.current.play().catch((error: any) => {
            console.error('Vimeo autoplay error:', error);
          });
        }

        // Call onRef callback if provided
        if (onRef && iframeRef.current) {
          onRef(iframeRef.current);
        }
      }
    };

    // Load Vimeo Player API if it's not already loaded
    if (!window.Vimeo) {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;
      script.onload = loadVimeoPlayer;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else {
      loadVimeoPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.off('timeupdate');
      }
    };
  }, [videoUrl, onRef, isReelsPage]);

  // Handle mute/unmute
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setMuted(isMuted);
    }
  }, [isMuted]);

  // Handle play/pause
  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.play().catch((error: any) => {
          console.error('Vimeo play error:', error);
        });
      } else {
        playerRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Add autoplay parameter to the iframe URL for reels page
  const autoplayParam = isReelsPage ? '&autoplay=1&muted=1' : '';

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full">
        <iframe
          ref={iframeRef}
          src={`https://player.vimeo.com/video/${vimeoId}?h=e4842baf4a&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479${autoplayParam}`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          className="absolute top-0 left-0 w-full h-full"
          title="Vimeo video player"
        />
      </div>
    </div>
  );
};

export default VimeoVideo;

// Add global type definition for Vimeo Player API
declare global {
  interface Window {
    Vimeo?: {
      Player: any;
    };
  }
}