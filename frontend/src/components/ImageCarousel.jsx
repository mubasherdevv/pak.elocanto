import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export default function ImageCarousel({ images = [], title = '', fullWidth = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const placeholder = '/placeholder.png'; // Clean local placeholder
  const safeImages = images.length > 0 ? images : [placeholder];

  const prev = () => setCurrentIndex(i => (i - 1 + safeImages.length) % safeImages.length);
  const next = () => setCurrentIndex(i => (i + 1) % safeImages.length);

  return (
    <div>
      {/* Main Image */}
      <div style={{
        position: 'relative', 
        borderRadius: fullWidth ? 0 : 16, 
        overflow: 'hidden',
        background: '#f3f4f6', 
        cursor: 'zoom-in'
      }}
        onClick={() => setLightbox(true)}
      >
        <img
          key={safeImages[currentIndex]}
          src={getOptimizedImageUrl(safeImages[currentIndex], 800)}
          alt={`${title} - ${currentIndex + 1}`}
          width="640"
          height="480"
          style={{ 
            width: '100%', 
            aspectRatio: '1/1', 
            objectFit: fullWidth ? 'cover' : 'contain', 
            display: 'block',
            maxHeight: fullWidth ? 'auto' : '480px',
            background: 'white',
            transition: 'opacity 0.2s ease-in-out'
          }}
          loading={currentIndex === 0 ? "eager" : "lazy"}
          fetchpriority={currentIndex === 0 ? "high" : "auto"}
          decoding="async"
          onError={(e) => { 
            // Phase 1: If optimized fails, try loading the raw original path
            if (e.target.src.includes('/images/')) {
              e.target.src = safeImages[currentIndex];
            } 
            // Phase 2: If even raw fails, show the placeholder
            else if (!e.target.src.includes('placeholder.png')) {
              e.target.src = placeholder; 
            }
          }}
        />
        {safeImages.length > 1 && !fullWidth && (
          <>
            <button onClick={e => { e.stopPropagation(); prev(); }} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(4px)'
            }}>
              <ChevronLeftIcon style={{ width: 18, height: 18 }} />
            </button>
            <button onClick={e => { e.stopPropagation(); next(); }} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(4px)'
            }}>
              <ChevronRightIcon style={{ width: 18, height: 18 }} />
            </button>
          </>
        )}
        
        {(!fullWidth || safeImages.length > 1) && (
          <div style={{
            position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)',
            color: 'white', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {currentIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {!fullWidth && safeImages.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {safeImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              style={{
                flexShrink: 0, width: 70, height: 52, borderRadius: 8, overflow: 'hidden',
                border: i === currentIndex ? '2.5px solid #3e6fe1' : '2.5px solid transparent',
                padding: 0, cursor: 'pointer', transition: 'border-color 0.2s'
              }}
            >
              <img src={getOptimizedImageUrl(img, 150)} alt={`${title} thumbnail ${i + 1}`}
                width="70"
                height="52"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { 
                  // Phase 1: Try raw if optimized fails
                  if (e.target.src.includes('/images/')) {
                    e.target.src = img;
                  } 
                  // Phase 2: Show placeholder
                  else if (!e.target.src.includes('placeholder.png')) {
                    e.target.src = placeholder;
                  }
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <button onClick={() => setLightbox(false)} style={{
            position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <XMarkIcon style={{ width: 20, height: 20, color: 'white' }} />
          </button>
          <img
            src={getOptimizedImageUrl(safeImages[currentIndex], 1200)}
            alt={title}
            style={{ maxHeight: '90vh', maxWidth: '92vw', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
            onError={(e) => { 
              // Phase 1: Try raw if optimized fails
              if (e.target.src.includes('/images/')) {
                e.target.src = safeImages[currentIndex];
              } 
              // Phase 2: Show placeholder
              else if (!e.target.src.includes('placeholder.png')) {
                e.target.src = placeholder;
              }
            }}
          />
          {safeImages.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer'
              }}>
                <ChevronLeftIcon style={{ width: 22, height: 22, color: 'white' }} />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer'
              }}>
                <ChevronRightIcon style={{ width: 22, height: 22, color: 'white' }} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
