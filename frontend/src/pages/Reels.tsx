import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Volume2, VolumeX, Loader2 } from 'lucide-react';
import VideoContainer from '@/components/VideoContainer';
import axios from 'axios';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

interface User {
  name: string;
  email: string;
  profilePic?: string;
}

interface Reel {
  _id: string;
  videoUrl: string;
  age_group: string;
  tags: string[];
  genres: string[];
  userId: string;
  user: User;
  caption?: string;
  created_at?: string;
}

interface ReelsResponse {
  reels: Reel[];
  count: number;
}

// Key for storing reels in localStorage
const REELS_STORAGE_KEY = 'cached_reels_data';

const Reels: React.FC = () => {
  // Refs
  const reelsContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // States
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playingReel, setPlayingReel] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  // Fetch reels data from localStorage or backend
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true);

        // Try to get data from localStorage first
        const cachedReels = localStorage.getItem(REELS_STORAGE_KEY);
        if (cachedReels) {
          const parsedReels = JSON.parse(cachedReels);
          setReels(parsedReels.reels);
          setLoading(false);
          setError(null);
          console.log('Loaded reels from localStorage');
          return;
        }

        // If no cached data, fetch from backend
        const response = await axios.get<ReelsResponse>('http://localhost:8000/reels/all');
        setReels(response.data.reels);

        // Cache the fetched data
        localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(response.data));
        console.log('Fetched reels from API and cached');

        setError(null);
      } catch (err) {
        console.error('Error fetching reels:', err);
        setError('Failed to load reels. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  // Current active reel
  const currentReel = reels[activeReelIndex];

  // Handle setting progress of video
  const handleSetProgress = useCallback((reelId: string, currentProgress: number) => {
    setProgress(prev => ({
      ...prev,
      [reelId]: currentProgress
    }));
  }, []);

  // Handle navigation to next/prev reel
  const navigateReel = useCallback((direction: 'up' | 'down') => {
    const nextIndex = direction === 'down'
      ? Math.min(activeReelIndex + 1, reels.length - 1)
      : Math.max(activeReelIndex - 1, 0);

    if (nextIndex !== activeReelIndex) {
      setActiveReelIndex(nextIndex);
      if (reels[nextIndex]) {
        setPlayingReel(reels[nextIndex]._id);
      }
    }
  }, [activeReelIndex, reels]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        navigateReel('down');
      } else if (e.key === 'ArrowUp') {
        navigateReel('up');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateReel]);

  // Auto-play the first reel when data is loaded
  useEffect(() => {
    if (reels.length > 0 && !playingReel) {
      setPlayingReel(reels[0]._id);
    }
  }, [reels, playingReel]);

  // Toggle play/pause for a reel
  const togglePlay = useCallback((reelId: string) => {
    setPlayingReel(prev => (prev === reelId ? null : reelId));
  }, []);

  // Toggle mute for all videos
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  }, []);

  // Toggle reel details
  const toggleDetails = useCallback((reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(prev => (prev === reelId ? null : reelId));
  }, []);

  // Toggle expand reel - placeholder for potential future expansion
  const toggleExpandReel = useCallback((reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Implementation for expanding a reel could go here
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
          <p className="text-white">Loading reels...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="bg-red-800/50 p-6 rounded-lg max-w-md text-center">
          <p className="text-white text-lg mb-2">😕 {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-100 transition-colors mt-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (reels.length === 0) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="bg-gray-800/50 p-6 rounded-lg max-w-md text-center">
          <p className="text-white text-lg">No reels found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header/>

      <main className="page-container">
        <div className="h-screen w-full bg-black flex items-center justify-center">
          <div
            ref={reelsContainerRef}
            className="relative h-full max-h-[calc(100vh-80px)] max-w-md w-full bg-black overflow-hidden"
          >
            {/* Current Reel */}
            {currentReel && (
              <div className="relative h-full w-full">
                <VideoContainer
                  videoUrl={currentReel.videoUrl}
                  reelId={currentReel._id}
                  isMuted={isMuted}
                  playingReel={playingReel}
                  togglePlay={togglePlay}
                  toggleMute={toggleMute}
                  toggleDetails={toggleDetails}
                  toggleExpandReel={toggleExpandReel}
                  videoRefs={videoRefs}
                  showDetails={showDetails}
                  setProgress={handleSetProgress}
                  reel={currentReel}
                />

                {/* Navigation Controls */}
                <div className="absolute right-4 bottom-24 flex flex-col space-y-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateReel('up');
                    }}
                    className={`p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors ${activeReelIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                    disabled={activeReelIndex === 0}
                  >
                    <ChevronUp className="text-white" size={24} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateReel('down');
                    }}
                    className={`p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors ${activeReelIndex === reels.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                    disabled={activeReelIndex === reels.length - 1}
                  >
                    <ChevronDown className="text-white" size={24} />
                  </button>
                </div>

                {/* Sound Toggle */}
                <button
                  onClick={toggleMute}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="text-white" size={20} />
                  ) : (
                    <Volume2 className="text-white" size={20} />
                  )}
                </button>

                {/* Progress Bar */}
                <div className="absolute bottom-16 left-0 w-full bg-gray-700/50 h-1">
                  <div
                    className="bg-white h-full transition-all"
                    style={{ width: `${progress[currentReel._id] || 0}%` }}
                  />
                </div>

                {/* User Info */}
                <div className="absolute bottom-4 left-4 right-12 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-white">
                    <img
                      src={currentReel.user.profilePic || "https://www.citypng.com/public/uploads/preview/download-profile-user-round-purple-icon-symbol-png-701751695033518isbhujfjbf.png?v=2025040705"}
                      alt={currentReel.user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.citypng.com/public/uploads/preview/download-profile-user-round-purple-icon-symbol-png-701751695033518isbhujfjbf.png?v=2025040705";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">{currentReel.user.name}</h3>
                    <p className="text-gray-300 text-xs truncate">
                      {currentReel.caption || currentReel.tags.slice(0, 2).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reel Count Indicator */}
            <div className="absolute top-4 left-4 bg-black/40 px-3 py-1 rounded-full">
              {/* <span className="text-white text-xs font-medium">
                {activeReelIndex + 1}/{reels.length}
              </span> */}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Reels;