/**
 * Centralized role management utilities
 * Ensures consistent role mapping across the application
 */

export const ROLE_IDS = {
  STUDENT: 1,
  TEACHER: 2, 
  PARENT: 3,
  ADMIN: 4
} as const;

export const ROLE_NAMES = {
  [ROLE_IDS.STUDENT]: 'Student',
  [ROLE_IDS.TEACHER]: 'Teacher',
  [ROLE_IDS.PARENT]: 'Parent',
  [ROLE_IDS.ADMIN]: 'Admin'
} as const;

export const ROLE_PORTALS = {
  [ROLE_IDS.STUDENT]: '/portal/student',
  [ROLE_IDS.TEACHER]: '/portal/teacher',
  [ROLE_IDS.PARENT]: '/portal/parent',
  [ROLE_IDS.ADMIN]: '/portal/admin'
} as const;

/**
 * Get role name by ID
 */
export const getRoleNameById = (roleId: number): string => {
  return ROLE_NAMES[roleId as keyof typeof ROLE_NAMES] || 'Student';
};

/**
 * Get portal path by role ID
 */
export const getPortalByRoleId = (roleId: number): string => {
  return ROLE_PORTALS[roleId as keyof typeof ROLE_PORTALS] || '/portal/student';
};

/**
 * Get portal path by role name
 */
export const getPortalByRole = (role: string): string => {
  const roleEntry = Object.entries(ROLE_NAMES).find(([, name]) => name === role);
  if (roleEntry) {
    const roleId = parseInt(roleEntry[0]);
    return ROLE_PORTALS[roleId as keyof typeof ROLE_PORTALS];
  }
  return '/portal/student';
};

/**
 * Check if role is valid
 */
export const isValidRoleId = (roleId: number): boolean => {
  return roleId in ROLE_NAMES;
};