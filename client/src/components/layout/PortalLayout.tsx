import { Link, useLocation } from 'wouter';
import { GraduationCap, Home, Users, Calendar, BookOpen, MessageSquare, User, Settings, Bell, LogOut, ImageIcon, FileText, Menu, ChevronLeft, ChevronRight, ClipboardCheck, ClipboardList, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import schoolLogo from '@assets/1000025432-removebg-preview (1)_1757796555126.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, PenTool, CheckSquare, Award } from 'lucide-react';


interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavGroup {
  type: 'group';
  label: string;
  icon: any;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  items: Array<{
    href: string;
    icon: any;
    label: string;
  }>;
}

type NavigationItem = NavItem | NavGroup;

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isExamMenuOpen, setIsExamMenuOpen] = useState(false);
  const [isGradingMenuOpen, setIsGradingMenuOpen] = useState(false);


  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

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
          { name: 'Report Card', href: `/portal/${userRole}/report-card`, icon: FileText },
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
          { name: 'Grading Queue', href: `/portal/${userRole}/grading-queue`, icon: ClipboardCheck },
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
          { 
            type: 'group',
            label: 'Exam System',
            icon: ClipboardList,
            isOpen: isExamMenuOpen,
            setIsOpen: setIsExamMenuOpen,
            items: [
              { href: '/portal/exams', icon: PenTool, label: 'Exam Management' },
              { href: '/portal/exam-sessions', icon: Clock, label: 'Active Sessions' },
              { href: '/portal/grading-queue', icon: CheckSquare, label: 'Grading Queue' },
              { href: '/portal/exam-reports', icon: Award, label: 'Exam Reports' },
            ]
          },
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
  const SidebarContent = ({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) => (
    <>
      <div className={`p-6 border-b border-border ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-full p-2 shadow-lg">
            <img 
              src={schoolLogo} 
              alt="Treasure-Home School Logo" 
              className={`${collapsed ? 'h-8 w-8' : 'h-12 w-12'} object-contain`}
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-sm">Treasure-Home</h1>
              <p className="text-xs text-muted-foreground">{getRoleTitle()}</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`p-4 space-y-2 ${collapsed ? 'px-2' : ''}`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          if ('type' in item && item.type === 'group') {
            return (
              <Collapsible key={item.label} open={item.isOpen} onOpenChange={item.setIsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-sm font-medium rounded-md ${
                      collapsed ? 'px-2' : 'px-3'
                    } text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                {!collapsed && (
                  <CollapsibleContent className="space-y-1 ml-3">
                    {item.items.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subItemActive = isActive(subItem.href);
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onNavigate}
                          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            subItemActive ? 'active-nav' : 'nav-link'
                          }`}
                          data-testid={`nav-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                          title={subItem.label}
                        >
                          <SubIcon className="h-4 w-4 mr-3" />
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          }

          const navItem = item as NavItem;
          return (
            <Link
              key={navItem.name}
              href={navItem.href}
              onClick={onNavigate}
              className={`flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(navItem.href) ? 'active-nav' : 'nav-link'
              }`}
              data-testid={`nav-${navItem.name.toLowerCase().replace(/\s+/g, '-')}`}
              title={collapsed ? navItem.name : undefined}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span>{navItem.name}</span>}
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
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-card shadow-sm border-r border-border h-screen sticky top-0 transition-all duration-300`}>
          <SidebarContent collapsed={sidebarCollapsed} />
          <div className={`absolute bottom-4 ${sidebarCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-4'}`}>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="rounded-full shadow-md"
              data-testid="button-toggle-sidebar"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
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