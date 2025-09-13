import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
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
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });



  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return await response.json();
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
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      login(userData.user);
      
      // Navigate to appropriate portal based on user's ACTUAL role from database
      const userRole = getRoleNameById(userData.user.roleId);
      const targetPath = getPortalByRoleId(userData.user.roleId);
      navigate(targetPath);
      
      toast({
        title: 'Login Successful',
        description: `Welcome to your ${userRole} portal!`,
      });
    },
    onError: () => {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials or role mismatch. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };


  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
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
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-login-title">
            Portal Login
          </h2>
          <p className="text-muted-foreground" data-testid="text-login-subtitle">
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="mt-2"
                  placeholder="Enter your email"
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="text-destructive text-sm mt-1" data-testid="error-email">
                    {errors.email.message}
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

              {/* Info about role-based access */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Automatic Portal Assignment:</strong> You'll be redirected to the appropriate dashboard based on your account type.
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

            <div className="text-center mt-6">
              <Link 
                href="#" 
                className="text-primary text-sm hover:underline"
                data-testid="link-forgot-password"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6 shadow-sm border border-border" data-testid="card-demo-credentials">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 text-center">Demo Credentials</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">Student:</span>
                <span className="text-muted-foreground">student@demo.com / demo123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Teacher:</span>
                <span className="text-muted-foreground">teacher@demo.com / demo123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Parent:</span>
                <span className="text-muted-foreground">parent@demo.com / demo123</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <span className="text-muted-foreground">admin@demo.com / demo123</span>
              </div>
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
    </div>
  );
}
