import PublicLayout from '@/components/layout/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const contactMutation = useMutation({
    mutationFn: (data: ContactForm) => apiRequest('POST', '/api/contact', data),
    onSuccess: () => {
      toast({
        title: 'Message Sent!',
        description: 'Thank you for your message. We will get back to you soon.',
      });
      reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  const contactInfo = [
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Address',
      content: 'Seriki-Soyinka Ifo, Ogun State',
      color: 'primary'
    },
    {
      icon: 'fas fa-phone',
      title: 'Phone',
      content: '08037906249, 08107921359',
      color: 'secondary'
    },
    {
      icon: 'fas fa-envelope',
      title: 'Email',
      content: 'treasurehomeschool@gmail.com',
      color: 'green'
    },
    {
      icon: 'fas fa-clock',
      title: 'Office Hours',
      content: 'Monday - Friday: 8:00 AM - 4:00 PM',
      color: 'blue'
    }
  ];

  const departments = [
    {
      name: 'Admissions Office',
      phone: '08037906249',
      email: 'admissions@treasurehomeschool.com',
      description: 'For all admission inquiries and application processes'
    },
    {
      name: 'Academic Office',
      phone: '08107921359',
      email: 'academics@treasurehomeschool.com',
      description: 'For academic matters, curriculum, and student progress'
    },
    {
      name: 'General Inquiries',
      phone: '08037906249',
      email: 'info@treasurehomeschool.com',
      description: 'For general questions and information about the school'
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="hero-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6" data-testid="text-contact-title">
            Get in Touch
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto" data-testid="text-contact-subtitle">
            We're here to answer your questions and help you discover the Treasure-Home difference
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-contact-info-title">
              Contact Information
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-contact-info-description">
              Reach out to us through any of these channels. We're always happy to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="card-hover shadow-sm border border-border" data-testid={`card-contact-info-${index}`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                    info.color === 'primary' ? 'bg-primary/10' :
                    info.color === 'secondary' ? 'bg-secondary/10' :
                    info.color === 'green' ? 'bg-green-100' :
                    'bg-blue-100'
                  }`}>
                    <i className={`${info.icon} ${
                      info.color === 'primary' ? 'text-primary' :
                      info.color === 'secondary' ? 'text-secondary' :
                      info.color === 'green' ? 'text-green-600' :
                      'text-blue-600'
                    } text-xl`}></i>
                  </div>
                  <h3 className="font-semibold mb-2" data-testid={`text-contact-info-title-${index}`}>
                    {info.title}
                  </h3>
                  <p className="text-muted-foreground text-sm" data-testid={`text-contact-info-content-${index}`}>
                    {info.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-sm border border-border" data-testid="card-contact-form">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6" data-testid="text-form-title">
                  Send us a Message
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className="mt-2"
                      data-testid="input-name"
                    />
                    {errors.name && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-name">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="mt-2"
                      data-testid="input-email"
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-email">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      {...register('message')}
                      className="mt-2"
                      data-testid="input-message"
                    />
                    {errors.message && (
                      <p className="text-destructive text-sm mt-1" data-testid="error-message">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={contactMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {contactMutation.isPending ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* School Location */}
            <Card className="shadow-sm border border-border" data-testid="card-location">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6" data-testid="text-location-title">
                  Visit Our Campus
                </h2>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-1">
                      <i className="fas fa-map-marker-alt text-primary"></i>
                    </div>
                    <div>
                      <p className="font-medium">School Address</p>
                      <p className="text-muted-foreground text-sm" data-testid="text-school-address">
                        Seriki-Soyinka Ifo, Ogun State, Nigeria
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-secondary/10 p-2 rounded-lg mt-1">
                      <i className="fas fa-car text-secondary"></i>
                    </div>
                    <div>
                      <p className="font-medium">Transportation</p>
                      <p className="text-muted-foreground text-sm" data-testid="text-transportation">
                        School bus services available. Easy access from major roads in Ogun State.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg mt-1">
                      <i className="fas fa-calendar text-green-600"></i>
                    </div>
                    <div>
                      <p className="font-medium">Visit Hours</p>
                      <p className="text-muted-foreground text-sm" data-testid="text-visit-hours">
                        Monday - Friday: 9:00 AM - 3:00 PM<br />
                        Saturday: 10:00 AM - 1:00 PM (By appointment)
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" data-testid="button-schedule-visit">
                  Schedule a Campus Visit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Department Contacts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-departments-title">
              Department Contacts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-departments-description">
              Connect directly with specific departments for specialized assistance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {departments.map((dept, index) => (
              <Card key={index} className="card-hover shadow-sm border border-border" data-testid={`card-department-${index}`}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3" data-testid={`text-department-name-${index}`}>
                    {dept.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4" data-testid={`text-department-description-${index}`}>
                    {dept.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-phone text-primary text-sm"></i>
                      <span className="text-sm" data-testid={`text-department-phone-${index}`}>
                        {dept.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-envelope text-primary text-sm"></i>
                      <span className="text-sm" data-testid={`text-department-email-${index}`}>
                        {dept.email}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
