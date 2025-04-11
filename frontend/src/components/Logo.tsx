
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };
  
  return (
    <div className={cn('font-bold', sizeClasses[size], className)}>
      <span className="bg-clip-text text-transparent bg-purple-gradient">Reel</span>
      <span className="text-foreground">Verse</span>
    </div>
  );
};

export default Logo;
