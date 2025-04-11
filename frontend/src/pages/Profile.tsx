
import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/Avatar';
import { Grid, Video, Bookmark, Settings, LogOut } from 'lucide-react';
import { generateFeed } from '@/constants/feedGenerator';
import { formatNumber } from '@/constants/formatters';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  
  // Generate some mock content for the profile
  const userPosts = generateFeed().slice(0, 9);
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/login');
  };
  
  if (!user) return null;
  
  return (
    <div className="app-container">
      <Header />
      
      <main className="page-container">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar src={user.profilePic} alt={user.name} size="xl" border />
              
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
              <p className="font-bold">{formatNumber(userPosts.length)}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
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
          
          <div className="border-t border-border">
            <div className="flex mt-2">
              <button
                className={`flex-1 py-3 flex justify-center ${activeTab === 'posts' ? 'text-foreground border-b-2 border-reelverse-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('posts')}
              >
                <Grid size={20} />
              </button>
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
            
            <div className="mt-4">
              {activeTab === 'posts' && (
                <div className="grid grid-cols-3 gap-1">
                  {userPosts.map((post, index) => (
                    <div key={index} className="aspect-square bg-muted relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Post {index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'reels' && (
                <div className="grid grid-cols-3 gap-1">
                  {userPosts.slice(0, 6).map((post, index) => (
                    <div key={index} className="aspect-[9/16] bg-muted relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video size={24} className="text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'saved' && (
                <div className="py-8 text-center">
                  <Bookmark size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Items you save will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Profile;
