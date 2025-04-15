import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/Avatar';
import { Video, Bookmark, Settings, LogOut, Info, Play, Pause, Tag, Calendar, Volume2, VolumeX } from 'lucide-react';
import { formatNumber } from '@/constants/formatters';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import VideoContainer from '@/components/VideoContainer';

// Define types for our reels data
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

// Separate ProfileHeader component to prevent re-renders
const ProfileHeader = React.memo(({
  user,
  reelsCount,
  handleLogout,
  navigate
}: {
  user: any,
  reelsCount: number,
  handleLogout: () => void,
  navigate: (path: string) => void
}) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar src={user.profilePic || "https://www.citypng.com/public/uploads/preview/download-profile-user-round-purple-icon-symbol-png-701751695033518isbhujfjbf.png?v=2025040705"} alt={user.name} size="xl" border />

          <div>
            <h1 className="text-xl font-bold">{user.username}</h1>
            <p className="text-muted-foreground">{user.name}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-foreground"
        >
          <LogOut size={20} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <p className="font-bold">{formatNumber(reelsCount)}</p>
          <p className="text-xs text-muted-foreground">Reels</p>
        </div>
        <div>
          <p className="font-bold">{formatNumber(1250)}</p>
          <p className="text-xs text-muted-foreground">Followers</p>
        </div>
        <div>
          <p className="font-bold">{formatNumber(450)}</p>
          <p className="text-xs text-muted-foreground">Following</p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <Button
          className="flex-1 bg-purple-gradient hover:opacity-90 transition-opacity"
          onClick={() => navigate('/upload')}
        >
          Upload Reel
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {}}
        >
          <Settings size={16} className="mr-2" />
          Edit Profile
        </Button>
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';

// Separate TabSelector component
const TabSelector = React.memo(({
  activeTab,
  setActiveTab
}: {
  activeTab: string,
  setActiveTab: (tab: string) => void
}) => {
  return (
    <div className="flex mt-2">
      <button
        className={`flex-1 py-3 flex justify-center ${activeTab === 'reels' ? 'text-foreground border-b-2 border-reelverse-primary' : 'text-muted-foreground'}`}
        onClick={() => setActiveTab('reels')}
      >
        <Video size={20} />
      </button>
      <button
        className={`flex-1 py-3 flex justify-center ${activeTab === 'saved' ? 'text-foreground border-b-2 border-reelverse-primary' : 'text-muted-foreground'}`}
        onClick={() => setActiveTab('saved')}
      >
        <Bookmark size={20} />
      </button>
    </div>
  );
});

TabSelector.displayName = 'TabSelector';

