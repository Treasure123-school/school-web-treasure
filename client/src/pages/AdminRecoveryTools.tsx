import React, { useState, useEffect } from 'react';
import { Button, Input, Label, Form, Toast, toast } from '@/components/ui';
import { Shield, Key, Mail, AlertCircle, CheckCircle, UserCog, XCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'hookform/react';
import * as z from 'zod';

const passwordResetSchema = z.object({
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters long',
  }),
  confirmPassword: z.string().min(8, {
    message: 'Password must be at least 8 characters long',
  }),
});

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export default function ForgotPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      // Optionally redirect or show an error if no token is provided
      // router.push('/login');
    }
  }, [token, router]);

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  async function onSubmit(data: PasswordResetFormValues) {
    if (data.password !== data.confirmPassword) {
      form.setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Password reset failed');
      }

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Password Reset Successful</span>
          </div>
        ),
        description: 'User password has been reset. They will receive an email notification.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Password Reset Failed</span>
          </div>
        ),
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  placeholder="Enter your new password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register('confirmPassword')}
                  placeholder="Confirm your new password"
                  className="mt-1"
                />
                {form.errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">
                    {form.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

// Placeholder for AdminRecoveryTools.tsx - not provided in the changes
// Assume it exists and is correctly implemented as per the thought process.

// Placeholder for Login.tsx - not provided in the changes
// Assume it exists and is correctly implemented as per the thought process.