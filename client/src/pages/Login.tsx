import { useState } from 'react';
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
import { getRoleNameById, getPortalByRoleId } from '@/lib/roles';
import { useQueryClient } from '@tanstack/react-query';


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
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
        const statusType = result.statusType;

        switch (statusType) {
          case 'invalid_credentials':
            toast({
              title: "Invalid Login",
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
              title: "Account Awaiting Approval",
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
              title: "Account Setup Pending",
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
              title: "Account Suspended",
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
            toast({
              title: "🔒 Account Suspended - Security Alert",
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
                          📧 <strong>Email:</strong> <span className="font-mono text-[10px] sm:text-xs">admin@treasurehomeschool.com</span>
                        </p>
                        <p>
                          📱 <strong>Call:</strong> <span className="font-mono text-[10px] sm:text-xs">+234-XXX-XXX-XXXX</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-300 dark:border-gray-700">
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <strong>🔐 Why this happened:</strong> After several unsuccessful login attempts, we automatically suspend parent accounts to prevent unauthorized access to student data.
                    </p>
                  </div>
                </div>
              ),
              className: 'border-red-600 bg-red-50 dark:bg-red-950/50 shadow-xl max-w-[90vw] sm:max-w-md',
              duration: 15000,
            });
            break;
          case 'suspended_student':
            toast({
              title: "🔒 Account Suspended - Security Alert",
              description: (
                <div className="text-xs sm:text-sm space-y-2 sm:space-y-3">
                  <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-md border-2 border-red-400 dark:border-red-600">
                    <p className="font-bold text-red-900 dark:text-red-100 mb-1.5 sm:mb-2 text-sm sm:text-base break-words">
                      ⚠️ Access Blocked for Your Safety
                    </p>
                    <p className="text-red-800 dark:text-red-200 leading-relaxed text-xs sm:text-sm">
                      Your student account has been <strong>automatically suspended</strong> due to multiple failed login attempts.
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
                          📧 <strong>Email:</strong> <span className="font-mono text-[10px] sm:text-xs">admin@treasurehomeschool.com</span>
                        </p>
                        <p>
                          📱 <strong>Call:</strong> <span className="font-mono text-[10px] sm:text-xs">+234-XXX-XXX-XXXX</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ),
              className: 'border-red-600 bg-red-50 dark:bg-red-950/50 shadow-xl max-w-[90vw] sm:max-w-md',
              duration: 12000,
            });
            break;
          default:
            toast({
              title: "Login Failed",
              description: result.message || 'An error occurred during login. Please try again.',
              variant: 'destructive',
            });
        }

        throw new Error(result.message || 'Login failed');
      }

      return result;
    },
    onSuccess: (data) => {
      // Check if user must change password (applies to all newly created accounts)
      if (data.mustChangePassword || data.user.mustChangePassword) {
        console.log('🔐 Password change required for user:', data.user.username);
        setTempUserData(data);
        setShowPasswordChange(true);
        return;
      }

      const userRole = getRoleNameById(data.user.roleId);
      const targetPath = getPortalByRoleId(data.user.roleId);

      toast({
        title: "Login Successful",
        description: `Welcome back to THS Portal. Redirecting you to your ${userRole} dashboard...`,
        className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
      });

      login(data.user, data.token);

      setTimeout(() => {
        navigate(targetPath);
      }, 200);
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
        title: "Password Changed Successfully",
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

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onPasswordChange = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
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

              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      For All Users
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed mb-2">
                      Use your THS username and password to access your portal.
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
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...registerPassword('currentPassword')}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                  placeholder="Enter your current password"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="toggle-current-password-visibility"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-destructive text-xs sm:text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...registerPassword('newPassword')}
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                  placeholder="Enter a new secure password"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="toggle-new-password-visibility"
                  title={showNewPassword ? "Hide passwords" : "Show passwords"}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
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
                type={showNewPassword ? "text" : "password"}
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
    </div>
  );
}
