import React, { useState, useRef, useEffect } from 'react';
import { Info, Play, Pause } from 'lucide-react';
import VimeoVideo from './VimeoVideo';
import CloudinaryVideo from './CloudinaryVideo';

interface Reel {
  _id: string;
  videoUrl: string;
  age_group: string;
  tags: string[];
  genres: string[];
  userId: string;
  caption?: string;
  created_at?: string;
}

interface VideoContainerProps {
  videoUrl: string;
  reelId: string;
  isMuted: boolean;
  playingReel: string | null;
  togglePlay: (reelId: string) => void;
  toggleMute: (e: React.MouseEvent) => void;
  toggleDetails: (reelId: string, e: React.MouseEvent) => void;
  toggleExpandReel: (reelId: string, e: React.MouseEvent) => void;
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>;
  showDetails: string | null;
  isExpanded?: boolean;
  setProgress: (reelId: string, progress: number) => void;
  reel: Reel;
}

const VideoContainer: React.FC<VideoContainerProps> = ({
  videoUrl,
  reelId,
  isMuted,
  playingReel,
  togglePlay,
  toggleMute,
  toggleDetails,
  toggleExpandReel,
  videoRefs,
  showDetails,
  isExpanded = false,
  setProgress,
  reel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVimeo = videoUrl.includes('vimeo.com');
  const isPlaying = playingReel === reelId;

  // Handle time updates from video players
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (duration > 0) {
      const progressPercentage = (currentTime / duration) * 100;
      setProgress(reelId, progressPercentage);
    }
  };

  // Handle video element references
  const handleVideoRef = (element: HTMLVideoElement | HTMLIFrameElement | null) => {
    if (element) {
      // Cast to HTMLVideoElement since we'll only use common properties
      videoRefs.current[reelId] = element as unknown as HTMLVideoElement;
    } else {
      delete videoRefs.current[reelId];
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onClick={() => togglePlay(reelId)}
    >
      {/* Video Player - either Vimeo or Cloudinary */}
      {isVimeo ? (
        <VimeoVideo
          videoUrl={videoUrl}
          isMuted={isMuted}
          isPlaying={isPlaying}
          onTimeUpdate={handleTimeUpdate}
          onRef={handleVideoRef}
        />
      ) : (
        <CloudinaryVideo
          videoUrl={videoUrl}
          isMuted={isMuted}
          isPlaying={isPlaying}
          onTimeUpdate={handleTimeUpdate}
          onRef={handleVideoRef}
        />
      )}

      {/* Play/Pause overlay icon (visible when not expanded) */}
      {/* {!isExpanded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isPlaying ? (
            <div className="bg-black/30 rounded-full p-2 opacity-0">
              <Pause size={24} className="text-white" />
            </div>
          ) : (
            <div className="bg-black/30 rounded-full p-2">
              <Play size={24} className="text-white" />
            </div>
          )}
        </div>
      )} */}

      {/* Controls */}
      {/* <div className="absolute bottom-2 right-2 flex space-x-2">
        {!isExpanded && (
          <button
            className="bg-black/30 hover:bg-black/50 rounded-full p-1 text-white"
            onClick={(e) => toggleExpandReel(reelId, e)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        )}
      </div> */}

      {/* Reel Details Overlay */}
      {showDetails === reelId && (
        <div
          className="absolute inset-0 bg-black/70 p-4 overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation();
            toggleDetails(reelId, e);
          }}
        >
          <div className="text-white">
            <h3 className="font-bold mb-2">Reel Details</h3>

            {reel.caption && (
              <div className="mb-2">
                <p className="text-sm text-gray-300">Caption:</p>
                <p>{reel.caption}</p>
              </div>
            )}

            <div className="mb-2">
              <p className="text-sm text-gray-300">Age Group:</p>
              <p>{reel.age_group}</p>
            </div>

            {reel.tags && reel.tags.length > 0 && (
              <div className="mb-2">
                <p className="text-sm text-gray-300">Tags:</p>
                <div className="flex flex-wrap gap-1">
                  {reel.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-white/20 rounded px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reel.genres && reel.genres.length > 0 && (
              <div className="mb-2">
                <p className="text-sm text-gray-300">Genres:</p>
                <div className="flex flex-wrap gap-1">
                  {reel.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="bg-white/20 rounded px-2 py-1 text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reel.created_at && (
              <div className="mb-2">
                <p className="text-sm text-gray-300">Created:</p>
                <p>{new Date(reel.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoContainer;