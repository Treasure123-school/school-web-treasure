import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import type { HomePageContent } from '@shared/schema';

interface SettingsData {
  schoolName: string;
}

export default function Gallery() {
  const { data: settings } = useQuery<SettingsData>({
    queryKey: ["/api/superadmin/settings"],
  });

  const schoolName = settings?.schoolName || "Treasure-Home School";

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

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4" data-testid="text-gallery-title">
              School Life Gallery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-gallery-description">
              Capturing moments of learning, growth, and achievement at {schoolName}
            </p>
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Loading gallery...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
                  data-testid={`gallery-image-${image.id}`}
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
                      <div className="p-4 bg-background">
                        <p className="text-sm font-medium text-foreground truncate">{image.caption}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
