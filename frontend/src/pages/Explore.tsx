import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { generateFeed } from '@/constants/feedGenerator';

const Explore = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      // Generate 20 post items
      const feed = generateFeed();
      const exploreItems = [];
      
      for (let i = 0; i < 20; i++) {
        exploreItems.push({
          id: i,
          type: i % 5 === 0 ? 'reel' : 'post',
          user: feed[i % feed.length].user
        });
      }
      
      setPosts(exploreItems);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="app-container">
      <Header />
      
      <main className="page-container">
        <div className="p-4">
          <div className="relative mb-4">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          
          {isLoading ? (
            <div className="h-full flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className={`relative ${post.type === 'reel' ? 'aspect-[9/16] row-span-2' : 'aspect-square'} bg-muted overflow-hidden`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {post.type === 'reel' ? (
                      <Video className="text-muted-foreground" />
                    ) : (
                      <div className="text-muted-foreground text-xs">
                        {post.user.username}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

// Placeholder Video component for the Explore page
const Video: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className="flex flex-col items-center">
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
      >
        <polygon points="23 7 16 12 23 17 23 7"></polygon>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
      </svg>
    </div>
  );
};

export default Explore;
