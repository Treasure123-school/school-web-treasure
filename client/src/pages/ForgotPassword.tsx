import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest('POST', '/api/auth/forgot-password', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setEmailSent(true);
      
      // In development mode, show the reset code and link
      if (data.developmentMode && (data.resetToken || data.resetLink)) {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Reset Code Generated (Dev Mode)</span>
            </div>
          ),
          description: (
            <div className="space-y-2">
              <p>✅ {data.message}</p>
              {data.resetToken && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-300">
                  <p className="text-xs font-semibold mb-1">🔑 Reset Code:</p>
                  <p className="text-sm font-mono font-bold text-blue-700 dark:text-blue-300">
                    {data.resetToken.substring(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Expires in: {data.expiresIn}
                  </p>
                </div>
              )}
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200">
                <p className="text-xs font-semibold mb-1">🔗 Or use this link:</p>
                <a 
                  href={data.resetLink} 
                  className="text-xs text-blue-600 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {data.resetLink}
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 In production, this will be sent to: {data.email}
              </p>
            </div>
          ),
          className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
          duration: 15000, // Show longer for dev mode
        });
      } else {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Reset Link Sent</span>
            </div>
          ),
          description: '✅ If an account exists with that email/username, a password reset link will be sent.',
          className: 'border-green-500 bg-green-50 dark:bg-green-950/50',
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to send reset link. Please try again.';
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>Request Failed</span>
          </div>
        ),
        description: `❌ ${errorMessage}`,
        className: 'border-red-500 bg-red-50 dark:bg-red-950/50',
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
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
            Forgot Password
          </h2>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Enter your username or email to receive a reset link
          </p>
        </div>

        <Card className="shadow-lg border border-border" data-testid="card-forgot-password">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center">Reset Your Password</CardTitle>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
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

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">
                      How Password Reset Works:
                    </p>
                  </div>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-6 list-disc">
                    <li>Enter your username or email address</li>
                    <li>We'll send a reset link to your registered email</li>
                    <li>The link expires in 15 minutes for security</li>
                    <li>Check your spam/junk folder if you don't see it</li>
                    <li>Contact admin if you don't receive the email</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-submit"
                >
                  {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p className="font-semibold mb-2">Check your email!</p>
                    <p>
                      If an account exists with that email/username, a password reset link will be sent. 
                      The link expires in 15 minutes.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Development Note:</strong> In development mode, the reset link is shown in the notification above and server console. 
                      In production, it will be sent via email to the registered address.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-primary text-sm hover:underline"
                    data-testid="link-back-to-login"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </div>
            )}

            {!emailSent && (
              <div className="text-center mt-6">
                <Link 
                  href="/login" 
                  className="text-primary text-sm hover:underline"
                  data-testid="link-back-to-login"
                >
                  ← Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
