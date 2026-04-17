import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function ImageWithFallback({ src, alt, className }: Props) {
  const [error, setError] = useState(false);
  return error ? (
    <div className={`bg-gray-700 flex items-center justify-center ${className}`}>
      <span className="text-gray-400 text-sm">{alt}</span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}