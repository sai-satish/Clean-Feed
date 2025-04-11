
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className={cn(
          'rounded-full border-t-transparent animate-spin border-reelverse-primary',
          sizeClasses[size],
          className
        )} 
      />
    </div>
  );
};

export default LoadingSpinner;
