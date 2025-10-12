import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, Award, GraduationCap, Star } from 'lucide-react';
import type { HomePageContent } from '@shared/schema';

export default function Home() {
  // Fetch dynamic content from database with optimized caching
  // Uses global queryFn which joins array: ['/api', 'path'] -> '/api/path'
  const { data: heroImages = [], isLoading: heroLoading } = useQuery<HomePageContent[]>({
    queryKey: ['/api', 'homepage-content', 'hero_image'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: galleryPreviewImages = [], isLoading: galleryLoading } = useQuery<HomePageContent[]>({
    queryKey: ['/api', 'homepage-content?contentType=gallery_preview_1&contentType=gallery_preview_2&contentType=gallery_preview_3'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch latest published announcements for homepage preview
  const { data: allAnnouncements = [], isLoading: announcementsLoading } = useQuery<any[]>({
    queryKey: ['/api', 'announcements'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter and sort announcements client-side for better caching
  const recentAnnouncements = allAnnouncements
    .filter((ann: any) => ann.isPublished && ann.publishedAt)
    .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

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
      {/* Enhanced Hero Section with beautiful styling */}
      <section className="hero-gradient py-20 md:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-primary-foreground order-2 lg:order-1 text-center lg:text-left">
              <h1 className="school-title text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-6 leading-tight animate-slide-down" data-testid="text-hero-title">
                Treasure-Home School
              </h1>
              <p className="school-motto text-xl sm:text-2xl lg:text-3xl mb-8 font-medium animate-slide-down" data-testid="text-hero-motto">
                Motto: "Honesty and Success"
              </p>
              <p className="text-lg sm:text-xl text-primary-foreground/95 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in" data-testid="text-hero-description">
                Located in Seriki-Soyinka Ifo, Ogun State, we provide comprehensive education from playgroup to senior secondary school, nurturing students with our core values of honesty and success through quality education and moral excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start animate-slide-up">
                <Button 
                  asChild 
                  className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-orange-500 hover:to-orange-600 text-gray-900 font-bold h-14 px-10 text-lg rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-110 hover:-translate-y-2"
                  data-testid="button-apply-admission"
                >
                  <Link href="/admissions">Apply for Admission</Link>
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  className="border-2 border-white bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 hover:text-white hover:border-white/80 font-bold h-14 px-10 text-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-2"
                  data-testid="button-contact-us"
                >
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:text-right animate-fade-in">
              <div className="relative max-w-lg mx-auto lg:max-w-none">
                <img 
                  src={heroImage?.imageUrl || "/uploads/hero-classroom-compressed.jpg"} 
                  alt={heroImage?.altText || "Students engaged in active learning at Treasure-Home School"} 
                  className="rounded-3xl shadow-2xl w-full h-auto aspect-[4/3] object-cover transform transition-all duration-500 hover:scale-105"
                  width="600"
                  height="450"
                  loading="eager"
                  decoding="async"
                  data-testid="img-hero-school"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";
                  }}
                />
                <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 bg-white/95 backdrop-blur-lg p-4 sm:p-6 rounded-2xl shadow-xl border border-white/20">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-gray-900" data-testid="text-student-count">500+ Students</p>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">Enrolled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Key Features Section with beautiful styling */}
      <section className="section-gradient-light py-20 md:py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 lg:mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 lg:mb-8 animate-slide-down" data-testid="text-features-title">
              Why Choose Treasure-Home School?
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed animate-fade-in" data-testid="text-features-description">
              We provide comprehensive education with modern facilities and experienced teachers, preparing students for academic excellence and moral development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover bg-white/80 backdrop-blur-sm border-0 shadow-xl animate-slide-up" data-testid={`card-feature-${index}`}>
                <CardContent className="p-8 lg:p-10 text-center">
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto transform transition-all duration-300 ${
                    feature.color === 'primary' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' :
                    feature.color === 'secondary' ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/25' :
                    'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25'
                  }`}>
                    <feature.icon className="text-white h-8 w-8 lg:h-10 lg:w-10" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold mb-4 text-gray-900" data-testid={`text-feature-title-${index}`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-base lg:text-lg leading-relaxed" data-testid={`text-feature-description-${index}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-gradient-to-br from-white to-blue-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="group animate-bounce-gentle" style={{ animationDelay: `${index * 0.2}s` }} data-testid={`stat-${index}`}>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium text-sm lg:text-base" data-testid={`text-stat-label-${index}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beautiful Mission/Vision Section */}
      <section className="section-gradient-accent py-20 lg:py-28 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text mb-6 animate-slide-down">Our Mission & Vision</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-teal-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            <div className="text-center md:text-left animate-slide-up">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-xl card-hover">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  To provide quality, comprehensive education from playgroup to senior secondary level, fostering academic excellence and moral development. We are committed to nurturing students with our core values of <strong className="text-blue-600">honesty and success</strong> through innovative teaching methods and modern facilities.
                </p>
              </div>
            </div>

            <div className="text-center md:text-left animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-xl card-hover">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Our Vision</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  To be a leading educational institution that shapes future leaders with strong moral character, academic excellence, and practical skills. We envision a generation of students who embody <strong className="text-green-600">integrity, knowledge, and success</strong> in all their endeavors.
                </p>
              </div>
            </div>
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
            <div className="relative max-w-4xl mx-auto">
              {/* Main carousel with improved responsive design */}
              <div className="relative h-60 sm:h-72 md:h-80 lg:h-96 rounded-2xl overflow-hidden mb-6 shadow-2xl">
                <img
                  src={galleryImages[currentImageIndex]?.src}
                  alt={galleryImages[currentImageIndex]?.alt}
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                  data-testid={`img-gallery-main-${currentImageIndex}`}
                />

                {/* Enhanced navigation arrows */}
                <div className="absolute inset-0 flex items-center justify-between p-3 sm:p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110"
                    onClick={prevImage}
                    data-testid="button-gallery-prev"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-110"
                    onClick={nextImage}
                    data-testid="button-gallery-next"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>

                {/* Enhanced image counter */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 text-white px-3 py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
                  <span className="flex items-center space-x-1">
                    <span>{currentImageIndex + 1}</span>
                    <span className="text-white/60">/</span>
                    <span>{galleryImages.length}</span>
                  </span>
                </div>

                {/* Progress indicator dots */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentImageIndex === index 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      data-testid={`button-gallery-dot-${index}`}
                    />
                  ))}
                </div>
              </div>

              {/* Enhanced thumbnail navigation */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-16 sm:h-20 rounded-xl overflow-hidden transition-all duration-300 transform ${
                      currentImageIndex === index 
                        ? 'ring-2 ring-primary ring-offset-2 scale-105 shadow-lg' 
                        : 'hover:opacity-80 hover:scale-105 hover:shadow-md'
                    }`}
                    data-testid={`button-gallery-thumbnail-${index}`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    {currentImageIndex !== index && (
                      <div className="absolute inset-0 bg-black/40" />
                    )}
                    {currentImageIndex === index && (
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
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