// Separate EmptyState component
const EmptyState = React.memo(({
  type,
  navigate
}: {
  type: 'reels' | 'saved',
  navigate?: (path: string) => void
}) => {
  if (type === 'reels') {
    return (
      <div className="py-12 text-center">
        <Video size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4">
          No reels found
        </p>
        <Button
          onClick={() => navigate && navigate('/upload')}
          className="bg-purple-gradient hover:opacity-90 transition-opacity"
        >
          Upload Your First Reel
        </Button>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <Bookmark size={48} className="mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground mb-2">
        No saved items found
      </p>
      <p className="text-sm text-muted-foreground">
        Items you save will appear here
      </p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// Individual ReelItem component to prevent re-renders of the entire grid
const ReelItem = React.memo(({
  reel,
  isMuted,
  playingReel,
  togglePlay,
  toggleMute,
  toggleDetails,
  toggleExpandReel,
  videoRefs,
  showDetails,
  setProgress
}: {
  reel: Reel,
  isMuted: boolean,
  playingReel: string | null,
  togglePlay: (reelId: string) => void,
  toggleMute: (e: React.MouseEvent) => void,
  toggleDetails: (reelId: string, e: React.MouseEvent) => void,
  toggleExpandReel: (reelId: string, e: React.MouseEvent) => void,
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>,
  showDetails: string | null,
  setProgress: (reelId: string, progress: number) => void
}) => {
  return (
    <div
      className="aspect-[9/16] bg-black/10 relative rounded-md overflow-hidden"
      data-reel-id={reel._id}
    >
      <VideoContainer
        videoUrl={reel.videoUrl}
        reelId={reel._id}
        isMuted={isMuted}
        playingReel={playingReel}
        togglePlay={togglePlay}
        toggleMute={toggleMute}
        toggleDetails={toggleDetails}
        toggleExpandReel={toggleExpandReel}
        videoRefs={videoRefs}
        showDetails={showDetails}
        setProgress={setProgress}
        reel={reel}
      />
    </div>
  );
});

ReelItem.displayName = 'ReelItem';

// Timeline component for expanded view
const Timeline = React.memo(({
  reelId,
  progress,
  handleSeek,
  timelineRefs
}: {
  reelId: string,
  progress: { [key: string]: number },
  handleSeek: (reelId: string, e: React.MouseEvent<HTMLDivElement>) => void,
  timelineRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
}) => {
  return (
    <div
      ref={el => timelineRefs.current[reelId] = el}
      className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer"
      onClick={(e) => handleSeek(reelId, e)}
    >
      <div
        className="h-full bg-white rounded-full"
        style={{ width: `${progress[reelId] || 0}%` }}
      ></div>
    </div>
  );
});

Timeline.displayName = 'Timeline';

// ExpandedReelControls component
const ExpandedReelControls = React.memo(({
  reelId,
  playingReel,
  videoRefs,
  isMuted,
  togglePlay,
  toggleMute,
  formatTime
}: {
  reelId: string,
  playingReel: string | null,
  videoRefs: React.MutableRefObject<{ [key: string]: HTMLVideoElement | null }>,
  isMuted: boolean,
  togglePlay: (reelId: string) => void,
  toggleMute: (e: React.MouseEvent) => void,
  formatTime: (timeInSeconds: number) => string
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <button
          className="bg-black/30 hover:bg-black/50 rounded-full p-2 text-white mr-2"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay(reelId);
          }}
        >
          {playingReel === reelId && !videoRefs.current[reelId]?.paused ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>

        {videoRefs.current[reelId] && (
          <span className="text-sm text-white">
            {formatTime(videoRefs.current[reelId]?.currentTime || 0)} / {formatTime(videoRefs.current[reelId]?.duration || 0)}
          </span>
        )}
      </div>

      <button
        className="bg-black/30 hover:bg-black/50 rounded-full p-2 text-white"
        onClick={(e) => {
          e.stopPropagation();
          toggleMute(e);
        }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
});

ExpandedReelControls.displayName = 'ExpandedReelControls';

// Main Profile component
const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('reels');
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingReel, setPlayingReel] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [expandedReel, setExpandedReel] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const timelineRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  // Disable body scroll when expanded view is active
  useEffect(() => {
    if (expandedReel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup function to ensure scroll is restored
    return () => {
      document.body.style.overflow = '';
    };
  }, [expandedReel]);

  // Format time for video progress display (mm:ss)
  const formatTime = useCallback((timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Fetch reels from the backend
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true);
        // Get the authentication token
        const token = localStorage.getItem('token');

        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please login again",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        const response = await axios.post(
          `http://localhost:8000/reels/`,
          {},  // Empty body for POST request
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setReels(response.data.reels || []);
      } catch (error) {
        console.error('Error fetching reels:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your reels",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'reels') {
      fetchReels();
    }
  }, [activeTab, navigate, toast]);

  const handleLogout = useCallback(() => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/login');
  }, [logout, toast, navigate]);

  const togglePlay = useCallback((reelId: string) => {
    const videoElement = videoRefs.current[reelId];
    if (!videoElement) return;

    if (playingReel === reelId) {
      if (videoElement.paused) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
    } else {
      // Pause any currently playing video
      if (playingReel && videoRefs.current[playingReel]) {
        videoRefs.current[playingReel]?.pause();
      }

      setPlayingReel(reelId);
      videoElement.play();
    }
  }, [playingReel]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);

    // Apply mute/unmute to all videos
    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
  }, [isMuted]);

  const toggleDetails = useCallback((reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(prev => prev === reelId ? null : reelId);
  }, []);

  const toggleExpandReel = useCallback((reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (expandedReel === reelId) {
      setExpandedReel(null);
    } else {
      setExpandedReel(reelId);
      // Ensure video is playing when expanded
      setPlayingReel(reelId);
      videoRefs.current[reelId]?.play();
    }
  }, [expandedReel]);

  const handleSetProgress = useCallback((reelId: string, newProgress: number) => {
    setProgress(prev => ({
      ...prev,
      [reelId]: newProgress
    }));
  }, []);

  const handleSeek = useCallback((reelId: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const videoElement = videoRefs.current[reelId];
    const timelineElement = timelineRefs.current[reelId];

    if (!videoElement || !timelineElement) return;

    const rect = timelineElement.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;

    // For Vimeo videos, the play method might be overridden
    if (videoElement.currentTime !== undefined) {
      // Handle native video element for Cloudinary
      videoElement.currentTime = percentage * videoElement.duration;
    } else {
      // For Vimeo, we need to use the SDK
      const isVimeoUrl = reels.find(r => r._id === reelId)?.videoUrl.includes('vimeo.com');
      if (isVimeoUrl && window.Vimeo?.Player) {
        const iframe = document.querySelector(`[data-reel-id="${reelId}"] iframe`);
        if (iframe) {
          const player = new window.Vimeo.Player(iframe);
          player.getDuration().then((duration: number) => {
            player.setCurrentTime(percentage * duration);
          });
        }
      }
    }

    setProgress(prev => ({
      ...prev,
      [reelId]: percentage * 100
    }));
  }, [reels]);

  // Find the expanded reel data if needed
  const expandedReelData = useMemo(() =>
    expandedReel ? reels.find(r => r._id === expandedReel) : undefined
  , [expandedReel, reels]);

  if (!user) return null;

  return (
    <div className="app-container">
      <Header />

      <main className="page-container">
        <ProfileHeader
          user={user}
          reelsCount={reels.length}
          handleLogout={handleLogout}
          navigate={navigate}
        />

        <div className="border-t border-border">
          <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="mt-4">
            {activeTab === 'reels' && (
              <>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-reelverse-primary" />
                  </div>
                ) : reels.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 px-4">
                    {reels.map((reel) => (
                      <ReelItem
                        key={reel._id}
                        reel={reel}
                        isMuted={isMuted}
                        playingReel={playingReel}
                        togglePlay={togglePlay}
                        toggleMute={toggleMute}
                        toggleDetails={toggleDetails}
                        toggleExpandReel={toggleExpandReel}
                        videoRefs={videoRefs}
                        showDetails={showDetails}
                        setProgress={handleSetProgress}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState type="reels" navigate={navigate} />
                )}
              </>
            )}

            {activeTab === 'saved' && (
              <EmptyState type="saved" />
            )}
          </div>
        </div>
      </main>

      {/* Expanded Fullscreen Modal */}
      {expandedReel && expandedReelData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 overflow-y-auto">
          <div className="relative w-full max-w-lg aspect-[9/16] my-4">
            {/* Close button positioned at top-right */}
            <button
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white"
              onClick={() => setExpandedReel(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Video and controls */}
            <div className="h-full w-full" data-reel-id={expandedReel}>
              <VideoContainer
                videoUrl={expandedReelData.videoUrl}
                reelId={expandedReel}
                isMuted={isMuted}
                playingReel={playingReel}
                togglePlay={togglePlay}
                toggleMute={toggleMute}
                toggleDetails={toggleDetails}
                toggleExpandReel={toggleExpandReel}
                videoRefs={videoRefs}
                showDetails={showDetails}
                isExpanded={true}
                setProgress={handleSetProgress}
                reel={expandedReelData}
              />

              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <Timeline
                  reelId={expandedReel}
                  progress={progress}
                  handleSeek={handleSeek}
                  timelineRefs={timelineRefs}
                />

                <ExpandedReelControls
                  reelId={expandedReel}
                  playingReel={playingReel}
                  videoRefs={videoRefs}
                  isMuted={isMuted}
                  togglePlay={togglePlay}
                  toggleMute={toggleMute}
                  formatTime={formatTime}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;