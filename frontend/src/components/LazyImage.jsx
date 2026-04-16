import { useState, useEffect, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

const PLACEHOLDER = '/placeholder.png';

export default function LazyImage({
  src,
  alt,
  className = '',
  placeholder = PLACEHOLDER,
  fallbackSrc,
  aspectRatio,
  threshold = 0.1,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [triedFallback, setTriedFallback] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold, rootMargin: '100px' }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        setTriedFallback(false);
      };
      img.onerror = () => {
        if (fallbackSrc && !triedFallback) {
          setTriedFallback(true);
          const fbImg = new Image();
          fbImg.src = fallbackSrc;
          fbImg.onload = () => {
            setCurrentSrc(fallbackSrc);
            setIsLoaded(true);
          };
          fbImg.onerror = () => {
            setHasError(true);
            if (onError) onError();
          };
        } else {
          setHasError(true);
          if (onError) onError();
        }
      };
    }
  }, [isInView, src, fallbackSrc, onError, triedFallback]);

  const handleError = (e) => {
    if (!hasError) {
      setCurrentSrc(placeholder);
    }
    if (onError) onError(e);
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-50 ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse">
          {placeholder && (
            <img
              src={placeholder}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-105"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-gray-100" />
          <PhotoIcon className="w-8 h-8 text-gray-300 relative z-10" />
        </div>
      )}
      
      {isInView && (
        <img
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

export function LazyBackgroundImage({ src, className = '', children, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
