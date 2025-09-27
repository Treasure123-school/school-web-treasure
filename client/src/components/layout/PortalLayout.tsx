import { Link, useLocation } from 'wouter';
import { GraduationCap, Home, Users, Calendar, BookOpen, MessageSquare, User, Settings, Bell, LogOut, ImageIcon, FileText, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import schoolLogo from '@assets/1000025432-removebg-preview (1)_1757796555126.png';

interface PortalLayoutProps {
  children: React.ReactNode;
  userRole: 'student' | 'teacher' | 'admin' | 'parent';
  userName: string;
  userInitials: string;
}

export default function PortalLayout({ children, userRole, userName, userInitials }: PortalLayoutProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: `/portal/${userRole}`, icon: Home },
    ];

    switch (userRole) {
      case 'student':
        return [
          ...baseNav,
          { name: 'My Exams', href: `/portal/${userRole}/exams`, icon: BookOpen },
          { name: 'My Grades', href: `/portal/${userRole}/grades`, icon: BookOpen },
          { name: 'Attendance', href: `/portal/${userRole}/attendance`, icon: Calendar },
          { name: 'Announcements', href: `/portal/${userRole}/announcements`, icon: MessageSquare },
          { name: 'Study Resources', href: `/portal/${userRole}/study-resources`, icon: FileText },
          { name: 'Messages', href: `/portal/${userRole}/messages`, icon: MessageSquare },
          { name: 'Gallery', href: `/portal/${userRole}/gallery`, icon: ImageIcon },
          { name: 'Profile', href: `/portal/${userRole}/profile`, icon: User },
        ];
      case 'teacher':
        return [
          ...baseNav,
          { name: 'My Classes', href: `/portal/${userRole}/classes`, icon: Users },
          { name: 'Attendance', href: `/portal/${userRole}/attendance`, icon: Calendar },
          { name: 'Grades & Exams', href: `/portal/${userRole}/grades`, icon: BookOpen },
          { name: 'Announcements', href: `/portal/${userRole}/announcements`, icon: MessageSquare },
          { name: 'Messages', href: `/portal/${userRole}/messages`, icon: MessageSquare },
        ];
      case 'admin':
        return [
          ...baseNav,
          { name: 'Students', href: `/portal/${userRole}/students`, icon: Users },
          { name: 'Teachers', href: `/portal/${userRole}/teachers`, icon: Users },
          { name: 'Classes', href: `/portal/${userRole}/classes`, icon: BookOpen },
          { name: 'Subjects', href: `/portal/${userRole}/subjects`, icon: BookOpen },
          { name: 'Reports', href: `/portal/${userRole}/reports`, icon: BookOpen },
          { name: 'Performance', href: `/portal/${userRole}/performance`, icon: Bell },
          { name: 'Announcements', href: `/portal/${userRole}/announcements`, icon: MessageSquare },
          { name: 'Settings', href: `/portal/${userRole}/settings`, icon: Settings },
        ];
      case 'parent':
        return [
          ...baseNav,
          { name: 'My Children', href: `/portal/${userRole}/children`, icon: Users },
          { name: 'Attendance', href: `/portal/${userRole}/attendance`, icon: Calendar },
          { name: 'Grades', href: `/portal/${userRole}/grades`, icon: BookOpen },
          { name: 'Messages', href: `/portal/${userRole}/messages`, icon: MessageSquare },
          { name: 'Profile', href: `/portal/${userRole}/profile`, icon: User },
        ];
      default:
        return baseNav;
    }
  };

  const navigation = getNavigation();
  const isActive = (path: string) => location === path || location.startsWith(path + '/');

  const getRoleTitle = () => {
    switch (userRole) {
      case 'student': return 'Student Portal';
      case 'teacher': return 'Teacher Portal';
      case 'admin': return 'Admin Portal';
      case 'parent': return 'Parent Portal';
      default: return 'Portal';
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // Reusable Sidebar Content Component
  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-full p-2 shadow-lg">
            <img 
              src={schoolLogo} 
              alt="Treasure-Home School Logo" 
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm">Treasure-Home</h1>
            <p className="text-xs text-muted-foreground">{getRoleTitle()}</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.href) ? 'active-nav' : 'nav-link'
              }`}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 bg-card shadow-sm border-r border-border h-screen sticky top-0">
          <SidebarContent />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Trigger */}
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
                  </SheetContent>
                </Sheet>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Welcome back, {userName.split(' ')[0]}!</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {userRole === 'student' && "Here's what's happening with your academics today."}
                  {userRole === 'teacher' && "Ready to inspire minds today?"}
                  {userRole === 'admin' && "Manage all aspects of Treasure-Home School"}
                  {userRole === 'parent' && "Stay connected with your child's education."}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline" data-testid="text-username">{userName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
