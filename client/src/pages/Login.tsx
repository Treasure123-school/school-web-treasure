import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Eye, EyeOff, Lock, User, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { getRoleNameById, getPortalByRoleId } from '@/lib/roles';
import schoolLogo from '@assets/school-logo.png';

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

type ErrorType = 'validation' | 'credentials' | 'server' | 'account' | null;

interface LoginError {
  type: ErrorType;
  message: string;
}

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const lastErrorRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const showSingleError = (type: ErrorType, message: string) => {
    const errorKey = `${type}-${message}`;
    if (lastErrorRef.current === errorKey) return;
    lastErrorRef.current = errorKey;
    setLoginError({ type, message });
    setTimeout(() => {
      lastErrorRef.current = null;
    }, 5000);
  };

  const clearError = () => {
    setLoginError(null);
    lastErrorRef.current = null;
  };

  const getErrorDetails = (statusType: string, defaultMessage: string): { type: ErrorType; message: string } => {
    switch (statusType) {
      case 'invalid_credentials':
        return { type: 'credentials', message: 'Invalid username or password. Please check your credentials and try again.' };
      case 'pending_staff':
        return { type: 'account', message: 'Your account is awaiting approval. You will be notified once verified.' };
      case 'pending_setup':
        return { type: 'account', message: 'Your account is being set up. Please check back soon.' };
      case 'suspended_staff':
      case 'suspended_parent':
      case 'suspended_student':
        return { type: 'account', message: 'Your account has been suspended. Please contact the school administrator.' };
      default:
        return { type: 'server', message: defaultMessage || 'An error occurred. Please try again.' };
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      clearError();
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();

      if (!response.ok) {
        const { type, message } = getErrorDetails(result.statusType, result.message);
        showSingleError(type, message);
        throw new Error(message);
      }
      return result;
    },
    onSuccess: (data) => {
      clearError();
      if (data.mustChangePassword || data.user.mustChangePassword) {
        setTempUserData(data);
        setShowPasswordChange(true);
        return;
      }

      const userRole = getRoleNameById(data.user.roleId);
      const targetPath = getPortalByRoleId(data.user.roleId);

      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to your ${userRole} dashboard...`,
        className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
        duration: 3000,
      });

      login(data.user, data.token);
      setTimeout(() => navigate(targetPath), 200);
    },
    onError: () => {},
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
        const result = await response.json();
        
        if (!response.ok) {
          if (previousToken) {
            localStorage.setItem('token', previousToken);
          } else {
            localStorage.removeItem('token');
          }
          throw new Error(result.message || 'Failed to change password');
        }
        
        return result;
      } catch (error: any) {
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
        title: "Password Changed",
        description: 'Your password has been updated successfully.',
        className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
        duration: 3000,
      });

      setTimeout(() => navigate(targetPath), 100);
    },
    onError: (error: any) => {
      toast({
        title: 'Password Change Failed',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    clearError();
    loginMutation.mutate(data);
  };

  const onPasswordChange = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white dark:bg-gray-900 overflow-hidden" data-testid="card-login">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
              <Link href="/" className="inline-block mb-4" data-testid="link-home">
                <img
                  src={schoolLogo}
                  alt="Treasure-Home School Logo"
                  className="h-20 w-20 sm:h-24 sm:w-24 mx-auto rounded-full bg-white p-1 shadow-lg"
                  data-testid="img-school-logo"
                />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-white" data-testid="text-school-name">
                Treasure-Home School
              </h1>
              <p className="text-blue-100 text-sm mt-1 italic">Honesty and Success</p>
            </div>

            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-login-title">
                  Portal Login
                </h2>
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-login-subtitle">
                  Sign in to access your dashboard
                </p>
              </div>

              {loginError && (
                <div 
                  className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                    loginError.type === 'credentials' 
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
                      : loginError.type === 'account'
                      ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  }`}
                  data-testid="error-login-message"
                >
                  <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    loginError.type === 'account' ? 'text-orange-600' : 'text-red-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      loginError.type === 'account' ? 'text-orange-800 dark:text-orange-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {loginError.type === 'credentials' && 'Login Failed'}
                      {loginError.type === 'account' && 'Account Status'}
                      {loginError.type === 'server' && 'Connection Error'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      loginError.type === 'account' ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {loginError.message}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Username or Email
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    {...register('identifier')}
                    className="h-12 text-base"
                    placeholder="Enter your username or email"
                    autoComplete="username"
                    data-testid="input-identifier"
                    onChange={() => loginError?.type === 'validation' && clearError()}
                  />
                  {errors.identifier && (
                    <p className="text-destructive text-sm flex items-center gap-1" data-testid="error-identifier">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register('password')}
                      className="h-12 text-base pr-12"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      data-testid="input-password"
                      onChange={() => loginError?.type === 'validation' && clearError()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-sm flex items-center gap-1" data-testid="error-password">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1.5 transition-colors"
                    data-testid="link-forgot-password"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing In...
                    </span>
                  ) : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Use your THS credentials to access your portal
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-white/90 hover:text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
              data-testid="link-back-home"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Website
            </Link>
          </div>
        </div>
      </div>

      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-password-change">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5 text-orange-500" />
              Change Your Password
            </DialogTitle>
            <DialogDescription>
              For security, you must change your password before accessing your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...registerPassword('currentPassword')}
                  className="h-11 pr-10"
                  placeholder="Enter current password"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-current-password"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-destructive text-sm">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...registerPassword('newPassword')}
                  className="h-11 pr-10"
                  placeholder="Enter new password (min. 6 characters)"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-new-password"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-destructive text-sm">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...registerPassword('confirmPassword')}
                  className="h-11 pr-10"
                  placeholder="Confirm your new password"
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-destructive text-sm">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Password...
                </span>
              ) : 'Update Password'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
