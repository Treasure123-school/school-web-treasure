import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getRoleName(roleId: number): string {
  // Role IDs: 1=Super Admin, 2=Admin, 3=Teacher, 4=Student, 5=Parent
  const roleNames: Record<number, string> = {
    1: 'Super Admin',
    2: 'Admin',
    3: 'Teacher',
    4: 'Student',
    5: 'Parent'
  };
  return roleNames[roleId] || 'Unknown';
}