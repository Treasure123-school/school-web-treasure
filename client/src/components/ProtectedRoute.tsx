import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { getRoleNameById, getPortalByRole } from '@/lib/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate(fallbackPath);
      return;
    }

    // If authenticated but wrong role, redirect based on user's actual role
    if (user && !isRoleAllowed(user.roleId, allowedRoles)) {
      const userRole = getRoleNameById(user.roleId);
      const correctPortal = getPortalByRole(userRole);
      navigate(correctPortal);
      return;
    }
  }, [isAuthenticated, user, allowedRoles, navigate, fallbackPath]);

  // Helper function to check if role is allowed
  const isRoleAllowed = (userRoleId: number, allowedRoles: string[]): boolean => {
    const userRole = getRoleNameById(userRoleId);
    return allowedRoles.includes(userRole);
  };

  // Show loading or nothing while checking authentication
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if user has the right role
  if (!isRoleAllowed(user.roleId, allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}