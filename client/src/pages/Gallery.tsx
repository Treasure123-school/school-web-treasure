import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HomePageContent } from '@shared/schema';

export default function Gallery() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch gallery images from database
  const { data: allContent = [], isLoading } = useQuery<HomePageContent[]>({
    queryKey: ['/api', 'public', 'homepage-content'],
    staleTime: 5 * 60 * 1000,
  });

  // Filter and sort gallery preview images
  const galleryImages = allContent
    .filter(item => 
      item.contentType.startsWith('gallery_preview_') && 
      item.isActive && 
      item.imageUrl
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(item => ({
      id: item.id,
      src: item.imageUrl!,
      alt: item.altText || item.caption || 'School gallery image',
      caption: item.caption
    }));

  // Fallback images if none uploaded
  const fallbackImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Students engaged in classroom learning',
      caption: 'Classroom Learning'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Students participating in sports activities',
      caption: 'Sports & Recreation'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Students conducting science experiments',
      caption: 'Science Lab'
    },
    {
      id: 4,
      src: 'https://pixabay.com/get/g4b5de1b17360e7341ea05b3642f661cdaf69148acab371a0683000806209ef4e0fe83b5de589985b71b982913fd361ff36cf54100f89a9b6599375dc964cbe4e_1280.jpg',
      alt: 'Graduation ceremony with students and families',
      caption: 'Graduation Ceremony'
    }
  ];

  const images = galleryImages.length > 0 ? galleryImages : fallbackImages;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-16 lg:mb-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6" data-testid="text-gallery-title">
              School Life Gallery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-gallery-description">
              Explore moments of learning, growth, and achievement at Treasure-Home School
            </p>
          </div>

          {/* Main Gallery */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Loading gallery...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Image Section */}
              <div className="relative max-w-5xl mx-auto">
                {/* Main carousel */}
                <div className="relative min-h-96 sm:min-h-[28rem] md:min-h-[32rem] lg:min-h-[42rem] rounded-3xl overflow-hidden shadow-2xl group bg-gradient-to-br from-gray-200 to-gray-300">
                  <img
                    src={images[currentIndex]?.src}
                    alt={images[currentIndex]?.alt}
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-102"
                    data-testid={`img-gallery-main-${currentIndex}`}
                    loading="lazy"
                  />

                  {/* Navigation arrows - visible on hover */}
                  <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 sm:h-14 sm:w-14 bg-white/30 hover:bg-white/50 text-white rounded-full backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 shadow-lg"
                      onClick={prevImage}
                      data-testid="button-gallery-prev"
                    >
                      <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 sm:h-14 sm:w-14 bg-white/30 hover:bg-white/50 text-white rounded-full backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 shadow-lg"
                      onClick={nextImage}
                      data-testid="button-gallery-next"
                    >
                      <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                    </Button>
                  </div>
                </div>

                {/* Image caption */}
                {images[currentIndex]?.caption && (
                  <div className="mt-4 text-center">
                    <p className="text-lg font-medium text-foreground">{images[currentIndex].caption}</p>
                  </div>
                )}
              </div>

              {/* Gallery Grid */}
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">All Moments</h2>
                  <p className="text-muted-foreground">Click on any image to view it in the carousel above</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image, index) => (
                    <Card
                      key={image.id}
                      className={`overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        index === currentIndex ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setCurrentIndex(index)}
                      data-testid={`gallery-thumbnail-${index}`}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square overflow-hidden bg-muted">
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        {image.caption && (
                          <div className="p-3 bg-background">
                            <p className="text-sm font-medium text-foreground truncate">{image.caption}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
