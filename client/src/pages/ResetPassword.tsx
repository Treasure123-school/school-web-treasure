import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Invalid Reset Link</span>
          </div>
        ),
        description: '❌ No reset token found. Please request a new password reset link.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      if (!token) {
        throw new Error('No reset token found');
      }
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      return await response.json();
    },
    onSuccess: () => {
      setResetSuccess(true);
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Password Reset Successful</span>
          </div>
        ),
        description: '✅ Your password has been reset successfully. You can now login with your new password.',
        className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
      });

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to reset password. The link may have expired.';
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Reset Failed</span>
          </div>
        ),
        description: `❌ ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6" data-testid="link-home">
            <div className="bg-primary rounded-lg p-3">
              <GraduationCap className="text-primary-foreground h-8 w-8" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground">Treasure-Home School</h1>
              <p className="text-sm text-muted-foreground">"Honesty and Success"</p>
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-title">
            Reset Your Password
          </h2>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Create a new secure password for your account
          </p>
        </div>

        <Card className="shadow-lg border border-border" data-testid="card-reset-password">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">Set New Password</CardTitle>
          </CardHeader>
          <CardContent>
            {!resetSuccess && token ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    className="mt-2"
                    placeholder="Enter a new secure password"
                    data-testid="input-new-password"
                  />
                  {errors.newPassword && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-new-password">
                      {errors.newPassword.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    At least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className="mt-2"
                    placeholder="Re-enter your new password"
                    data-testid="input-confirm-password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1" data-testid="error-confirm-password">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Security Tips:</strong> Use a mix of uppercase and lowercase letters, numbers, 
                    and symbols. Avoid using personal information.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-submit"
                >
                  {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            ) : resetSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-semibold mb-2">Password Reset Complete!</p>
                    <p>
                      Your password has been successfully reset. You will be redirected to the login page in a few seconds.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-primary text-sm hover:underline"
                    data-testid="link-login"
                  >
                    Go to Login →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-semibold mb-2">Invalid or Expired Link</p>
                    <p>
                      The password reset link is invalid or has expired. Please request a new one.
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <Link 
                    href="/forgot-password" 
                    className="block text-primary text-sm hover:underline"
                    data-testid="link-forgot-password"
                  >
                    Request New Reset Link
                  </Link>
                  <Link 
                    href="/login" 
                    className="block text-muted-foreground text-sm hover:text-foreground"
                    data-testid="link-login"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
