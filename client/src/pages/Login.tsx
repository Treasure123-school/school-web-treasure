import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GraduationCap, AlertCircle, CheckCircle, Clock, Ban, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { getRoleNameById, getPortalByRoleId, isValidRoleId } from '@/lib/roles';

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
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

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
            <span>Account Pending Approval</span>
          </div>
        ),
        description: (
          <div className="text-sm">
            <p className="mb-2">Welcome to THS Portal. Your account has been created and is awaiting admin verification.</p>
            <p className="text-muted-foreground">You will be notified via email once approved. For urgent access, please contact the school administrator.</p>
          </div>
        ),
        className: 'border-orange-500 bg-orange-50 dark:bg-orange-950/50',
      });
      window.history.replaceState({}, '', '/login');
    }

    // Message 6: Google Sign-In Failed
    if (error === 'google_auth_failed') {
      const errorMessage = params.get('message') || 'Unable to sign in with Google. Please try again.';

      // Check if this is actually a pending approval message
      if (errorMessage.includes('awaiting Admin approval') || errorMessage.includes('awaiting admin approval')) {
        // Message 7: Pending Approval - Admin/Teacher (Google OAuth)
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
        // Message 10: Account Suspended
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
        // Generic Google Sign-In Failed
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

        // Clean up OAuth query parameters
        window.history.replaceState({}, '', '/login');

        // Message 2: Google OAuth Success (Admin/Teacher)
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

        // Store auth data first
        login(userData, token);

        // Navigate after a delay to ensure auth state is set
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

      // If response is not ok, throw error with the backend message
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      return result;
    },
    onSuccess: (userData) => {
      // Validate roleId from backend
      if (!isValidRoleId(userData.user.roleId)) {
        toast({
          title: 'Authentication Error',
          description: 'Invalid account configuration. Please contact administrator.',
          variant: 'destructive',
        });
        return;
      }

      // Store the JWT token for API authentication  
      if (!userData.token) {
        toast({
          title: 'Authentication Error',
          description: 'No access token received. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Check if password change is required
      if (userData.user.mustChangePassword) {
        // Store user data temporarily and show password change dialog
        setTempUserData(userData);
        setShowPasswordChange(true);
        return;
      }

      // Normal login flow
      const userRole = getRoleNameById(userData.user.roleId);
      const targetPath = getPortalByRoleId(userData.user.roleId);

      // Message 1: Standard Login Success (Students/Parents)
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

      // Store auth data first
      login(userData.user, userData.token);

      // Navigate with a small delay to ensure auth state is set
      setTimeout(() => {
        navigate(targetPath);
      }, 200);
    },
    onError: (error: any) => {
      // Extract the specific error message from the backend
      const errorMessage = error?.message || 'Invalid username or password. Please check your credentials and try again.';

      // Determine message type and styling based on exact backend responses
      let icon = <XCircle className="h-4 w-4 text-red-500" />;
      let className = '';
      let title = 'Login Failed';
      let description: string | JSX.Element = errorMessage;

      // Message 7: Pending Approval - Admin/Teacher (Google OAuth or Standard)
      if (errorMessage.includes('awaiting Admin approval') || 
          (errorMessage.includes('pending') && (errorMessage.includes('Admin') || errorMessage.includes('Teacher')))) {
        icon = <Clock className="h-4 w-4 text-orange-500" />;
        className = 'border-orange-500 bg-orange-50 dark:bg-orange-950/50';
        title = 'Account Pending Approval';
        description = (
          <div className="text-xs sm:text-sm">
            <p className="mb-2">Welcome to THS Portal. Your Admin/Teacher account is awaiting approval by the school administrator.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs">You will be notified once your account is verified. For urgent matters, please contact the school administrator.</p>
          </div>
        );
      }
      // Message 9: Pending Approval - Student/Parent
      else if (errorMessage.includes('pending') || errorMessage.includes('awaiting')) {
        icon = <Clock className="h-4 w-4 text-orange-500" />;
        className = 'border-orange-500 bg-orange-50 dark:bg-orange-950/50';
        title = 'Account Pending Setup';
        description = (
          <div className="text-xs sm:text-sm">
            <p className="mb-2">Your account is being set up by the school administrator.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs">You will receive a notification once your account is ready. Please check back soon.</p>
          </div>
        );
      }
      // Message 10: Account Suspended
      else if (errorMessage.includes('suspended')) {
        icon = <Ban className="h-4 w-4 text-red-500" />;
        className = 'border-red-500 bg-red-50 dark:bg-red-950/50';
        title = 'Account Suspended';
        description = (
          <div className="text-xs sm:text-sm">
            <p className="mb-2">Access denied. Your account has been suspended by the school administrator.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs">Please contact your class teacher or the school administrator to resolve this issue.</p>
          </div>
        );
      }
      // Message 11: Account Disabled
      else if (errorMessage.includes('disabled')) {
        icon = <Ban className="h-4 w-4 text-red-500" />;
        className = 'border-red-500 bg-red-50 dark:bg-red-950/50';
        title = 'Account Disabled';
        description = (
          <div className="text-xs sm:text-sm">
            <p className="mb-2">Your account has been disabled and is no longer active.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs">Please contact the school administrator if you believe this is an error.</p>
          </div>
        );
      }
      // Message 12: Account Locked (Too Many Attempts)
      else if (errorMessage.includes('Too many login attempts') || errorMessage.includes('locked')) {
        icon = <Ban className="h-4 w-4 text-orange-500" />;
        className = 'border-orange-500 bg-orange-50 dark:bg-orange-950/50';
        title = 'Account Temporarily Locked';
        description = (
          <div className="text-xs sm:text-sm">
            <p className="mb-2">Too many failed login attempts. Your account has been temporarily locked for security reasons.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs">Please wait 15 minutes before trying again. If you've forgotten your password, use the "Forgot your password?" link below.</p>
          </div>
        );
      }
      // Message 13: Google Sign-In Required (Admin/Teacher trying standard login)
      else if (errorMessage.includes('must use Google Sign-In')) {
        icon = <AlertCircle className="h-4 w-4 text-blue-500" />;
        className = 'border-blue-500 bg-blue-50 dark:bg-blue-950/50';
        title = 'Google Sign-In Required';
        description = (
          <div className="text-xs sm:text-sm">
            <p className="mb-2">Admins and Teachers must sign in using their authorized Google account.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs">Please click the "Sign in with Google" button below to access your account.</p>
          </div>
        );
      }
      // Message 5: Invalid Credentials (default)
      else {
        icon = <XCircle className="h-4 w-4 text-red-500" />;
        title = 'Login Failed';
        description = (
          <div className="text-xs sm:text-sm">
            <p className="mb-2">Invalid username or password. Please check your credentials and try again.</p>
            <p className="text-muted-foreground text-[10px] sm:text-xs">Make sure CAPS LOCK is off and you're using the correct username and password.</p>
          </div>
        );
      }

      toast({
        title: (
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
        ),
        description: description,
        variant: className ? undefined : 'destructive',
        className: className || undefined,
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      // Temporarily store token for authentication during password change
      const previousToken = localStorage.getItem('token');
      localStorage.setItem('token', tempUserData.token);

      try {
        const response = await apiRequest('POST', '/api/auth/change-password', {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        return await response.json();
      } catch (error) {
        // Restore previous token if request failed
        if (previousToken) {
          localStorage.setItem('token', previousToken);
        } else {
          localStorage.removeItem('token');
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Password changed successfully, now complete login
      login(tempUserData.user, tempUserData.token);
      const userRole = getRoleNameById(tempUserData.user.roleId);
      const targetPath = getPortalByRoleId(tempUserData.user.roleId);

      setShowPasswordChange(false);
      setTempUserData(null);
      resetPasswordForm();

      // Message 4: Password Changed Successfully
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

      // Navigate immediately after a short delay
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

      // Message 3: New Account Created via Google (Admin/Teacher)
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

      // Clean up OAuth query parameters
      window.history.replaceState({}, '', '/login');

      // Navigate immediately after a short delay
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6" data-testid="link-home">
            <div className="bg-primary rounded-lg p-2 sm:p-3">
              <GraduationCap className="text-primary-foreground h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="text-left">
              <h1 className="text-base sm:text-xl font-bold text-foreground">Treasure-Home School</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">"Honesty and Success"</p>
            </div>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-login-title">
            Portal Login
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-login-subtitle">
            Access your school dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border border-border" data-testid="card-login">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="identifier">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  {...register('identifier')}
                  className="mt-2"
                  placeholder="Enter your username or email"
                  data-testid="input-identifier"
                />
                {errors.identifier && (
                  <p className="text-destructive text-sm mt-1" data-testid="error-identifier">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  className="mt-2"
                  placeholder="Enter your password"
                  data-testid="input-password"
                />
                {errors.password && (
                  <p className="text-destructive text-sm mt-1" data-testid="error-password">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Message 1: Standard Login Success (Students/Parents) - Info Box */}
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                  <strong>For Students & Parents:</strong> Use your THS username and password to login. You'll be automatically redirected to your dashboard.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? 'Signing In...' : 'Login to Portal'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Admin/Teacher Only</span>
              </div>
            </div>

            {/* Message 13: Google Sign-In Required (Admin/Teacher trying standard login) - Info Box */}
            <div className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800 mb-3">
              <p className="text-[10px] sm:text-xs text-orange-800 dark:text-orange-200">
                <strong>Admins & Teachers:</strong> Use Google Sign-In with your authorized email. Students and parents cannot use this option.
              </p>
            </div>

            <Button 
              type="button"
              variant="outline"
              className="w-full border-primary/30 hover:border-primary hover:bg-primary/5"
              onClick={() => window.location.href = '/api/auth/google'}
              data-testid="button-google-login"
            >
              <svg className="mr-2 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
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
              <span className="text-xs sm:text-sm">
                Sign in with Google <span className="hidden xs:inline">(Admin/Teacher Only)</span>
              </span>
            </Button>

            <div className="text-center mt-6">
              <Link 
                href="/forgot-password" 
                className="text-primary text-sm hover:underline"
                data-testid="link-forgot-password"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>


        {/* Back to Website */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            data-testid="link-back-to-website"
          >
            ← Back to Website
          </Link>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent className="sm:max-w-[425px]" data-testid="dialog-password-change">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Password Change Required
            </DialogTitle>
            <DialogDescription>
              For security reasons, you must change your password before accessing your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword('currentPassword')}
                className="mt-2"
                placeholder="Enter your current password"
                data-testid="input-current-password"
              />
              {passwordErrors.currentPassword && (
                <p className="text-destructive text-sm mt-1">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                className="mt-2"
                placeholder="Enter a new secure password"
                data-testid="input-new-password"
              />
              {passwordErrors.newPassword && (
                <p className="text-destructive text-sm mt-1">
                  {passwordErrors.newPassword.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                className="mt-2"
                placeholder="Re-enter your new password"
                data-testid="input-confirm-password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-destructive text-sm mt-1">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Selection Dialog for Google OAuth */}
      <Dialog open={showRoleSelection} onOpenChange={setShowRoleSelection}>
        <DialogContent className="sm:max-w-[425px]" data-testid="dialog-role-selection">
          <DialogHeader>
            <DialogTitle>Select Your Role</DialogTitle>
            <DialogDescription>
              Choose your role to complete your account setup. Google Sign-In is only available for Admin and Teacher roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Button
                type="button"
                variant={selectedRole === 1 ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedRole(1)}
                data-testid="button-role-admin"
              >
                <div className="text-left">
                  <div className="font-semibold">Administrator</div>
                  <div className="text-xs text-muted-foreground">Manage school operations and settings</div>
                </div>
              </Button>

              <Button
                type="button"
                variant={selectedRole === 2 ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedRole(2)}
                data-testid="button-role-teacher"
              >
                <div className="text-left">
                  <div className="font-semibold">Teacher</div>
                  <div className="text-xs text-muted-foreground">Create exams, grade assignments, manage classes</div>
                </div>
              </Button>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!selectedRole || roleSelectionMutation.isPending}
              onClick={() => selectedRole && roleSelectionMutation.mutate(selectedRole)}
              data-testid="button-complete-signup"
            >
              {roleSelectionMutation.isPending ? 'Creating Account...' : 'Complete Sign Up'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}