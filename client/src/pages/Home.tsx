import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';

export default function Home() {
  const features = [
    {
      icon: 'fas fa-chalkboard-teacher',
      title: 'Qualified Teachers',
      description: 'Our experienced and certified teachers provide personalized attention to every student\'s learning journey.',
      color: 'primary'
    },
    {
      icon: 'fas fa-laptop',
      title: 'Modern Facilities',
      description: 'State-of-the-art classrooms, computer labs, and interactive learning tools for enhanced education.',
      color: 'secondary'
    },
    {
      icon: 'fas fa-trophy',
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

  const galleryImages = [
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

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-primary-foreground">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-hero-title">
                Quality Education &<br />
                <span className="text-secondary">Moral Excellence</span>
              </h1>
              <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed" data-testid="text-hero-description">
                Located in Seriki-Soyinka Ifo, Ogun State, we provide comprehensive education from playgroup to senior secondary school, nurturing students with our core values of honesty and success.
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
                  src="https://pixabay.com/get/gc7d2935b2c7daee5b00c7f4e5f775c0789f703b5347bf11383e16d0cf64f931493583d7ca01db3a2fd0940d4aa02adb939bbce4c48a8fb42f8bd002547dfe709_1280.jpg" 
                  alt="Treasure-Home School campus with modern facilities" 
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
                    <i className={`${feature.icon} ${
                      feature.color === 'primary' ? 'text-primary' :
                      feature.color === 'secondary' ? 'text-secondary' :
                      'text-green-600'
                    } text-xl`}></i>
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

      {/* Gallery Preview */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-gallery-title">
              School Life Gallery
            </h2>
            <p className="text-muted-foreground" data-testid="text-gallery-description">
              Capturing moments of learning, growth, and achievement
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <img
                key={index}
                src={image.src}
                alt={image.alt}
                className="rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                data-testid={`img-gallery-${index}`}
              />
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild data-testid="button-view-gallery">
              <Link href="/gallery">View Full Gallery</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
