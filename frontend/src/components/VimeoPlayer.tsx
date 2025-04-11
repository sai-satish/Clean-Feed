
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface VimeoPlayerProps {
  videoId: string;
  className?: string;
}

const VimeoPlayer: React.FC<VimeoPlayerProps> = ({ videoId, className }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
          <LoadingSpinner size="lg" className="border-white" />
        </div>
      )}
      
      <div className="relative" style={{ paddingBottom: '177.78%' }}>
        <iframe
          src={`${videoId}`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          className="absolute top-0 left-0 w-full h-full"
          title={`Vimeo Video ${videoId}`}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default VimeoPlayer;
