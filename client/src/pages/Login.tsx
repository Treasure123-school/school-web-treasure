import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GraduationCap, AlertCircle, CheckCircle, Key, Clock, Ban, XCircle, Users, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { getRoleNameById, getPortalByRoleId, isValidRoleId } from '@/lib/roles';
import { useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/config/api';


const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function Login() {
  const { toast } = useToast();
  const { login, user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient(); // Initialize useQueryClient
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Check for OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const provider = params.get('provider');
    const oauthParam = params.get('oauth');
    const step = params.get('step');
    const error = params.get('error');
    const oauthStatus = params.get('oauth_status');

    // Message 7: Pending Approval - Admin/Teacher (Google OAuth)
    if (oauthStatus === 'pending_approval') {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span>Account Created - Pending Approval</span>
          </div>
        ),
        description: (
          <div className="text-sm">
            <p className="mb-2">Welcome to THS Portal! Your account has been successfully created and is awaiting administrator verification.</p>
            <p className="text-muted-foreground">You will receive an email notification once your account is approved. If you need urgent access, please contact the school administrator directly.</p>
          </div>
        ),
        className: 'border-orange-500 bg-orange-50 dark:bg-orange-950/50',
        duration: 8000,
      });
      window.history.replaceState({}, '', '/login');
    }

    // Message 6: Google Sign-In Failed
    if (error === 'google_auth_failed') {
      const errorMessage = params.get('message') || 'Unable to sign in with Google. Please try again.';

      if (errorMessage.includes('awaiting Admin approval') || errorMessage.includes('awaiting admin approval')) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>Account Pending Approval</span>
            </div>
          ),
          description: (
            <div className="text-sm">
              <p className="mb-2">Welcome to THS Portal. Your account is awaiting admin verification.</p>
              <p className="text-muted-foreground">You will be notified via email once approved. Contact the school administrator if you need immediate assistance.</p>
            </div>
          ),
          className: 'border-orange-500 bg-orange-50 dark:bg-orange-950/50',
        });
      } else if (errorMessage.includes('suspended')) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-500" />
              <span>Account Suspended</span>
            </div>
          ),
          description: (
            <div className="text-sm">
              <p className="mb-2">Access denied. Your account has been suspended by the school administrator.</p>
              <p className="text-muted-foreground">Please contact the school administrator to resolve this issue.</p>
            </div>
          ),
          className: 'border-red-500 bg-red-50 dark:bg-red-950/50',
        });
      } else {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Google Sign-In Failed</span>
            </div>
          ),
          description: errorMessage || 'Unable to sign in with Google. Please try again or contact support if the problem persists.',
          variant: 'destructive',
        });
      }
      window.history.replaceState({}, '', '/login');
    }

    if (token && provider === 'google') {
      handleGoogleLogin(token);
    }

    if (oauthParam === 'google' && step === 'role_selection') {
      setShowRoleSelection(true);
    }
  }, [toast, login, navigate]);

  const handleGoogleLogin = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();

        const userRole = getRoleNameById(userData.roleId);
        const targetPath = getPortalByRoleId(userData.roleId);

        window.history.replaceState({}, '', '/login');

        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Login Successful</span>
            </div>
          ),
          description: 'Welcome back to THS Portal. Redirecting you to your dashboard...',
          className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
        });

        login(userData, token);

        setTimeout(() => {
          navigate(targetPath);
        }, 200);
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'Unable to complete Google sign-in. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();

      if (!response.ok) {
        // Enhanced user-friendly error messages based on status type
        const statusType = result.statusType;

        switch (statusType) {
          case 'invalid_credentials':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Invalid Login</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Invalid login. Please check your username or password and try again.
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Make sure CAPS LOCK is off.</p>
                </div>
              ),
              className: 'border-red-500 bg-red-50 dark:bg-red-950/50',
              duration: 10000,
            });
            break;
          case 'pending_staff':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Account Awaiting Approval</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Your Admin/Teacher account is awaiting approval. You will be notified once verified.
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                    Contact the school administrator for urgent access.
                  </p>
                </div>
              ),
              className: 'border-orange-500 bg-orange-50 dark:bg-orange-950/50',
              duration: 10000,
            });
            break;
          case 'pending_setup':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Account Setup Pending</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Your account is being set up by the school administrator. Please check back soon.
                  </p>
                </div>
              ),
              className: 'border-orange-500 bg-orange-50 dark:bg-orange-950/50',
              duration: 8000,
            });
            break;
          case 'suspended_staff':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-500" />
                  <span>Account Suspended</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Access denied. Your account has been suspended by the school administrator.
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                    Please contact them to resolve this issue.
                  </p>
                </div>
              ),
              className: 'border-red-500 bg-red-50 dark:bg-red-950/50',
              duration: 10000,
            });
            break;
          case 'suspended_parent':
            // Prevent default error handling
            toast({
              title: (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                  <span className="font-bold text-sm sm:text-base break-words">🔒 Account Suspended - Security Alert</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm space-y-2 sm:space-y-3">
                  <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-md border-2 border-red-400 dark:border-red-600">
                    <p className="font-bold text-red-900 dark:text-red-100 mb-1.5 sm:mb-2 text-sm sm:text-base break-words">
                      ⚠️ Access Blocked for Your Safety
                    </p>
                    <p className="text-red-800 dark:text-red-200 leading-relaxed text-xs sm:text-sm">
                      Your parent account has been <strong>automatically suspended</strong> due to multiple failed login attempts. This security measure protects your child's information from unauthorized access.
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md border-2 border-blue-400 dark:border-blue-600">
                    <p className="font-bold text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 break-words">
                      📞 How to Restore Your Account:
                    </p>
                    <div className="space-y-1.5 sm:space-y-2 text-blue-900 dark:text-blue-200">
                      <p className="font-semibold text-xs sm:text-sm">Contact School Administrator:</p>
                      <div className="text-xs sm:text-sm break-all">
                        <p className="mb-1.5 sm:mb-2">
                          📧 <strong>Email:</strong>
                        </p>
                        <span className="bg-white dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono text-[10px] sm:text-xs inline-block">treasurehomeschool@gmail.com</span>
                      </div>
                      <p className="text-xs sm:text-sm">
                        📞 <strong>Call:</strong> School office during working hours
                      </p>
                      <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-blue-700 dark:text-blue-300">
                        💡 Tip: Have your child's information ready for verification
                      </p>
                    </div>
                  </div>
                </div>
              ),
              className: 'border-red-600 bg-red-50 dark:bg-red-950/50 max-w-[95vw] sm:max-w-md md:max-w-lg',
              duration: 30000, // 30 seconds for important security message
            });
            throw new Error('SUSPENDED_PARENT_HANDLED'); // Prevent default error handling
            break;
          case 'suspended_student':
            toast({
              title: (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                  <span className="font-bold text-sm sm:text-base break-words">🔒 Account Suspended</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm space-y-2 sm:space-y-3">
                  <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-md border-2 border-red-400 dark:border-red-600">
                    <p className="font-bold text-red-900 dark:text-red-100 mb-1.5 sm:mb-2 text-sm sm:text-base break-words">
                      ⚠️ Your Account Has Been Suspended
                    </p>
                    <p className="text-red-800 dark:text-red-200 leading-relaxed text-xs sm:text-sm">
                      Your student account has been <strong>temporarily suspended</strong>. This could be due to multiple failed login attempts or other security concerns.
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md border-2 border-blue-400 dark:border-blue-600">
                    <p className="font-bold text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 break-words">
                      📞 How to Restore Your Account:
                    </p>
                    <div className="space-y-1.5 sm:space-y-2 text-blue-900 dark:text-blue-200">
                      <p className="font-semibold text-xs sm:text-sm">Contact School Administrator:</p>
                      <div className="text-xs sm:text-sm break-all">
                        <p className="mb-1.5 sm:mb-2">
                          📧 <strong>Email:</strong>
                        </p>
                        <span className="bg-white dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono text-[10px] sm:text-xs inline-block">treasurehomeschool@gmail.com</span>
                      </div>
                      <p className="text-xs sm:text-sm">
                        📞 <strong>Call:</strong> School office during working hours
                      </p>
                      <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-blue-700 dark:text-blue-300">
                        💡 Alternatively, speak with your class teacher for assistance
                      </p>
                    </div>
                  </div>
                </div>
              ),
              className: 'border-red-600 bg-red-50 dark:bg-red-950/50 max-w-[95vw] sm:max-w-md md:max-w-lg',
              duration: 30000,
            });
            throw new Error('SUSPENDED_STUDENT_HANDLED'); // Prevent default error handling
            break;
          case 'disabled':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-red-500" />
                  <span>Account Disabled</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <Ban className="h-4 w-4" />
                    Your account has been disabled. Please contact the school administrator if you believe this is an error.
                  </p>
                </div>
              ),
              className: 'border-red-500 bg-red-50 dark:bg-red-950/50',
              duration: 10000,
            });
            break;
          case 'rate_limited':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Too Many Attempts</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Account Temporarily Locked: Too many failed login attempts. Your account has been temporarily locked for security.
                  </p>
                  <p className="text-xs font-medium mt-2">Please wait 15 minutes before trying again, or use "Forgot Password" to reset.</p>
                </div>
              ),
              className: 'border-orange-500 bg-orange-50 dark:bg-orange-950/50',
              duration: 12000,
            });
            break;
          case 'google_required':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span>Google Sign-In Required</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Google Sign-In Required: Admins and Teachers must sign in using the "Sign in with Google" button below.
                  </p>
                </div>
              ),
              className: 'border-blue-500 bg-blue-50 dark:bg-blue-950/50',
              duration: 10000,
            });
            break;
          case 'setup_incomplete':
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Account Setup Incomplete</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Account Setup Incomplete: Please contact the school administrator for assistance.
                  </p>
                </div>
              ),
              className: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50',
              duration: 10000,
            });
            break;
          default:
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Login Failed</span>
                </div>
              ),
              description: (
                <div className="text-xs sm:text-sm">
                  <p className="mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Login failed. Please try again or contact support.
                  </p>
                </div>
              ),
              variant: 'destructive',
              duration: 8000,
            });
        }
        throw new Error(result.message || 'Login failed'); // Throw error to trigger onError
      }

      return result;
    },
    onSuccess: (userData) => {
      if (!isValidRoleId(userData.user.roleId)) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Authentication Error</span>
            </div>
          ),
          description: 'Invalid account configuration. Please contact the school administrator.',
          variant: 'destructive',
        });
        return;
      }

      if (!userData.token) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Authentication Error</span>
            </div>
          ),
          description: 'No access token received. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (userData.user.mustChangePassword) {
        setTempUserData(userData);
        setShowPasswordChange(true);
        return;
      }

      const userRole = getRoleNameById(userData.user.roleId);
      const targetPath = getPortalByRoleId(userData.user.roleId);

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Welcome Back to THS Portal</span>
          </div>
        ),
        description: 'Login successful. Redirecting you to your dashboard...',
        className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
      });

      login(userData.user, userData.token);

      setTimeout(() => {
        navigate(targetPath);
      }, 200);
    },
    onError: (error: any) => {
      // Skip if already handled (e.g., suspended parent/student with custom message)
      if (error.message === 'SUSPENDED_PARENT_HANDLED' || error.message === 'SUSPENDED_STUDENT_HANDLED') {
        return;
      }
      
      // The actual toast messages are now handled within mutationFn for specific errors
      // This onError is for unexpected errors or errors not caught by the switch statement.
      if (!error.message && typeof error === 'string') {
        toast({
          title: 'Login Failed',
          description: error,
          variant: 'destructive',
        });
      } else if (error.message && !error?.statusType) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const previousToken = localStorage.getItem('token');
      localStorage.setItem('token', tempUserData.token);

      try {
        const response = await apiRequest('POST', '/api/auth/change-password', {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        return await response.json();
      } catch (error) {
        if (previousToken) {
          localStorage.setItem('token', previousToken);
        } else {
          localStorage.removeItem('token');
        }
        throw error;
      }
    },
    onSuccess: () => {
      login(tempUserData.user, tempUserData.token);
      const userRole = getRoleNameById(tempUserData.user.roleId);
      const targetPath = getPortalByRoleId(tempUserData.user.roleId);

      setShowPasswordChange(false);
      setTempUserData(null);
      resetPasswordForm();

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Password Changed Successfully</span>
          </div>
        ),
        description: 'Welcome to THS Portal! Your password has been updated.',
        className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
      });

      setTimeout(() => {
        navigate(targetPath);
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: 'Password Change Failed',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const roleSelectionMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await apiRequest('POST', '/api/auth/google/complete-signup', { roleId });
      return await response.json();
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      const userRole = getRoleNameById(data.user.roleId);
      const targetPath = getPortalByRoleId(data.user.roleId);

      setShowRoleSelection(false);

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Account Created Successfully</span>
          </div>
        ),
        description: 'Welcome to THS Portal! Your account has been set up.',
        className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
      });

      window.history.replaceState({}, '', '/login');

      setTimeout(() => {
        navigate(targetPath);
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: 'Signup Failed',
        description: error.message || 'Failed to complete signup. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onPasswordChange = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center justify-center space-x-3 mb-6 group" data-testid="link-home">
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-3 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <GraduationCap className="text-white h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <div className="text-left">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Treasure-Home School
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground italic">"Honesty and Success"</p>
            </div>
          </Link>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground" data-testid="text-login-title">
              Welcome Back
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-login-subtitle">
              Sign in to access your school dashboard
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 animate-slide-up" data-testid="card-login">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl sm:text-2xl text-center font-bold">Portal Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  {...register('identifier')}
                  className="h-11 sm:h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your username or email"
                  data-testid="input-identifier"
                />
                {errors.identifier && (
                  <p className="text-destructive text-xs sm:text-sm mt-1 flex items-center gap-1" data-testid="error-identifier">
                    <AlertCircle className="h-3 w-3" />
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    className="h-11 sm:h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                    placeholder="Enter your password"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs sm:text-sm mt-1 flex items-center gap-1" data-testid="error-password">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Info Box for Students & Parents */}
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      For Students & Parents
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed mb-2">
                      Use your THS username and password.
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mb-2">
                      <span className="font-medium">Example:</span> <span className="font-mono font-medium bg-white/50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded text-[10px] sm:text-xs break-all">THS-STU-2025-PR3-001</span>
                    </p>
                    <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium space-y-1">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">If details are correct: Access granted</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">If incorrect: Check your username & password</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In to Portal'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-3 text-muted-foreground font-medium">Admin/Teacher Only</span>
              </div>
            </div>

            {/* Google Sign-In Info */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1 flex items-center gap-1">
                    <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                    Staff Members Only
                  </p>
                  <p className="text-[10px] sm:text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                    Teachers & Admins must use their authorized Google email. New staff accounts require Admin approval before first login.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 sm:h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg"
              onClick={() => window.location.href = getApiUrl('/api/auth/google')}
              data-testid="button-google-login"
            >
              <svg className="mr-2 h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm sm:text-base font-medium">
                Sign in with Google
              </span>
            </Button>

            <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 font-medium">Need help accessing your account?</p>
              <Link
                href="/forgot-password"
                className="text-primary text-sm sm:text-base font-semibold hover:text-blue-600 transition-colors inline-flex items-center gap-2 group"
                data-testid="link-forgot-password"
              >
                <Key className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                Reset Your Password
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Website */}
        <div className="text-center mt-6 sm:mt-8">
          <Link
            href="/"
            className="text-muted-foreground text-sm sm:text-base hover:text-foreground transition-colors inline-flex items-center gap-2 group font-medium"
            data-testid="link-back-to-website"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Website
          </Link>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" data-testid="dialog-password-change">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              Password Change Required
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              For security reasons, you must change your password before accessing your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword('currentPassword')}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="Enter your current password"
                data-testid="input-current-password"
              />
              {passwordErrors.currentPassword && (
                <p className="text-destructive text-xs sm:text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="Enter a new secure password"
                data-testid="input-new-password"
              />
              {passwordErrors.newPassword && (
                <p className="text-destructive text-xs sm:text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.newPassword.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="Re-enter your new password"
                data-testid="input-confirm-password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-destructive text-xs sm:text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Changing Password...
                </span>
              ) : 'Change Password & Continue'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Selection Dialog for Google OAuth */}
      <Dialog open={showRoleSelection} onOpenChange={setShowRoleSelection}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-role-selection">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Select Your Role</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Choose your role to complete your account setup. Google Sign-In is only available for Admin and Teacher roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Button
              type="button"
              variant={selectedRole === 1 ? "default" : "outline"}
              className={`w-full justify-start h-auto p-4 transition-all duration-200 ${
                selectedRole === 1
                  ? 'bg-gradient-to-r from-primary to-blue-600 shadow-lg'
                  : 'hover:border-primary hover:bg-primary/5'
              }`}
              onClick={() => setSelectedRole(1)}
              data-testid="button-role-admin"
            >
              <div className="text-left w-full">
                <div className="font-semibold text-base sm:text-lg mb-1">Administrator</div>
                <div className="text-xs sm:text-sm opacity-90">Manage school operations and settings</div>
              </div>
            </Button>

            <Button
              type="button"
              variant={selectedRole === 2 ? "default" : "outline"}
              className={`w-full justify-start h-auto p-4 transition-all duration-200 ${
                selectedRole === 2
                  ? 'bg-gradient-to-r from-primary to-blue-600 shadow-lg'
                  : 'hover:border-primary hover:bg-primary/5'
              }`}
              onClick={() => setSelectedRole(2)}
              data-testid="button-role-teacher"
            >
              <div className="text-left w-full">
                <div className="font-semibold text-base sm:text-lg mb-1">Teacher</div>
                <div className="text-xs sm:text-sm opacity-90">Create exams, grade assignments, manage classes</div>
              </div>
            </Button>

            <Button
              type="button"
              className="w-full h-11 sm:h-12 font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              disabled={!selectedRole || roleSelectionMutation.isPending}
              onClick={() => selectedRole && roleSelectionMutation.mutate(selectedRole)}
              data-testid="button-complete-signup"
            >
              {roleSelectionMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : 'Complete Sign Up'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}