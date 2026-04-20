import { useState, useEffect } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

const FloatingScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the top scroll behavior
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className={`fixed bottom-24 right-6 z-[999] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <button
        onClick={scrollToTop}
        className="group relative flex items-center justify-center w-12 h-12 bg-white/80 backdrop-blur-md border border-gray-100 text-orange-600 rounded-2xl shadow-2xl shadow-orange-200/50 hover:bg-orange-500 hover:text-white transition-all active:scale-90"
        aria-label="Scroll to top"
      >
        <ChevronUpIcon className="w-6 h-6 stroke-[2.5px] transition-transform group-hover:-translate-y-1" />
        
        {/* Subtle Ring Animation */}
        <span className="absolute inset-0 rounded-2xl border-2 border-orange-500 opacity-0 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500"></span>
      </button>
    </div>
  );
};

export default FloatingScrollToTop;
