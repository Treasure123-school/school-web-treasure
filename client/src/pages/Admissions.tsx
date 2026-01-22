import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  UserCheck, 
  CheckCircle, 
  ClipboardList, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  User, 
  Home, 
  ArrowRight,
  Info
} from 'lucide-react';

const admissionSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  classApplying: z.string().min(1, 'Class applying for is required'),
  parentName: z.string().min(1, 'Parent/Guardian name is required'),
  parentEmail: z.string().email('Please enter a valid email'),
  parentPhone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(1, 'Address is required'),
  previousSchool: z.string().optional(),
  medicalInfo: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type AdmissionForm = z.infer<typeof admissionSchema>;

export default function Admissions() {
  const { toast } = useToast();
  
  const form = useForm<AdmissionForm>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      studentName: '',
      dateOfBirth: '',
      gender: '',
      classApplying: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      address: '',
      previousSchool: '',
      medicalInfo: '',
      additionalInfo: '',
    },
  });

  const admissionMutation = useMutation({
    mutationFn: (data: AdmissionForm) => apiRequest('POST', '/api/admissions', data),
    onSuccess: () => {
      toast({
        title: 'Application Submitted!',
        description: 'Thank you for your application. We will contact you soon with next steps.',
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AdmissionForm) => {
    admissionMutation.mutate(data);
  };

  const admissionProcess = [
    {
      step: '1',
      title: 'Submit Application',
      description: 'Complete and submit the online application form with required documents.',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      step: '2',
      title: 'Document Review',
      description: 'Our admissions team reviews your application and supporting documents.',
      icon: Search,
      color: 'bg-purple-500'
    },
    {
      step: '3',
      title: 'Assessment & Interview',
      description: 'Student assessment and parent interview (if applicable for the grade level).',
      icon: UserCheck,
      color: 'bg-amber-500'
    },
    {
      step: '4',
      title: 'Admission Decision',
      description: 'Receive admission decision and enrollment instructions within 5-7 business days.',
      icon: CheckCircle,
      color: 'bg-emerald-500'
    }
  ];

  const requirements = [
    'Completed application form',
    'Birth certificate or passport copy',
    'Recent passport photographs (2 copies)',
    'Previous school report cards',
    'Medical examination report',
    'Immunization records',
    'Transfer certificate',
    'Application fee receipt'
  ];

  const classOptions = [
    'Playgroup', 'Nursery 1', 'Nursery 2',
    'Primary 1', 'Primary 2', 'Primary 3',
    'Primary 4', 'Primary 5', 'Primary 6',
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1', 'SSS 2', 'SSS 3'
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070')] bg-cover bg-center opacity-10"></div>
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white backdrop-blur-md hover:bg-white/30 px-4 py-1 text-sm font-medium">
            Enrollment Open 2026/2027
          </Badge>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl" data-testid="text-admissions-title">
            Join Treasure-Home School
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl" data-testid="text-admissions-subtitle">
            Begin your child's journey to academic excellence and moral development in a nurturing environment.
          </p>
        </div>
      </section>

      {/* Admission Process */}
      <section className="py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-process-title">
              Admission Process
            </h2>
            <div className="mx-auto mb-4 h-1 w-20 rounded bg-primary"></div>
            <p className="mx-auto max-w-2xl text-muted-foreground" data-testid="text-process-description">
              Our streamlined admission process ensures a smooth and transparent enrollment experience for every family.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {admissionProcess.map((process, index) => (
              <div key={index} className="group relative flex flex-col items-center text-center" data-testid={`card-process-${index}`}>
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${process.color} text-white shadow-lg transition-transform group-hover:scale-110`}>
                  <process.icon className="h-8 w-8" />
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-primary text-xs font-bold text-white dark:border-background">
                    {process.step}
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold" data-testid={`text-process-title-${index}`}>
                  {process.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-process-description-${index}`}>
                  {process.description}
                </p>
                {index < admissionProcess.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[65%] w-[70%] border-t-2 border-dashed border-muted"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements & Form */}
      <section className="bg-muted/30 py-20 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Requirements */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="overflow-hidden border-none shadow-xl ring-1 ring-border" data-testid="card-requirements">
                <CardHeader className="bg-primary p-6 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-6 w-6" />
                    <span>Required Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-start gap-3" data-testid={`requirement-${index}`}>
                        <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium leading-tight">{req}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                    <div className="mb-2 flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">Application Fee</span>
                    </div>
                    <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                      ₦5,000 (Non-refundable). Pay at the school bursary or via bank transfer before submission.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md ring-1 ring-border">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-bold">Admission Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="text-sm font-bold">Jan 15 - Apr 30</p>
                        <p className="text-xs text-muted-foreground">General Application Period</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-2 w-2 mt-2 rounded-full bg-muted"></div>
                      <div>
                        <p className="text-sm font-bold">May 15 - Jun 15</p>
                        <p className="text-xs text-muted-foreground">Entrance Assessments</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-8">
              <Card className="border-none shadow-2xl ring-1 ring-border" data-testid="card-application-form">
                <CardHeader className="border-b bg-card p-6 sm:p-8">
                  <CardTitle className="text-2xl font-bold tracking-tight">Application for Admission</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Please fill in all the required fields carefully.</p>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                      {/* Section 1: Student */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2 text-primary">
                          <User className="h-5 w-5" />
                          <h3 className="text-lg font-bold uppercase tracking-wider">Student Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="studentName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Student Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} data-testid="input-student-name" />
                                </FormControl>
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
                                  <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="date" className="pl-10" {...field} data-testid="input-date-of-birth" />
                                  </div>
                                </FormControl>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-gender">
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="classApplying"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Class Applying For *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-class">
                                      <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {classOptions.map((opt) => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Section 2: Parent */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2 text-primary">
                          <Home className="h-5 w-5" />
                          <h3 className="text-lg font-bold uppercase tracking-wider">Parent/Guardian Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="parentName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parent/Guardian Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Mr/Mrs. Smith" {...field} data-testid="input-parent-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="parentEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="email" className="pl-10" placeholder="parent@example.com" {...field} data-testid="input-parent-email" />
                                  </div>
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
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-10" placeholder="080 0000 0000" {...field} data-testid="input-parent-phone" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Home Address *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-10" placeholder="123 Street Name" {...field} data-testid="input-address" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Section 3: Additional */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2 text-primary">
                          <GraduationCap className="h-5 w-5" />
                          <h3 className="text-lg font-bold uppercase tracking-wider">Additional Details</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <FormField
                            control={form.control}
                            name="previousSchool"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Previous School (if applicable)</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-previous-school" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="medicalInfo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Medical Information / Allergies</FormLabel>
                                <FormControl>
                                  <Textarea rows={3} placeholder="Please list any medical conditions or allergies..." {...field} data-testid="input-medical-info" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        size="lg"
                        className="w-full text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" 
                        disabled={admissionMutation.isPending}
                        data-testid="button-submit-application"
                      >
                        {admissionMutation.isPending ? (
                          'Processing...'
                        ) : (
                          <>
                            Submit Application
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight" data-testid="text-contact-title">
            Need Help with Your Application?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-muted-foreground text-lg" data-testid="text-contact-description">
            Our dedicated admissions team is available to assist you throughout the enrollment journey.
          </p>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl bg-muted/50 p-8 shadow-sm transition-colors hover:bg-muted" data-testid="contact-phone">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Call Us</h3>
              <p className="text-muted-foreground">08037906249, 08107921359</p>
            </div>
            
            <div className="flex flex-col items-center rounded-2xl bg-muted/50 p-8 shadow-sm transition-colors hover:bg-muted" data-testid="contact-email">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Email Us</h3>
              <p className="text-muted-foreground">admissions@treasurehomeschool.com</p>
            </div>
            
            <div className="flex flex-col items-center rounded-2xl bg-muted/50 p-8 shadow-sm transition-colors hover:bg-muted" data-testid="contact-visit">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Visit Us</h3>
              <p className="text-muted-foreground">Seriki-Soyinka Ifo, Ogun State</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
