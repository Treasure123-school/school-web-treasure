import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import schoolLogo from '@assets/1000025432-removebg-preview (1)_1757796555126.png';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (!result.ok) {
        const data = await result.json();
        setError(data.message || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      const userData = await result.json();

      if (userData.user.status === 'pending') {
        setError('Your account is pending approval. Please wait for admin verification.');
        setIsLoading(false);
        return;
      }

      if (userData.user.status === 'suspended') {
        setError('Your account has been suspended. Please contact the administrator.');
        setIsLoading(false);
        return;
      }

      if (userData.user.status === 'disabled') {
        setError('Your account has been disabled. Please contact support.');
        setIsLoading(false);
        return;
      }

      const roleMap: { [key: number]: string } = {
        1: 'admin',
        2: 'teacher',
        3: 'student',
        4: 'parent'
      };

      const userRole = roleMap[userData.user.roleId];
      if (userRole) {
        setLocation(`/portal/${userRole}`);
      } else {
        setError('Unable to determine user role. Please contact support.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md relative glass-card-strong animate-fade-in">
        <CardHeader className="space-y-3 sm:space-y-4 text-center p-4 sm:p-6">
          {/* Logo with responsive sizing */}
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-3 sm:p-4 rounded-2xl shadow-lg ring-2 ring-white dark:ring-gray-800">
              <img
                src={schoolLogo}
                alt="Treasure-Home School"
                className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
              />
            </div>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Sign in to access your Treasure-Home School portal
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Error Alert with modern styling */}
            {error && (
              <Alert variant="destructive" className="modern-alert-error animate-slide-in-right">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="text-xs sm:text-sm ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="modern-form-group">
              <Label htmlFor="email" className="modern-form-label flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`modern-input modern-focus pl-3 sm:pl-4 ${
                    validationErrors.email ? 'border-red-500 focus:ring-red-100' : ''
                  }`}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
                {email && !validationErrors.email && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              {validationErrors.email && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="modern-form-group">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Label htmlFor="password" className="modern-form-label mb-0 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  Password
                </Label>
                <a
                  href="/forgot-password"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  className={`modern-input modern-focus pr-10 sm:pr-12 ${
                    validationErrors.password ? 'border-red-500 focus:ring-red-100' : ''
                  }`}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="bg-white dark:bg-gray-800 px-3 sm:px-4 text-gray-500 dark:text-gray-400 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800 py-2.5 sm:py-3 rounded-xl transition-all duration-300 hover:shadow-md text-sm sm:text-base"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  style={{ fill: '#4285F4' }}
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  style={{ fill: '#34A853' }}
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  style={{ fill: '#FBBC05' }}
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  style={{ fill: '#EA4335' }}
                />
              </svg>
              Sign in with Google
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              New to Treasure-Home School?{' '}
              <a
                href="/contact"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Contact us for access
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}