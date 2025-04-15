import React, { useCallback, useMemo } from 'react';
import CloudinaryVideo from './CloudinaryVideo';
import VimeoVideo from './VimeoVideo';
import { Tag, Calendar, Info, Users } from 'lucide-react';

// Define the Reel interface
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
  setProgress?: (reelId: string, progress: number) => void;
  reel?: Reel; // Properly typed reel data
}

const VideoContainer: React.FC<VideoContainerProps> = React.memo((props) => {
  const {
    videoUrl,
    reelId,
    showDetails,
    toggleDetails,
    reel
  } = props;

  // Memoized check for Vimeo URLs to prevent unnecessary re-evaluation
  const isVimeoUrl = useMemo(() => {
    return videoUrl.includes('vimeo.com') || videoUrl.includes('player.vimeo.com');
  }, [videoUrl]);

  // Handle clicks on the details overlay to prevent propagation
  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't call toggleDetails here to prevent re-render loop
  }, []);

  // Memoize the video component to prevent unnecessary re-renders
  const VideoComponent = useMemo(() => {
    return isVimeoUrl ? (
      <VimeoVideo {...props} />
    ) : (
      <CloudinaryVideo {...props} />
    );
  }, [isVimeoUrl, props]);

  // Memoize the details overlay to prevent unnecessary re-renders
  const DetailsOverlay = useMemo(() => {
    if (showDetails !== reelId) return null;

    return (
      <div
        className="absolute inset-0 bg-black/75 text-white p-3 overflow-y-auto z-10"
        onClick={handleDetailsClick}
      >
        {reel ? (
          <>
            {reel.caption && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">Caption</h3>
                <p>{reel.caption}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-bold mb-2 flex items-center">
                <Users size={16} className="mr-1" /> Age Group
              </h3>
              <div className="bg-white/20 text-sm px-2 py-1 rounded inline-block">
                {reel.age_group}
              </div>
            </div>

            {reel.genres && reel.genres.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2 flex items-center">
                  <Info size={16} className="mr-1" /> Genres
                </h3>
                <div className="flex flex-wrap gap-1">
                  {reel.genres.map((genre: string, index: number) => (
                    <span key={index} className="bg-white/20 text-xs px-2 py-1 rounded">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reel.tags && reel.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2 flex items-center">
                  <Tag size={16} className="mr-1" /> Tags
                </h3>
                <div className="flex flex-wrap gap-1">
                  {reel.tags.map((tag: string, index: number) => (
                    <span key={index} className="bg-white/20 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reel.created_at && (
              <div className="flex items-center text-sm text-white/70 mb-4">
                <Calendar size={14} className="mr-1" />
                {new Date(reel.created_at).toLocaleDateString()}
              </div>
            )}

            <button
              className="mt-4 bg-white/20 hover:bg-white/30 text-white rounded-full py-2 px-4 w-full"
              onClick={(e) => {
                e.stopPropagation();
                toggleDetails(reelId, e);
              }}
            >
              Close Details
            </button>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p>No details available</p>
          </div>
        )}
      </div>
    );
  }, [showDetails, reelId, reel, handleDetailsClick, toggleDetails]);

  return (
    <div className="relative w-full h-full">
      {VideoComponent}
      {DetailsOverlay}
    </div>
  );
});

VideoContainer.displayName = 'VideoContainer';

export default VideoContainer;