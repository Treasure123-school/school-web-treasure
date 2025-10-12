import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';
import {
  User,
  GraduationCap,
  CheckCircle,
  Phone,
  MapPin,
  Mail,
  Users,
  Save,
  AlertCircle
} from 'lucide-react';

interface StudentProfileData {
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  recoveryEmail: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  agreement: boolean;
}

export default function StudentProfileSetup() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<StudentProfileData>({
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    recoveryEmail: user?.recoveryEmail || '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    agreement: false,
  });

  if (!user) {
    return <div>Please log in to continue.</div>;
  }

  // Calculate profile completeness percentage
  const calculateCompleteness = (): number => {
    const totalFields = 9;
    let completedFields = 0;

    if (formData.phone) completedFields++;
    if (formData.address) completedFields++;
    if (formData.emergencyContact) completedFields++;
    if (formData.emergencyPhone) completedFields++;
    if (formData.recoveryEmail) completedFields++;
    if (formData.dateOfBirth) completedFields++;
    if (formData.gender) completedFields++;
    if (formData.bloodGroup) completedFields++;
    if (formData.agreement) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const completeness = calculateCompleteness();

  const createProfileMutation = useMutation({
    mutationFn: async (data: StudentProfileData) => {
      const response = await apiRequest('POST', '/api/student/profile/setup', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to setup profile');
      }
      return response.json();
    },
    onSuccess: () => {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "Profile Setup Complete! 🎉",
        description: "Welcome to your student portal. Your profile has been set up successfully.",
      });

      // Clear draft
      localStorage.removeItem('student_profile_draft');

      // Invalidate profile queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile/status'] });
      queryClient.invalidateQueries({ queryKey: ['student', user.id] });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/portal/student');
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreement) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms and privacy policy to continue.",
        variant: "destructive",
      });
      return;
    }

    if (completeness < 100) {
      toast({
        title: "Incomplete Profile",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    createProfileMutation.mutate(formData);
  };

  const handleChange = (field: keyof StudentProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Student Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Help us get to know you better by completing your profile information
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Profile Completeness
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {completeness}%
              </span>
            </div>
            <Progress value={completeness} className="h-2" />
          </CardContent>
        </Card>

        {/* Profile Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Please provide your contact and personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recoveryEmail">
                    Recovery Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="recoveryEmail"
                      type="email"
                      placeholder="recovery@example.com"
                      value={formData.recoveryEmail}
                      onChange={(e) => handleChange('recoveryEmail', e.target.value)}
                      className="pl-10"
                      data-testid="input-recovery-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    data-testid="input-dob"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange('gender', value)}
                  >
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">
                    Blood Group <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.bloodGroup}
                    onValueChange={(value) => handleChange('bloodGroup', value)}
                  >
                    <SelectTrigger data-testid="select-blood-group">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Home Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="address"
                    placeholder="Enter your full home address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="pl-10 min-h-[80px]"
                    data-testid="input-address"
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">
                      Emergency Contact Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergencyContact"
                      type="text"
                      placeholder="Parent/Guardian name"
                      value={formData.emergencyContact}
                      onChange={(e) => handleChange('emergencyContact', e.target.value)}
                      data-testid="input-emergency-contact"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">
                      Emergency Contact Phone <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        placeholder="Emergency contact number"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                        className="pl-10"
                        data-testid="input-emergency-phone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreement"
                    checked={formData.agreement}
                    onCheckedChange={(checked) => handleChange('agreement', checked)}
                    data-testid="checkbox-agreement"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="agreement"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the terms and privacy policy
                    </label>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, you confirm that all information provided is accurate and you agree to the school's terms of service and privacy policy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createProfileMutation.isPending || completeness < 100}
                  data-testid="button-submit-profile"
                >
                  {createProfileMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>

              {completeness < 100 && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Please complete all required fields to finish your profile setup.
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
