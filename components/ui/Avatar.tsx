'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  registerNumber?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  shape?: 'rounded' | 'square' | 'circle';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
  '2xl': 'w-28 h-28 text-2xl',
  '3xl': 'w-32 h-32 text-3xl',
};

const shapeClasses = {
  rounded: 'rounded-2xl',
  square: 'rounded-xl',
  circle: 'rounded-full',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  registerNumber,
  size = 'md',
  shape = 'rounded',
  className,
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes so new images can load
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Compute initials (up to 2 letters)
  const getInitials = () => {
    if (!name || !name.trim()) {
      return registerNumber ? registerNumber.slice(-2).toUpperCase() : 'U';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const showImage = Boolean(src && !hasError);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 overflow-hidden font-bold select-none border border-slate-200/80 shadow-subtle',
        sizeClasses[size],
        shapeClasses[shape],
        !showImage && 'bg-gradient-to-br from-brand-700 via-navy-800 to-slate-900 text-white',
        className
      )}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt || name || 'Profile Avatar'}
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full object-cover object-center transition-opacity duration-300',
            shapeClasses[shape]
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-1 text-center">
          {name ? (
            <span className="tracking-tight uppercase font-extrabold">{getInitials()}</span>
          ) : (
            <UserIcon className="w-1/2 h-1/2 text-slate-300 stroke-[2]" />
          )}
        </div>
      )}
    </div>
  );
};
