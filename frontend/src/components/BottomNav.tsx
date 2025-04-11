
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Video, Upload, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/reels', icon: Video, label: 'Reels' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ];
  
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'nav-item',
              isActive && 'active'
            )}
          >
            <item.icon size={24} />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
