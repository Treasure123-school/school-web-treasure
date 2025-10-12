import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, CheckCircle2, Copy, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  classCode: z.string().min(1, 'Please select a class'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Please select a gender' }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  parentEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  parentPhone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
}).refine((data) => data.parentEmail || data.parentPhone, {
  message: 'At least one parent contact (email or phone) is required',
  path: ['parentEmail']
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface PreviewData {
  suggestedUsername: string;
  parentExists: boolean;
}

interface RegistrationResult {
  studentUsername: string;
  parentCreated: boolean;
  parentUsername?: string;
  parentPassword?: string;
  message: string;
}

export default function StudentRegistration() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      classCode: '',
      gender: undefined,
      dateOfBirth: '',
      parentEmail: '',
      parentPhone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const handlePreview = async () => {
    const isValid = await form.trigger(['fullName', 'classCode', 'gender', 'dateOfBirth', 'parentEmail', 'parentPhone']);
    
    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly',
        variant: 'destructive'
      });
      return;
    }

    setIsPreviewLoading(true);
    setErrors([]);

    try {
      const values = form.getValues();
      const response = await fetch('/api/self-register/student/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.fullName,
          classCode: values.classCode,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
          parentEmail: values.parentEmail,
          parentPhone: values.parentPhone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || ['Failed to generate preview']);
        return;
      }

      setPreview(data);
      toast({
        title: 'Preview Generated',
        description: `Your username will be: ${data.suggestedUsername}`,
      });
    } catch (error) {
      setErrors(['Failed to connect to server. Please try again.']);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch('/api/self-register/student/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          classCode: data.classCode,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
          password: data.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors(result.errors || ['Registration failed. Please try again.']);
        return;
      }

      setRegistrationResult(result);
      toast({
        title: 'Registration Successful!',
        description: 'Your account has been created successfully.',
      });
    } catch (error) {
      setErrors(['Failed to connect to server. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Credentials copied to clipboard',
    });
  };

  const printCredentials = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg" data-testid="card-registration">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Student Self-Registration
            </CardTitle>
            <CardDescription>
              Create your student account. A parent account will be automatically created or linked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors.length > 0 && (
              <Alert variant="destructive" className="mb-4" data-testid="alert-errors">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your full name" data-testid="input-fullname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-class">
                            <SelectValue placeholder="Select your class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PR1">Playgroup (PG)</SelectItem>
                          <SelectItem value="PR2">Nursery (N)</SelectItem>
                          <SelectItem value="PR3">Reception (R)</SelectItem>
                          <SelectItem value="BS1">Basic 1</SelectItem>
                          <SelectItem value="BS2">Basic 2</SelectItem>
                          <SelectItem value="BS3">Basic 3</SelectItem>
                          <SelectItem value="BS4">Basic 4</SelectItem>
                          <SelectItem value="BS5">Basic 5</SelectItem>
                          <SelectItem value="BS6">Basic 6</SelectItem>
                          <SelectItem value="JS1">JSS 1</SelectItem>
                          <SelectItem value="JS2">JSS 2</SelectItem>
                          <SelectItem value="JS3">JSS 3</SelectItem>
                          <SelectItem value="SS1">SSS 1</SelectItem>
                          <SelectItem value="SS2">SSS 2</SelectItem>
                          <SelectItem value="SS3">SSS 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" max={new Date().toISOString().split('T')[0]} data-testid="input-dob" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="parent@example.com" data-testid="input-parent-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="+234 XXX XXX XXXX" data-testid="input-parent-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Create password"
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm password"
                              data-testid="input-confirm-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                              data-testid="button-toggle-confirm-password"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {preview && (
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" data-testid="alert-preview">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <p><strong>Your username will be:</strong> {preview.suggestedUsername}</p>
                      {preview.parentExists && (
                        <p className="mt-1 text-sm">Note: An existing parent account will be linked to your student account.</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={isPreviewLoading || isSubmitting}
                    className="flex-1"
                    data-testid="button-preview"
                  >
                    {isPreviewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Preview Username
                  </Button>

                  <Button
                    type="submit"
                    disabled={!preview || isSubmitting}
                    className="flex-1"
                    data-testid="button-submit"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                    Login here
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Success Dialog */}
        <Dialog open={!!registrationResult} onOpenChange={(open) => !open && setRegistrationResult(null)}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-success">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Registration Successful!
              </DialogTitle>
              <DialogDescription>
                Please save your credentials securely. You will need them to login.
              </DialogDescription>
            </DialogHeader>

            {registrationResult && (
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Student Username</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border text-sm" data-testid="text-student-username">
                        {registrationResult.studentUsername}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(registrationResult.studentUsername)}
                        data-testid="button-copy-student-username"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {registrationResult.parentCreated && registrationResult.parentUsername && (
                    <>
                      <div>
                        <Label className="text-sm font-semibold">Parent Username</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border text-sm" data-testid="text-parent-username">
                            {registrationResult.parentUsername}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(registrationResult.parentUsername!)}
                            data-testid="button-copy-parent-username"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold">Parent Temporary Password</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded border text-sm font-mono" data-testid="text-parent-password">
                            {registrationResult.parentPassword}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(registrationResult.parentPassword!)}
                            data-testid="button-copy-parent-password"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          ⚠️ This password is shown only once. Parent will be required to change it on first login.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={printCredentials}
                    className="flex-1"
                    data-testid="button-print"
                  >
                    Print Credentials
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/login'}
                    className="flex-1"
                    data-testid="button-goto-login"
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
