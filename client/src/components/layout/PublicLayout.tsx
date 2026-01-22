import { Link, useLocation } from 'wouter';
import { GraduationCap, Menu, X, Phone, Mail, MapPin, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import schoolLogo from '@assets/school-logo.png';

interface PublicLayoutProps {
  children: React.ReactNode;
}

interface SettingsData {
  schoolName: string;
  schoolMotto: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ width: 0, left: 0 });
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery<SettingsData>({
    queryKey: ["/api/superadmin/settings"],
  });

  const schoolName = settings?.schoolName || "Treasure-Home School";
  const schoolMotto = settings?.schoolMotto || "Honesty and Success";
  const schoolEmail = settings?.schoolEmail || "treasurehomeschool@gmail.com";
  const schoolPhone = settings?.schoolPhone || "08037906249, 08107921359";
  const schoolAddress = settings?.schoolAddress || "Seriki-Soyinka Ifo, Ogun State, Nigeria";

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Admissions', href: '/admissions' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location === path;

  // Update underline position when hovering or location changes
  useEffect(() => {
    const targetHref = hoveredLink || location;
    const targetIndex = navigation.findIndex(item => item.href === targetHref);
    
    if (targetIndex !== -1 && navRefs.current[targetIndex]) {
      const link = navRefs.current[targetIndex];
      setUnderlineStyle({
        width: link.offsetWidth,
        left: link.offsetLeft,
      });
    }
  }, [hoveredLink, location]);

  // Auto-scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Clean professional navigation header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <nav>
          <div className="container-custom">
            <div className="flex justify-between items-center h-20">
              {/* Professional school branding */}
              <Link href="/" className="flex items-center space-x-4 group">
                <div className="rounded-full transition-all duration-300 group-hover:scale-105">
                  <img 
                    src={schoolLogo} 
                    alt="Treasure-Home School Logo" 
                    className="h-20 w-20 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {schoolName}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-600 font-semibold tracking-wide uppercase">
                    {schoolMotto}
                  </p>
                </div>
              </Link>
              
              {/* Desktop Navigation with smooth sliding underline */}
              <div className="hidden lg:flex items-center space-x-8 relative" ref={navContainerRef}>
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    ref={(el) => {
                      navRefs.current[index] = el;
                    }}
                    href={item.href}
                    className={`relative text-sm font-medium transition-colors duration-300 ${
                      isActive(item.href)
                        ? 'text-[#1F51FF] font-semibold'
                        : 'text-gray-700 dark:text-gray-300'
                    } hover:text-[#1F51FF]`}
                    onMouseEnter={() => setHoveredLink(item.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Smooth sliding underline */}
                {underlineStyle.width > 0 && (
                  <div
                    className="absolute h-1 bg-gradient-to-r from-[#1F51FF] to-[#3B6FFF] rounded-full"
                    style={{
                      left: `${underlineStyle.left}px`,
                      width: `${underlineStyle.width}px`,
                      bottom: '-10px',
                      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                )}
              </div>
              
              {/* Enhanced Mobile menu button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  data-testid="button-mobile-menu"
                  className="h-12 w-12 text-[#1F51FF] hover:bg-gradient-to-br hover:from-[#1F51FF]/10 hover:to-[#3B6FFF]/10 hover:text-[#1A47E6] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 border border-transparent hover:border-[#1F51FF]/20"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 transition-transform duration-300 hover:rotate-90" />
                  ) : (
                    <Menu className="h-6 w-6 transition-transform duration-300 hover:rotate-12" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
        </nav>
        
        {/* Simple Full-Page Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-20 bg-white dark:bg-gray-900 z-40 overflow-y-auto">
            <div className="container mx-auto px-6 py-8">
              <nav className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-4 text-lg font-medium transition-colors duration-200 rounded-lg text-left ${
                      isActive(item.href) 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid={`nav-mobile-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Additional Links */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/job-vacancy"
                    className="block px-4 py-4 text-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 text-left"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Job Vacancy
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content with fade-in animation */}
      <main className="animate-fade-in">{children}</main>

      {/* Beautiful Gradient Footer */}
      <footer className="section-gradient-accent py-16 mt-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
            {/* School Branding */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="rounded-full">
                  <img 
                    src={schoolLogo} 
                    alt="Treasure-Home School Logo" 
                    className="h-16 w-16 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold gradient-text">{schoolName}</h2>
                  <p className="text-muted-foreground font-medium">"{schoolMotto}"</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Providing quality education with moral excellence. We nurture students from playgroup 
                to senior secondary school, preparing them for success in academics and life.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                Contact Info
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>{schoolAddress}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>{schoolPhone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>{schoolEmail}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block text-sm text-muted-foreground hover:text-blue-600 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="/job-vacancy"
                  className="block text-sm text-muted-foreground hover:text-blue-600 transition-colors duration-200"
                  data-testid="link-job-vacancy"
                >
                  Job Vacancy
                </Link>
                <Link
                  href="/login"
                  className="block text-sm text-muted-foreground hover:text-blue-600 transition-colors duration-200"
                >
                  Portal Login
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {schoolName}. All rights reserved. | Built with excellence in education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
