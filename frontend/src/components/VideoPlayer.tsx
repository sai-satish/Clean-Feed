
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onError?: (error: any) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  className,
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  onLoadStart,
  onLoadedData,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      // Reset state when src changes
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoadedData?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    console.error('Video error:', error);
    onError?.(error);
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className={cn(
          "object-cover w-full h-full",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        controls={controls}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onError={(e) => handleError(e)}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <LoadingSpinner size="lg" className="border-white" />
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="text-center text-white bg-black/50 p-3 rounded">
            <p>Failed to load video</p>
            <button 
              className="mt-2 px-3 py-1 bg-reelverse-primary rounded"
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(error => console.error('Play error:', error));
                }
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
