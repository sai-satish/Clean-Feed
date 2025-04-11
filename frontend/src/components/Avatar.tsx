
import React from 'react';
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  border?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  size = 'md', 
  className,
  border = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };
  
  return (
    <div 
      className={cn(
        'relative rounded-full overflow-hidden', 
        sizeClasses[size], 
        border && 'ring-2 ring-reelverse-primary p-0.5',
        className
      )}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default Avatar;
