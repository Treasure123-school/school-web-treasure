import { Link, useLocation } from 'wouter';
import { GraduationCap, Menu } from 'lucide-react';
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
      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <GraduationCap className="text-primary-foreground h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Treasure-Home School</h1>
                <p className="text-xs text-muted-foreground">"Honesty and Success"</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href) ? 'active-nav' : ''
                  }`}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Link>
              ))}
              <Button asChild data-testid="button-portal-login">
                <Link href="/login">Portal Login</Link>
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href) ? 'active-nav' : ''
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid={`nav-mobile-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Button asChild className="w-fit" data-testid="button-mobile-portal-login">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Portal Login
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-primary rounded-lg p-2">
                <GraduationCap className="text-primary-foreground h-6 w-6" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-foreground">Treasure-Home School</h2>
                <p className="text-xs text-muted-foreground">"Honesty and Success"</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-2">
              Seriki-Soyinka Ifo, Ogun State
            </p>
            <p className="text-muted-foreground text-sm mb-2">
              Phone: 08037906249, 08107921359
            </p>
            <p className="text-muted-foreground text-sm">
              Email: treasurehomeschool@gmail.com
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground text-xs">
                © 2024 Treasure-Home School. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
