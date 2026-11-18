import React, { useState } from 'react';
import { Radio } from 'lucide-react';

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
}

export function SmartImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  priority = false,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#131B31] to-[#1E1B4B] text-slate-400 select-none p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Radio className="w-7 h-7 text-violet-400/70 mb-2" />
        <span className="text-xs font-medium text-slate-300 line-clamp-2 max-w-[18ch]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
