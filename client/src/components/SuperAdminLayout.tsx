import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Settings,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import schoolLogo from '@assets/1000025432-removebg-preview (1)_1757796555126.png';
import { NotificationBell } from '@/components/NotificationBell';

interface SuperAdminLayoutProps {
  children: ReactNode;
}
export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('superadmin-sidebar-collapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('superadmin-sidebar-collapsed', String(newState));
  };

  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  interface NavItem {
    label: string;
    path?: string;
    icon: any;
    children?: { label: string; path: string }[];
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/portal/superadmin",
      icon: LayoutDashboard,
    },
    {
      label: "User Management",
      icon: Users,
      children: [
        { label: "All Users", path: "/portal/superadmin/all-users" },
        { label: "Admin Management", path: "/portal/superadmin/admins" },
      ],
    },
    {
      label: "System Settings",
      icon: Settings,
      children: [
        { label: "General Settings", path: "/portal/superadmin/settings" },
        { label: "Authentication Settings", path: "/portal/superadmin/settings/authentication" },
      ],
    },
    {
      label: "Audit & Security",
      icon: ShieldCheck,
      children: [
        { label: "System Logs", path: "/portal/superadmin/logs" },
      ],
    },
    {
      label: "Profile",
      path: "/portal/superadmin/profile",
      icon: User,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/portal/superadmin") {
      return location === path;
    }
    return location === path || location.startsWith(path + '/');
  };

  const SidebarContent = ({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) => {
  const [, navigate] = useLocation();
  
  const isChildActive = (children?: { label: string; path: string }[]) => {
    return children?.some(child => isActive(child.path)) ?? false;
  };
  
  return (
    <>
      <div className={`p-5 border-b border-gray-200 dark:border-gray-700 ${collapsed ? 'px-3' : ''} bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-2.5 shadow-lg ring-2 ring-white dark:ring-gray-800">
            <img 
              src={schoolLogo} 
              alt="Treasure-Home School Logo" 
              className={`${collapsed ? 'h-7 w-7' : 'h-11 w-11'} object-contain`}
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">Treasure-Home</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Super Admin Portal</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`p-3 space-y-1 ${collapsed ? 'px-2' : ''} overflow-y-auto flex-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedSections.includes(item.label);
          const childActive = isChildActive(item.children);
          const navItemActive = item.path ? isActive(item.path) : childActive;
          
          if (hasChildren) {
            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      if (item.children?.[0]) {
                        onNavigate?.();
                        navigate(item.children[0].path);
                      }
                    } else {
                      toggleSection(item.label);
                    }
                  }}
                  className={`flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
                    childActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-0.5">
                    {item.children?.map((child) => (
                      <button
                        key={child.path}
                        type="button"
                        onClick={() => {
                          onNavigate?.();
                          navigate(child.path);
                        }}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200 w-full ${
                          isActive(child.path)
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                onNavigate?.();
                if (item.path) navigate(item.path);
              }}
              className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full ${
                navItemActive 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </>
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex">
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-md p-3 sm:p-4 md:p-6">
          <div className="flex justify-between items-center gap-2 sm:gap-3 max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
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
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                  Treasure-Home School
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base truncate font-medium">
                  Qualitative Education & Moral Excellence
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
              <NotificationBell />
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-full px-2 sm:px-3 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-white dark:ring-gray-800">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs sm:text-sm font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs sm:text-sm font-semibold hidden md:inline truncate max-w-[100px] lg:max-w-none text-gray-700 dark:text-gray-300" data-testid="text-username">
                  {user?.firstName} {user?.lastName}
                </span>
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

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
