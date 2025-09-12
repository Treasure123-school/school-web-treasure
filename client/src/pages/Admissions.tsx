import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AdmissionForm>({
    resolver: zodResolver(admissionSchema),
  });

  const admissionMutation = useMutation({
    mutationFn: (data: AdmissionForm) => apiRequest('POST', '/api/admissions', data),
    onSuccess: () => {
      toast({
        title: 'Application Submitted!',
        description: 'Thank you for your application. We will contact you soon with next steps.',
      });
      reset();
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
      icon: 'fas fa-file-alt'
    },
    {
      step: '2',
      title: 'Document Review',
      description: 'Our admissions team reviews your application and supporting documents.',
      icon: 'fas fa-search'
    },
    {
      step: '3',
      title: 'Assessment & Interview',
      description: 'Student assessment and parent interview (if applicable for the grade level).',
      icon: 'fas fa-user-check'
    },
    {
      step: '4',
      title: 'Admission Decision',
      description: 'Receive admission decision and enrollment instructions within 5-7 business days.',
      icon: 'fas fa-check-circle'
    }
  ];

  const requirements = [
    'Completed application form',
    'Birth certificate or passport copy',
    'Recent passport photographs (2 copies)',
    'Previous school report cards (if applicable)',
    'Medical examination report',
    'Immunization records',
    'Transfer certificate (for students from other schools)',
    'Application fee payment receipt'
  ];

  const classOptions = [
    'Playgroup',
    'Nursery 1',
    'Nursery 2',
    'Primary 1',
    'Primary 2',
    'Primary 3',
    'Primary 4',
    'Primary 5',
    'Primary 6',
    'JSS 1',
    'JSS 2',
    'JSS 3',
    'SSS 1',
    'SSS 2',
    'SSS 3'
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6" data-testid="text-admissions-title">
            Join Treasure-Home School
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto" data-testid="text-admissions-subtitle">
            Begin your child's journey to academic excellence and moral development
          </p>
        </div>
      </section>

      {/* Admission Process */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-process-title">
              Admission Process
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-process-description">
              Our streamlined admission process ensures a smooth enrollment experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {admissionProcess.map((process, index) => (
              <Card key={index} className="card-hover shadow-sm border border-border text-center" data-testid={`card-process-${index}`}>
                <CardContent className="p-6">
                  <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-foreground font-bold">{process.step}</span>
                  </div>
                  <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <i className={`${process.icon} text-primary text-xl`}></i>
                  </div>
                  <h3 className="font-semibold mb-3" data-testid={`text-process-title-${index}`}>
                    {process.title}
                  </h3>
                  <p className="text-muted-foreground text-sm" data-testid={`text-process-description-${index}`}>
                    {process.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements & Application Form */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Requirements */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm border border-border" data-testid="card-requirements">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-clipboard-list text-primary"></i>
                    <span data-testid="text-requirements-title">Required Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-3" data-testid={`requirement-${index}`}>
                        <div className="bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="fas fa-check text-primary text-xs"></i>
                        </div>
                        <span className="text-sm text-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fas fa-money-bill text-secondary"></i>
                      <span className="font-semibold text-sm">Application Fee</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ₦5,000 (Non-refundable application processing fee)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Application Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm border border-border" data-testid="card-application-form">
                <CardHeader>
                  <CardTitle data-testid="text-form-title">Application Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Student Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">Student Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="studentName">Student Full Name *</Label>
                          <Input
                            id="studentName"
                            {...register('studentName')}
                            className="mt-2"
                            data-testid="input-student-name"
                          />
                          {errors.studentName && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-student-name">
                              {errors.studentName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            {...register('dateOfBirth')}
                            className="mt-2"
                            data-testid="input-date-of-birth"
                          />
                          {errors.dateOfBirth && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-date-of-birth">
                              {errors.dateOfBirth.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Gender *</Label>
                          <Select onValueChange={(value) => setValue('gender', value)}>
                            <SelectTrigger className="mt-2" data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.gender && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-gender">
                              {errors.gender.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Class Applying For *</Label>
                          <Select onValueChange={(value) => setValue('classApplying', value)}>
                            <SelectTrigger className="mt-2" data-testid="select-class">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classOptions.map((classOption) => (
                                <SelectItem key={classOption} value={classOption}>
                                  {classOption}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.classApplying && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-class-applying">
                              {errors.classApplying.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Parent/Guardian Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">Parent/Guardian Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                          <Input
                            id="parentName"
                            {...register('parentName')}
                            className="mt-2"
                            data-testid="input-parent-name"
                          />
                          {errors.parentName && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-parent-name">
                              {errors.parentName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="parentEmail">Email Address *</Label>
                          <Input
                            id="parentEmail"
                            type="email"
                            {...register('parentEmail')}
                            className="mt-2"
                            data-testid="input-parent-email"
                          />
                          {errors.parentEmail && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-parent-email">
                              {errors.parentEmail.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="parentPhone">Phone Number *</Label>
                          <Input
                            id="parentPhone"
                            {...register('parentPhone')}
                            className="mt-2"
                            data-testid="input-parent-phone"
                          />
                          {errors.parentPhone && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-parent-phone">
                              {errors.parentPhone.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="address">Home Address *</Label>
                          <Input
                            id="address"
                            {...register('address')}
                            className="mt-2"
                            data-testid="input-address"
                          />
                          {errors.address && (
                            <p className="text-destructive text-sm mt-1" data-testid="error-address">
                              {errors.address.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-foreground">Additional Information</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="previousSchool">Previous School (if applicable)</Label>
                          <Input
                            id="previousSchool"
                            {...register('previousSchool')}
                            className="mt-2"
                            data-testid="input-previous-school"
                          />
                        </div>

                        <div>
                          <Label htmlFor="medicalInfo">Medical Information / Allergies</Label>
                          <Textarea
                            id="medicalInfo"
                            rows={3}
                            {...register('medicalInfo')}
                            className="mt-2"
                            placeholder="Please list any medical conditions, allergies, or special needs"
                            data-testid="input-medical-info"
                          />
                        </div>

                        <div>
                          <Label htmlFor="additionalInfo">Additional Comments</Label>
                          <Textarea
                            id="additionalInfo"
                            rows={3}
                            {...register('additionalInfo')}
                            className="mt-2"
                            placeholder="Any additional information you'd like us to know"
                            data-testid="input-additional-info"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={admissionMutation.isPending}
                      data-testid="button-submit-application"
                    >
                      {admissionMutation.isPending ? 'Submitting Application...' : 'Submit Application'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6" data-testid="text-contact-title">
            Need Help with Your Application?
          </h2>
          <p className="text-muted-foreground text-lg mb-8" data-testid="text-contact-description">
            Our admissions team is here to assist you throughout the process
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center" data-testid="contact-phone">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-phone text-primary"></i>
              </div>
              <h3 className="font-semibold mb-1">Call Us</h3>
              <p className="text-muted-foreground text-sm">08037906249, 08107921359</p>
            </div>
            
            <div className="text-center" data-testid="contact-email">
              <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-envelope text-secondary"></i>
              </div>
              <h3 className="font-semibold mb-1">Email Us</h3>
              <p className="text-muted-foreground text-sm">admissions@treasurehomeschool.com</p>
            </div>
            
            <div className="text-center" data-testid="contact-visit">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-map-marker-alt text-green-600"></i>
              </div>
              <h3 className="font-semibold mb-1">Visit Us</h3>
              <p className="text-muted-foreground text-sm">Seriki-Soyinka Ifo, Ogun State</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
