import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { getPortalByRoleId } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoleIds: number[];
  fallbackPath?: string;
}
export default function ProtectedRoute({ 
  children, 
  allowedRoleIds, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      navigate(fallbackPath);
      return;
    }
    if (user && !isRoleAllowed(user.roleId, allowedRoleIds)) {
      const correctPortal = getPortalByRoleId(user.roleId);
      navigate(correctPortal);
      return;
    }
  }, [isAuthenticated, isLoading, user, allowedRoleIds, navigate, fallbackPath]);

  const isRoleAllowed = (userRoleId: number, allowedRoleIds: number[]): boolean => {
    return allowedRoleIds.includes(userRoleId);
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!isRoleAllowed(user.roleId, allowedRoleIds)) {
    return null;
  }
  
  return <>{children}</>;
}
