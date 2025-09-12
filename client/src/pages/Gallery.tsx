import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // In a real app, these would come from the API
  const categories = [
    { id: 1, name: 'All Photos', count: 24 },
    { id: 2, name: 'School Events', count: 8 },
    { id: 3, name: 'Classroom Activities', count: 6 },
    { id: 4, name: 'Sports', count: 5 },
    { id: 5, name: 'Achievements', count: 3 },
    { id: 6, name: 'Infrastructure', count: 2 }
  ];

  // Sample gallery images - in real app, this would come from API
  const galleryImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Students engaged in classroom learning',
      category: 'Classroom Activities',
      categoryId: 3
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Students participating in sports activities',
      category: 'Sports',
      categoryId: 4
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Students conducting science experiments',
      category: 'Classroom Activities',
      categoryId: 3
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Modern school building',
      category: 'Infrastructure',
      categoryId: 6
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Graduation ceremony',
      category: 'School Events',
      categoryId: 2
    },
    {
      id: 6,
      src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Students in library',
      category: 'Classroom Activities',
      categoryId: 3
    },
    {
      id: 7,
      src: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Annual sports day',
      category: 'Sports',
      categoryId: 4
    },
    {
      id: 8,
      src: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Award ceremony',
      category: 'Achievements',
      categoryId: 5
    },
    {
      id: 9,
      src: 'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Science fair presentation',
      category: 'School Events',
      categoryId: 2
    },
    {
      id: 10,
      src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Music class performance',
      category: 'Classroom Activities',
      categoryId: 3
    },
    {
      id: 11,
      src: 'https://images.unsplash.com/photo-1581726690015-c9861de5d82c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Basketball team',
      category: 'Sports',
      categoryId: 4
    },
    {
      id: 12,
      src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400',
      alt: 'Principal\'s award presentation',
      category: 'Achievements',
      categoryId: 5
    }
  ];

  const filteredImages = selectedCategory && selectedCategory !== 1 
    ? galleryImages.filter(img => img.categoryId === selectedCategory)
    : galleryImages;

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6" data-testid="text-gallery-title">
            School Life Gallery
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto" data-testid="text-gallery-subtitle">
            Capturing moments of learning, growth, and achievement at Treasure-Home School
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id === 1 ? null : category.id)}
                className="transition-colors"
                data-testid={`button-category-${category.id}`}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <Card 
                key={image.id} 
                className="card-hover shadow-sm border border-border overflow-hidden group cursor-pointer"
                data-testid={`card-image-${image.id}`}
              >
                <div className="relative">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                    data-testid={`img-gallery-${image.id}`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-sm font-medium" data-testid={`text-image-alt-${image.id}`}>
                        {image.alt}
                      </p>
                      <p className="text-xs opacity-90" data-testid={`text-image-category-${image.id}`}>
                        {image.category}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12" data-testid="text-no-images">
              <p className="text-muted-foreground">No images found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Stats */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div data-testid="stat-total-photos">
              <div className="text-3xl font-bold text-primary mb-2">200+</div>
              <div className="text-muted-foreground">Total Photos</div>
            </div>
            <div data-testid="stat-events-captured">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Events Captured</div>
            </div>
            <div data-testid="stat-years-documented">
              <div className="text-3xl font-bold text-primary mb-2">15+</div>
              <div className="text-muted-foreground">Years Documented</div>
            </div>
            <div data-testid="stat-memories-shared">
              <div className="text-3xl font-bold text-primary mb-2">1000+</div>
              <div className="text-muted-foreground">Memories Shared</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Highlights */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-highlights-title">
              Recent Highlights
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-highlights-description">
              Our most recent achievements and memorable moments
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="shadow-sm border border-border" data-testid="card-highlight-1">
              <CardContent className="p-6">
                <img
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                  alt="Annual graduation ceremony"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold mb-2" data-testid="text-highlight-title-1">
                  Annual Graduation Ceremony 2024
                </h3>
                <p className="text-muted-foreground text-sm" data-testid="text-highlight-description-1">
                  Celebrating our graduating class of 2024 with pride and joy as they move on to their next chapter.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border" data-testid="card-highlight-2">
              <CardContent className="p-6">
                <img
                  src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                  alt="Science fair winners"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold mb-2" data-testid="text-highlight-title-2">
                  Inter-School Science Fair Victory
                </h3>
                <p className="text-muted-foreground text-sm" data-testid="text-highlight-description-2">
                  Our students won first place in the regional science fair with their innovative water purification project.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border" data-testid="card-highlight-3">
              <CardContent className="p-6">
                <img
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                  alt="New sports complex"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold mb-2" data-testid="text-highlight-title-3">
                  New Sports Complex Opening
                </h3>
                <p className="text-muted-foreground text-sm" data-testid="text-highlight-description-3">
                  Grand opening of our new state-of-the-art sports complex, enhancing our physical education programs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
