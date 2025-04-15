import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Info } from 'lucide-react';

interface CloudinaryVideoProps {
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

const CloudinaryVideo: React.FC<CloudinaryVideoProps> = React.memo(({
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Format Cloudinary URL to ensure proper video playback
  const formattedVideoUrl = useMemo(() => {
    if (videoUrl.includes('f_auto') || videoUrl.includes('q_auto')) {
      return videoUrl;
    }
    const separator = videoUrl.includes('?') ? '&' : '?';
    return `${videoUrl}${separator}f_auto,q_auto`;
  }, [videoUrl]);

  // Register the video element with the parent's refs
  useEffect(() => {
    if (videoRef.current) {
      videoRefs.current[reelId] = videoRef.current;
    }

    return () => {
      videoRefs.current[reelId] = null;
    };
  }, [reelId, videoRefs]);

  // Update progress when playing
  useEffect(() => {
    if (!videoRef.current || !setProgress) return;

    const updateProgress = () => {
      const video = videoRef.current;
      if (video && !isNaN(video.duration)) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(reelId, currentProgress);
      }
    };

    const videoElement = videoRef.current;
    videoElement.addEventListener('timeupdate', updateProgress);

    return () => {
      videoElement?.removeEventListener('timeupdate', updateProgress);
    };
  }, [reelId, setProgress]);

  // Handle play state changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (playingReel === reelId) {
      if (videoElement.paused) {
        // Only attempt to play if the video is currently paused
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Play error:", error);
          });
        }
      }
    } else {
      // Only pause if currently playing
      if (!videoElement.paused) {
        videoElement.pause();
      }
    }
  }, [playingReel, reelId]);

  // Handle mute state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Event handlers with useCallback to prevent unnecessary re-creations
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

  const handleVideoClick = useCallback(() => {
    togglePlay(reelId);
  }, [reelId, togglePlay]);

  return (
    <>
      <video
        ref={videoRef}
        src={formattedVideoUrl}
        className="w-full h-full object-cover rounded-md"
        preload="metadata"
        playsInline
        muted={isMuted}
        loop
        autoPlay={isExpanded}
        onClick={handleVideoClick}
      />

      <div className="absolute inset-0 flex flex-col justify-between p-2" onClick={(e) => e.stopPropagation()}>
        {/* Top controls */}
        <div className="flex justify-between">
          <div className="flex-1"></div>
          <button
            className="bg-black/30 hover:bg-black/50 rounded-full p-1 text-white"
            onClick={handleInfoClick}
          >
            <Info size={16} />
          </button>
        </div>

        {/* Center play/pause button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {playingReel === reelId && videoRef.current?.paused && (
            <div className="bg-black/30 hover:bg-black/50 rounded-full p-3 text-white">
              <Play size={24} />
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center">
            <button
              className="bg-black/30 hover:bg-black/50 rounded-full p-1 text-white"
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
              className="bg-black/30 hover:bg-black/50 rounded-full p-2 text-white"
              onClick={handleMuteClick}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

CloudinaryVideo.displayName = 'CloudinaryVideo';

export default CloudinaryVideo;