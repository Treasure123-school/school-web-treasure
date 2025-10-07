import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRoleName(roleId: number): string {
  const roleNames: Record<number, string> = {
    1: 'Admin',
    2: 'Teacher',
    3: 'Student',
    4: 'Parent'
  };
  return roleNames[roleId] || 'Unknown';
}