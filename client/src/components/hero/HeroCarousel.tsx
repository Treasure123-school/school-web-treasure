import { useState, useEffect, useRef, useMemo } from 'react';
import type { HomePageContent } from '@shared/schema';

/**
 * HeroCarousel Component
 * 
 * A professional, reusable hero image carousel with:
 * - Smooth slide transitions between images
 * - Automatic image preloading for seamless playback
 * - Professional skeleton loading state
 * - Touch-friendly navigation dots
 * - Responsive design with proper aspect ratios
 */

interface HeroCarouselProps {
  images: HomePageContent[];
  isLoading: boolean;
  autoRotateInterval?: number;
  transitionDuration?: number;
  animationType?: 'slide' | 'fade' | 'zoom';
}

/**
 * Image preloader utility - preloads images to ensure smooth transitions
 * Prevents flickering and loading delays when carousel rotates
 */
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Skeleton loader - professional placeholder while images load
 */
const HeroSkeleton = () => (
  <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-white/20">
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="space-y-3">
        <h3 className="text-3xl lg:text-4xl font-bold text-white animate-pulse">
          Treasure-Home School
        </h3>
        <p className="text-xl lg:text-2xl text-yellow-300 font-semibold animate-pulse" style={{ animationDelay: '0.2s' }}>
          Qualitative Education
        </p>
        <p className="text-lg lg:text-xl text-blue-100 animate-pulse" style={{ animationDelay: '0.4s' }}>
          &amp; Moral Excellence
        </p>
      </div>
      <div className="flex space-x-2 mt-4">
        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" />
        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  </div>
);

/**
 * Navigation dots - smooth indicator of current image with click navigation
 */
const NavigationDots = ({
  count,
  currentIndex,
  onDotClick
}: {
  count: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
}) => {
  if (count <= 1) return null;

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`transition-all duration-300 rounded-full ${
            currentIndex === index
              ? 'w-6 h-2 bg-white shadow-lg'
              : 'w-2 h-2 bg-white/50 hover:bg-white/75'
          }`}
          aria-label={`Go to image ${index + 1}`}
          data-testid={`button-hero-dot-${index}`}
          type="button"
        />
      ))}
    </div>
  );
};

/**
 * Image display with smooth professional transitions
 */
const HeroImage = ({
  image,
  isTransitioning,
  animationType = 'slide'
}: {
  image: HomePageContent;
  isTransitioning: boolean;
  animationType?: 'slide' | 'fade' | 'zoom';
}) => {
  // Animation styles based on type
  const animationClasses = {
    slide: isTransitioning 
      ? 'opacity-100 translate-x-12' 
      : 'opacity-100 translate-x-0',
    fade: isTransitioning 
      ? 'opacity-0 scale-110 blur-md' 
      : 'opacity-100 scale-100 blur-0',
    zoom: isTransitioning 
      ? 'opacity-0 scale-95' 
      : 'opacity-100 scale-100'
  };

  return (
    <div className="relative aspect-[4/3]">
      {image?.imageUrl ? (
        <>
          <img
            src={image.imageUrl}
            alt={image.altText || 'Treasure-Home School hero image'}
            className={`
              w-full h-full object-cover
              transition-all duration-1000 ease-in-out
              ${animationClasses[animationType]}
            `}
            loading="eager"
            decoding="async"
            data-testid="img-hero-carousel"
          />
          {/* Gradient overlay for text visibility and professional look */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
          <span className="text-white text-lg">Loading image...</span>
        </div>
      )}
    </div>
  );
};

/**
 * Caption overlay - displays if available
 */
const CaptionOverlay = ({ caption }: { caption: string | null }) => {
  if (!caption) return null;

  return (
    <div className="absolute bottom-16 left-6 right-6 text-white pointer-events-none">
      <p className="text-sm lg:text-base font-medium bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
        {caption}
      </p>
    </div>
  );
};

export function HeroCarousel({
  images,
  isLoading,
  autoRotateInterval = 5000,
  transitionDuration = 700,
  animationType = 'slide'
}: HeroCarouselProps) {
  // State management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoRotateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter valid images (active and have URL)
  const validImages = useMemo(
    () => images.filter(img => img.isActive && img.imageUrl),
    [images]
  );

  // Get current image safely
  const currentImage = validImages[currentIndex];

  /**
   * Preload the next image in the carousel
   * This ensures smooth transitions without loading delays
   */
  const preloadNextImage = (index: number) => {
    if (validImages.length <= 1) return;

    const nextIndex = (index + 1) % validImages.length;
    const nextImage = validImages[nextIndex];

    if (nextImage?.imageUrl) {
      preloadImage(nextImage.imageUrl).catch(() => {
        // Silently handle preload failures - don't break the carousel
        console.warn(`Failed to preload image: ${nextImage.imageUrl}`);
      });
    }
  };

  /**
   * Navigate to a specific image with smooth transition
   */
  const navigateToImage = (index: number) => {
    if (index === currentIndex || isTransitioning) return;

    setIsTransitioning(true);
    
    // Transition duration matches CSS animation
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
      preloadNextImage(index);
    }, transitionDuration);
  };

  /**
   * Auto-rotate carousel every interval
   * Only active when more than one image exists and not loading
   */
  useEffect(() => {
    if (!isLoading && validImages.length > 1) {
      autoRotateTimerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = (prev + 1) % validImages.length;
          preloadNextImage(nextIndex);
          return nextIndex;
        });
      }, autoRotateInterval);

      return () => {
        if (autoRotateTimerRef.current) {
          clearInterval(autoRotateTimerRef.current);
        }
      };
    }
  }, [validImages.length, isLoading, autoRotateInterval]);

  /**
   * Preload the next image when current image changes
   */
  useEffect(() => {
    preloadNextImage(currentIndex);
  }, [currentIndex, validImages]);

  // Loading state
  if (isLoading || validImages.length === 0) {
    return <HeroSkeleton />;
  }

  // Render carousel
  return (
    <div className="relative max-w-lg mx-auto lg:max-w-none">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
        {/* Image container with animation */}
        <div className="overflow-hidden">
          {currentImage && <HeroImage image={currentImage} isTransitioning={isTransitioning} animationType={animationType} />}
        </div>
        
        {/* Navigation dots with smooth transitions */}
        <NavigationDots
          count={validImages.length}
          currentIndex={currentIndex}
          onDotClick={navigateToImage}
        />
        
        {/* Caption with fade effect */}
        <div className={`
          transition-opacity duration-700 ease-in-out
          ${isTransitioning ? 'opacity-0' : 'opacity-100'}
        `}>
          {currentImage && <CaptionOverlay caption={currentImage.caption} />}
        </div>
      </div>
    </div>
  );
}

export default HeroCarousel;
