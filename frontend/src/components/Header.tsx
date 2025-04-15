import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { Bell, Send, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  showActions?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  showActions = true,
  className
}) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [displayData, setDisplayData] = useState({
    name: 'User',
    initials: 'U',
    avatarSrc: null as string | null
  });

  // Update displayData when user changes or on component mount
  useEffect(() => {
    updateDisplayData();
  }, [user]);

  // Function to update display data from either context or localStorage
  const updateDisplayData = () => {
    if (user) {
      // User is available from context
      setDisplayData({
        name: user.name || user.username || 'User',
        initials: getInitialsFromName(user.name || user.username || 'User'),
        avatarSrc: user.avatar || user.profilePic || null
      });
    } else {
      // Try to get user from localStorage as fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setDisplayData({
            name: userData.name || userData.username || 'User',
            initials: getInitialsFromName(userData.name || userData.username || 'User'),
            avatarSrc: userData.avatar || userData.profilePic || null
          });
        } catch (e) {
          console.error('Failed to parse stored user data', e);
        }
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get initials from name
  const getInitialsFromName = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

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
          <div className="flex items-center gap-4">
            <button className="text-foreground hover:text-reelverse-primary transition-colors">
              <Send size={24} />
            </button>
            <button className="text-foreground hover:text-reelverse-primary transition-colors">
              <Bell size={24} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium hidden sm:block">
                    {displayData.name}
                  </span>
                  <Avatar className="h-8 w-8 border border-border">
                    {displayData.avatarSrc ? (
                      <AvatarImage src={displayData.avatarSrc} alt={displayData.name} />
                    ) : (
                      <AvatarFallback className="bg-purple-gradient text-white">
                        {displayData.initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <Link to="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="bg-purple-gradient text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;