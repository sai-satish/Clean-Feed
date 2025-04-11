
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { Bell, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  showActions?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  showActions = true,
  className
}) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <header className={cn(
      'sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border py-3 px-4',
      className
    )}>
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
        </Link>
        
        {isAuthenticated && showActions && (
          <div className="flex gap-4">
            <button className="text-foreground hover:text-reelverse-primary transition-colors">
              <Send size={24} />
            </button>
            <button className="text-foreground hover:text-reelverse-primary transition-colors">
              <Bell size={24} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
