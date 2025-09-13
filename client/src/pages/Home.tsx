import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, Award, GraduationCap, Star } from 'lucide-react';
import type { HomePageContent } from '@shared/schema';

export default function Home() {
  // Fetch dynamic content from database
  const { data: heroImages = [] } = useQuery<HomePageContent[]>({
    queryKey: ['/api/homepage-content', 'hero_image'],
    queryFn: async () => {
      const res = await fetch('/api/homepage-content?contentType=hero_image');
      if (!res.ok) {
        return [];
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: galleryPreviewImages = [] } = useQuery<HomePageContent[]>({
    queryKey: ['/api/homepage-content', 'gallery_preview'],
    queryFn: async () => {
      const res = await fetch('/api/homepage-content?contentType=gallery_preview_1&contentType=gallery_preview_2&contentType=gallery_preview_3');
      if (!res.ok) {
        return [];
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  // Fetch latest published announcements for homepage preview
  const { data: recentAnnouncements = [] } = useQuery({
    queryKey: ['/api/announcements', 'published'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      if (!res.ok) {
        return [];
      }
      const announcements = await res.json();
      return announcements
        .filter((ann: any) => ann.isPublished && ann.publishedAt)
        .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 3);
    },
    refetchOnWindowFocus: false,
  });

  // Gallery carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get the primary hero image (first active hero image)
  const heroImage = Array.isArray(heroImages) ? heroImages.find(img => img.isActive) || null : null;
  const features = [
    {
      icon: GraduationCap,
      title: 'Qualified Teachers',
      description: 'Our experienced and certified teachers provide personalized attention to every student\'s learning journey.',
      color: 'primary'
    },
    {
      icon: Award,
      title: 'Modern Facilities',
      description: 'State-of-the-art classrooms, computer labs, and interactive learning tools for enhanced education.',
      color: 'secondary'
    },
    {
      icon: Star,
      title: 'Excellence Track Record',
      description: 'Consistent outstanding performance in WAEC, NECO, and other standardized examinations.',
      color: 'green'
    }
  ];

  const stats = [
    { value: '15+', label: 'Years of Excellence' },
    { value: '500+', label: 'Students Enrolled' },
    { value: '50+', label: 'Qualified Teachers' },
    { value: '95%', label: 'Success Rate' }
  ];

  // Combine dynamic gallery preview images with fallbacks
  const dynamicGalleryImages = galleryPreviewImages
    .filter(img => img.isActive && img.imageUrl)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 4)
    .map(img => ({
      src: img.imageUrl!,
      alt: img.altText || img.caption || 'School gallery image'
    }));

  // Fallback images if no dynamic images are available
  const fallbackGalleryImages = [
    {
      src: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300',
      alt: 'Students engaged in classroom learning'
    },
    {
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300',
      alt: 'Students participating in sports activities'
    },
    {
      src: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300',
      alt: 'Students conducting science experiments'
    },
    {
      src: 'https://pixabay.com/get/g4b5de1b17360e7341ea05b3642f661cdaf69148acab371a0683000806209ef4e0fe83b5de589985b71b982913fd361ff36cf54100f89a9b6599375dc964cbe4e_1280.jpg',
      alt: 'Graduation ceremony with students and families'
    }
  ];

  // Use dynamic images if available, otherwise use fallbacks
  const galleryImages = dynamicGalleryImages.length > 0 ? dynamicGalleryImages : fallbackGalleryImages;

  // Gallery carousel navigation
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (galleryImages.length > 1) {
      const timer = setInterval(nextImage, 5000);
      return () => clearInterval(timer);
    }
  }, [galleryImages.length]);

  // Helper to format announcement date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-primary-foreground">
              <h1 className="school-title text-4xl lg:text-6xl mb-4" data-testid="text-hero-title">
                Treasure-Home School
              </h1>
              <p className="school-motto text-xl lg:text-2xl mb-6" data-testid="text-hero-motto">
                "Honesty and Success"
              </p>
              <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed max-w-xl" data-testid="text-hero-description">
                Located in Seriki-Soyinka Ifo, Ogun State, we provide comprehensive education from playgroup to senior secondary school, nurturing students with our core values of honesty and success through quality education and moral excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  data-testid="button-apply-admission"
                >
                  <Link href="/admissions">Apply for Admission</Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  data-testid="button-virtual-tour"
                >
                  Take Virtual Tour
                </Button>
              </div>
            </div>
            <div className="lg:text-right">
              <div className="relative">
                <img 
                  src={heroImage?.imageUrl || "https://pixabay.com/get/gc7d2935b2c7daee5b00c7f4e5f775c0789f703b5347bf11383e16d0cf64f931493583d7ca01db3a2fd0940d4aa02adb939bbce4c48a8fb42f8bd002547dfe709_1280.jpg"} 
                  alt={heroImage?.altText || "Treasure-Home School campus with modern facilities"} 
                  className="rounded-xl shadow-2xl w-full h-auto"
                  data-testid="img-hero-school"
                />
                <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <i className="fas fa-users text-primary"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" data-testid="text-student-count">500+ Students</p>
                      <p className="text-xs text-muted-foreground">Enrolled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-features-title">
              Why Choose Treasure-Home School?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-description">
              We provide comprehensive education with modern facilities and experienced teachers, preparing students for academic excellence and moral development.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover shadow-sm border border-border" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    feature.color === 'primary' ? 'bg-primary/10' :
                    feature.color === 'secondary' ? 'bg-secondary/10' :
                    'bg-green-100'
                  }`}>
                    <feature.icon className={`${
                      feature.color === 'primary' ? 'text-primary' :
                      feature.color === 'secondary' ? 'text-secondary' :
                      'text-green-600'
                    } h-6 w-6`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-feature-title-${index}`}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm" data-testid={`text-feature-description-${index}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} data-testid={`stat-${index}`}>
                <div className="text-3xl font-bold text-primary mb-2" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground" data-testid={`text-stat-label-${index}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Announcements Preview */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-announcements-title">
              Latest School News
            </h2>
            <p className="text-muted-foreground" data-testid="text-announcements-description">
              Stay informed with our latest updates and important announcements
            </p>
          </div>
          
          {recentAnnouncements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentAnnouncements.map((announcement: any, index: number) => (
                <Card key={announcement.id} className="card-hover h-full" data-testid={`card-announcement-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(announcement.publishedAt)}
                      </Badge>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3 line-clamp-2" data-testid={`text-announcement-title-${index}`}>
                      {announcement.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`text-announcement-content-${index}`}>
                      {truncateText(announcement.content, 120)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">School Administration</span>
                      <Button variant="ghost" size="sm" className="p-0 h-auto text-primary hover:text-primary/80">
                        Read more →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent announcements available</p>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Button asChild data-testid="button-view-announcements">
              <Link href="/portal/login">View All Announcements</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Gallery Carousel */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-gallery-title">
              School Life Gallery
            </h2>
            <p className="text-muted-foreground" data-testid="text-gallery-description">
              Capturing moments of learning, growth, and achievement
            </p>
          </div>
          
          {galleryImages.length > 0 ? (
            <div className="relative">
              {/* Main carousel */}
              <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6">
                <img
                  src={galleryImages[currentImageIndex]?.src}
                  alt={galleryImages[currentImageIndex]?.alt}
                  className="w-full h-full object-cover transition-opacity duration-500"
                  data-testid={`img-gallery-main-${currentImageIndex}`}
                />
                
                {/* Navigation arrows */}
                <div className="absolute inset-0 flex items-center justify-between p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/20 hover:bg-black/40 text-white rounded-full"
                    onClick={prevImage}
                    data-testid="button-gallery-prev"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/20 hover:bg-black/40 text-white rounded-full"
                    onClick={nextImage}
                    data-testid="button-gallery-next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {galleryImages.length}
                </div>
              </div>
              
              {/* Thumbnail navigation */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-16 rounded-lg overflow-hidden transition-all ${
                      currentImageIndex === index 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:opacity-80'
                    }`}
                    data-testid={`button-gallery-thumbnail-${index}`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    {currentImageIndex !== index && (
                      <div className="absolute inset-0 bg-black/30" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Gallery images will be available soon</p>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Button asChild data-testid="button-view-gallery">
              <Link href="/gallery">Explore Full Gallery</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
