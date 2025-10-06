import { Link, useLocation } from 'wouter';
import { GraduationCap, Home, Users, Calendar, BookOpen, MessageSquare, User, Settings, Bell, LogOut, ImageIcon, FileText, Menu, ChevronLeft, ChevronRight, ClipboardCheck, ClipboardList, ChevronDown, History, UserCheck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import schoolLogo from '@assets/1000025432-removebg-preview (1)_1757796555126.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, PenTool, CheckSquare, Award } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';


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
          { name: 'Pending Approvals', href: `/portal/${userRole}/pending-approvals`, icon: UserCheck },
          { name: 'User Management', href: `/portal/${userRole}/users`, icon: Users },
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
          { name: 'Audit Logs', href: `/portal/${userRole}/audit-logs`, icon: History },
          { name: 'Settings', href: `/portal/${userRole}/settings`, icon: Settings },
        ];
      case 'parent':
        return [
          ...baseNav,
          { name: 'My Children', href: `/portal/${userRole}/children`, icon: Users },
          { name: 'Report Cards', href: `/portal/${userRole}/reports`, icon: FileText },
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
  const isActive = (path: string) => {
    // Exact match for the main dashboard
    if (path === `/portal/${userRole}`) {
      return location === path;
    }
    // For other paths, check if current location starts with the path
    return location === path || location.startsWith(path + '/');
  };

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

  // Reusable Sidebar Content Component with Modern Design
  const SidebarContent = ({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) => (
    <>
      <div className={`p-5 border-b border-gray-200 dark:border-gray-700 ${collapsed ? 'px-3' : ''} bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-2.5 shadow-lg ring-2 ring-white dark:ring-gray-800">
            <img 
              src={schoolLogo} 
              alt="Treasure-Home School Logo" 
              className={`${collapsed ? 'h-7 w-7' : 'h-11 w-11'} object-contain`}
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Treasure-Home</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{getRoleTitle()}</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`p-3 space-y-1.5 ${collapsed ? 'px-2' : ''} overflow-y-auto`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          if ('type' in item && item.type === 'group') {
            return (
              <Collapsible key={item.label} open={item.isOpen} onOpenChange={item.setIsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-sm font-semibold rounded-xl ${
                      collapsed ? 'px-2' : 'px-3'
                    } text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.isOpen ? (
                          <ChevronDown className="h-4 w-4 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                {!collapsed && (
                  <CollapsibleContent className="space-y-1 ml-2 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                    {item.items.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subItemActive = isActive(subItem.href);
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onNavigate}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            subItemActive 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
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
          const navItemActive = isActive(navItem.href);
          return (
            <Link
              key={navItem.name}
              href={navItem.href}
              onClick={onNavigate}
              className={`flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                navItemActive 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 scale-105' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-blue-700 dark:hover:text-blue-300 hover:scale-102'
              }`}
              data-testid={`nav-${navItem.name.toLowerCase().replace(/\s+/g, '-')}`}
              title={collapsed ? navItem.name : undefined}
            >
              <Icon className={`h-4 w-4 ${navItemActive ? '' : ''}`} />
              {!collapsed && <span>{navItem.name}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex">
      {/* Desktop Sidebar - Modern Design */}
      {!isMobile && (
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 transition-all duration-300 ease-in-out`}>
          <SidebarContent collapsed={sidebarCollapsed} />
          <div className={`absolute bottom-6 ${sidebarCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-4'}`}>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white dark:bg-gray-800 hover:scale-105"
              data-testid="button-toggle-sidebar"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Modern Responsive Design */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 md:p-6 sticky top-0 z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
          <div className="flex justify-between items-center gap-2 sm:gap-3 max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
              {/* Modern Mobile Menu Trigger */}
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="md:hidden h-9 w-9 flex-shrink-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700"
                      data-testid="button-mobile-menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 bg-white dark:bg-gray-900">
                    <div className="h-full overflow-y-auto">
                      <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Welcome back, {userName.split(' ')[0]}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base truncate font-medium">
                  {userRole === 'student' && "Here's what's happening with your academics today."}
                  {userRole === 'teacher' && "Ready to inspire minds today?"}
                  {userRole === 'admin' && "Manage all aspects of Treasure-Home School"}
                  {userRole === 'parent' && "Stay connected with your child's education."}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
              <NotificationBell />
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-full px-2 sm:px-3 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-white dark:ring-gray-800">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm font-semibold hidden md:inline truncate max-w-[100px] lg:max-w-none text-gray-700 dark:text-gray-300" data-testid="text-username">{userName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-logout"
                title="Logout"
                className="h-9 w-9 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content - Modern Responsive Layout */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}