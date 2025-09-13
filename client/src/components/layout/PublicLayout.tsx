import { Link, useLocation } from 'wouter';
import { GraduationCap, Menu, X, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Admissions', href: '/admissions' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Beautiful gradient navigation header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-white/20">
        <div className="gradient-primary absolute inset-0 opacity-10"></div>
        <nav className="relative">
          <div className="container-custom">
            <div className="flex justify-between items-center h-20">
              {/* Logo with gradient effect */}
              <Link href="/" className="flex items-center space-x-4 group">
                <div className="gradient-primary rounded-xl p-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <GraduationCap className="text-white h-8 w-8" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold gradient-text">Treasure-Home School</h1>
                  <p className="text-sm text-muted-foreground font-medium">"Honesty and Success"</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-lg font-bold gradient-text">Treasure-Home</h1>
                </div>
              </Link>
              
              {/* Desktop Navigation with beautiful hover effects */}
              <div className="hidden lg:flex items-center space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-link px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive(item.href) ? 'active' : ''
                    }`}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Button 
                  asChild 
                  className="btn-primary ml-4"
                  data-testid="button-portal-login"
                >
                  <Link href="/login">Portal Login</Link>
                </Button>
              </div>
              
              {/* Mobile menu button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  data-testid="button-mobile-menu"
                  className="hover:bg-white/20"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Beautiful Mobile Navigation Overlay */}
          {isMobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" 
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 z-50 lg:hidden">
                <div className="gradient-primary mx-4 mt-2 rounded-2xl shadow-2xl border border-white/20">
                  <div className="card-glass p-6">
                    <div className="flex flex-col space-y-3">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`nav-link px-4 py-3 rounded-xl text-white font-medium transition-all duration-300 ${
                            isActive(item.href) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          data-testid={`nav-mobile-${item.name.toLowerCase()}`}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="pt-3 border-t border-white/20">
                        <Button 
                          asChild 
                          className="btn-secondary w-full"
                          data-testid="button-mobile-portal-login"
                        >
                          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            Portal Login
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </nav>
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
                <div className="gradient-primary rounded-xl p-3 shadow-lg">
                  <GraduationCap className="text-white h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold gradient-text">Treasure-Home School</h2>
                  <p className="text-muted-foreground font-medium">"Honesty and Success"</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Providing quality education with moral excellence since 2009. We nurture students from playgroup 
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
                  <span>Seriki-Soyinka Ifo, Ogun State, Nigeria</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>08037906249, 08107921359</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>treasurehomeschool@gmail.com</span>
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
              © 2024 Treasure-Home School. All rights reserved. | Built with excellence in education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
