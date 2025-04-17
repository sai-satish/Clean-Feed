import React, { useEffect, useRef } from 'react';

interface CloudinaryVideoProps {
  videoUrl: string;
  isMuted: boolean;
  isPlaying: boolean;
  onTimeUpdate?: (time: number, duration: number) => void;
  onRef?: (ref: HTMLVideoElement | null) => void;
}

const CloudinaryVideo: React.FC<CloudinaryVideoProps> = ({
  videoUrl,
  isMuted,
  isPlaying,
  onTimeUpdate,
  onRef
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const parseCloudinaryUrl = (url: string) => {
    const match = url.match(/https:\/\/res\.cloudinary\.com\/([^\/]+)\/video\/upload\/(?:v\d+\/)?(.+)$/);
    return match ? { cloudName: match[1], videoId: match[2] } : { cloudName: '', videoId: '' };
  };

  const { cloudName, videoId } = parseCloudinaryUrl(videoUrl);

  useEffect(() => {
    if (videoRef.current && onRef) {
      onRef(videoRef.current);
    }

    return () => {
      if (onRef) onRef(null);
    };
  }, [onRef]);

  // Handle time updates for progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (onTimeUpdate && video) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onTimeUpdate]);

  // Handle mute/unmute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(error => {
        console.error('Failed to play video:', error);
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls
        muted={isMuted}
        playsInline
        src={videoUrl}
        controlsList="nodownload"
      />
    </div>
  );
};

export default CloudinaryVideo;