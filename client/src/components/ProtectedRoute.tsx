import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { getPortalByRoleId } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoleIds: number[];
  fallbackPath?: string;
} // fixed
export default function ProtectedRoute({ 
  children, 
  allowedRoleIds, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate(fallbackPath);
      return;
    } // fixed
    // If authenticated but wrong role, redirect based on user's actual role
    if (user && !isRoleAllowed(user.roleId, allowedRoleIds)) {
      const correctPortal = getPortalByRoleId(user.roleId);
      navigate(correctPortal);
      return;
    }
  }, [isAuthenticated, user, allowedRoleIds, navigate, fallbackPath]);

  // Helper function to check if role is allowed - now uses numeric comparison
  const isRoleAllowed = (userRoleId: number, allowedRoleIds: number[]): boolean => {
    return allowedRoleIds.includes(userRoleId);
  };

  // Show loading or nothing while checking authentication
  if (!isAuthenticated || !user) {
    return null;
  } // fixed
  // Check if user has the right role
  if (!isRoleAllowed(user.roleId, allowedRoleIds)) {
    return null;
  } // fixed
  return <>{children}</>;
}