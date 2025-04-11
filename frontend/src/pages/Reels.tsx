
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { generateFeed } from '@/constants/feedGenerator';
import { formatNumber } from '@/constants/formatters';
import LoadingSpinner from '@/components/LoadingSpinner';
import Avatar from '@/components/Avatar';
import { Heart, MessageCircle, Send, Bookmark, Music } from 'lucide-react';
import VimeoPlayer from '@/components/VimeoPlayer';
import { useIsMobile } from '@/hooks/use-mobile';

const Reels = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [reels, setReels] = useState(generateFeed());
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const currentReel = reels[currentIndex];
  
  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  return (
    <div className="app-container">
      <Header showActions={false} className="bg-transparent border-none absolute top-0 left-0 right-0 z-10" />
      
      <main className="page-container bg-black">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="lg" className="border-white" />
          </div>
        ) : (
          <div className="h-full relative">
            {/* Video Content */}
            <div className="h-full flex items-center justify-center">
              <VimeoPlayer videoId={currentReel.videoId} className="w-full max-w-md mx-auto" />
            </div>
            
            {/* Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-end justify-between">
                <div className="space-y-3 max-w-[75%]">
                  <div className="flex items-center gap-2">
                    <Avatar src={currentReel.user.profilePic} alt={currentReel.user.name} size="sm" border />
                    <span className="text-white font-medium">{currentReel.user.username}</span>
                  </div>
                  
                  <p className="text-white text-sm line-clamp-2">
                    {currentReel.caption}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Music size={14} className="text-white" />
                    <p className="text-white/80 text-xs">
                      Original Audio • {currentReel.user.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-6 items-center">
                  <button className="text-white">
                    <Heart size={28} />
                    <p className="text-xs mt-1">{formatNumber(currentReel.likes)}</p>
                  </button>
                  
                  <button className="text-white">
                    <MessageCircle size={28} />
                    <p className="text-xs mt-1">{formatNumber(currentReel.comments)}</p>
                  </button>
                  
                  <button className="text-white">
                    <Send size={28} />
                  </button>
                  
                  <button className="text-white">
                    <Bookmark size={28} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div 
              className="absolute top-0 left-0 w-1/3 h-full" 
              onClick={handlePrevious} 
            />
            <div 
              className="absolute top-0 right-0 w-1/3 h-full" 
              onClick={handleNext} 
            />
            
            {/* Progress Indicator */}
            <div className="absolute top-20 left-0 right-0 flex gap-1 px-2">
              {reels.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1 rounded-full flex-1 ${index === currentIndex ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Reels;
