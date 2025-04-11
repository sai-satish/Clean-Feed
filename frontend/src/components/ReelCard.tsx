
import React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import Avatar from './Avatar';
import { Reel, User } from '../constants/types';
import { formatNumber, formatRelativeTime } from '../constants/formatters';
import VimeoPlayer from './VimeoPlayer';

interface ReelCardProps {
  reel: Reel;
  user: User;
}

const ReelCard: React.FC<ReelCardProps> = ({ reel, user }) => {
  return (
    <article className="reel-card animate-fade-in">
      <div className="reel-header">
        <Avatar src={user.profilePic} alt={user.name} size="md" border />
        <div className="flex flex-col">
          <span className="font-semibold">{user.username}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(reel.postedAt)}
          </span>
        </div>
      </div>
      
      {/* Video Content */}
      <div className="relative w-full">
        <VimeoPlayer videoId={reel.videoId} />
      </div>
      
      <div className="reel-footer">
        <div className="flex justify-between mb-3">
          <div className="flex gap-4">
            <button className="text-foreground hover:text-reelverse-accent transition-colors">
              <Heart size={24} />
            </button>
            <button className="text-foreground hover:text-reelverse-accent transition-colors">
              <MessageCircle size={24} />
            </button>
            <button className="text-foreground hover:text-reelverse-accent transition-colors">
              <Send size={24} />
            </button>
          </div>
          <button className="text-foreground hover:text-reelverse-accent transition-colors">
            <Bookmark size={24} />
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="font-medium">{formatNumber(reel.likes)} likes</span>
            <span className="text-muted-foreground">{formatNumber(reel.comments)} comments</span>
          </div>
          
          <p className="text-sm">
            <span className="font-semibold">{user.username}</span>
            {' '}
            {reel.caption}
          </p>
        </div>
      </div>
    </article>
  );
};

export default ReelCard;
