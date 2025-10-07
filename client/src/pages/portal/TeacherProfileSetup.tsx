import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { ChevronRight, ChevronLeft, Upload, CheckCircle, User, GraduationCap, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function TeacherProfileSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    staffId: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    
    // Academic & Professional Details
    qualification: '',
    specialization: '',
    yearsOfExperience: '',
    subjects: [] as string[],
    assignedClasses: [] as string[],
    department: '',
    
    // Operational Preferences
    gradingMode: '100_marks',
    notificationPreference: 'email',
    availability: '',
    signatureFile: null as File | null,
    
    // Agreement
    agreedToPolicy: false
  });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/teacher/profile'],
    enabled: !!user
  });

  const { data: classes } = useQuery({
    queryKey: ['/api/classes'],
    enabled: currentStep === 2
  });

  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
    enabled: currentStep === 2
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest('/api/teacher/profile', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Submitted Successfully",
        description: "Your profile has been submitted for admin verification. You will be notified once it's approved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/profile'] });
      setLocation('/portal/teacher');
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleClassToggle = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(classId)
        ? prev.assignedClasses.filter(c => c !== classId)
        : [...prev.assignedClasses, classId]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, signatureFile: e.target.files![0] }));
    }
  };

  const canProceedStep1 = formData.staffId && formData.phone && formData.dateOfBirth && formData.gender;
  const canProceedStep2 = formData.qualification && formData.specialization && formData.subjects.length > 0 && formData.assignedClasses.length > 0 && formData.department;
  const canSubmit = formData.gradingMode && formData.notificationPreference && formData.agreedToPolicy;

  const handleSubmit = async () => {
    const submitData = new FormData();
    
    // Append all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'signatureFile' && value) {
        submitData.append('signature', value as File);
      } else if (key === 'subjects' || key === 'assignedClasses') {
        submitData.append(key, JSON.stringify(value));
      } else if (key !== 'signatureFile' && key !== 'agreedToPolicy') {
        submitData.append(key, value as string);
      }
    });

    submitMutation.mutate(submitData);
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Academic Details', icon: GraduationCap },
    { number: 3, title: 'Preferences', icon: Settings }
  ];

  const progressPercentage = (currentStep / 3) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="heading-welcome">
            Welcome, Teacher! 📘
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400" data-testid="text-instruction">
            Please complete your profile to access the portal
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2 mb-4" data-testid="progress-bar" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center" data-testid={`step-indicator-${step.number}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-primary text-white' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle data-testid={`title-step-${currentStep}`}>
              {currentStep === 1 && 'Personal Information'}
              {currentStep === 2 && 'Academic & Professional Details'}
              {currentStep === 3 && 'Operational Preferences'}
            </CardTitle>
            <CardDescription data-testid={`description-step-${currentStep}`}>
              {currentStep === 1 && 'Basic personal information about you'}
              {currentStep === 2 && 'Your qualifications and teaching assignments'}
              {currentStep === 3 && 'Set your preferences and upload signature'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Full Name</Label>
                    <Input
                      id="firstName"
                      value={`${user?.firstName} ${user?.lastName}`}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                      data-testid="input-fullname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffId">Staff ID <span className="text-red-500">*</span></Label>
                    <Input
                      id="staffId"
                      placeholder="THS-TCH-2025-007"
                      value={formData.staffId}
                      onChange={(e) => handleInputChange('staffId', e.target.value)}
                      data-testid="input-staffid"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
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
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      data-testid="input-dob"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Contact Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="phone"
                      placeholder="+234-8012345678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Academic & Professional Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualification">Highest Qualification <span className="text-red-500">*</span></Label>
                    <Select value={formData.qualification} onValueChange={(value) => handleInputChange('qualification', value)}>
                      <SelectTrigger data-testid="select-qualification">
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NCE">NCE</SelectItem>
                        <SelectItem value="B.Ed">B.Ed</SelectItem>
                        <SelectItem value="B.Sc">B.Sc</SelectItem>
                        <SelectItem value="M.Ed">M.Ed</SelectItem>
                        <SelectItem value="M.Sc">M.Sc</SelectItem>
                        <SelectItem value="PGDE">PGDE</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yearsOfExperience">Teaching Experience (Years)</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      placeholder="8"
                      value={formData.yearsOfExperience}
                      onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                      data-testid="input-experience"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialization">Area of Specialization <span className="text-red-500">*</span></Label>
                  <Input
                    id="specialization"
                    placeholder="Mathematics / English / Biology"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    data-testid="input-specialization"
                  />
                </div>

                <div>
                  <Label>Subject(s) to Handle <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-3 gap-2 mt-2" data-testid="checkbox-group-subjects">
                    {subjects?.map((subject: any) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={formData.subjects.includes(subject.name)}
                          onCheckedChange={() => handleSubjectToggle(subject.name)}
                          data-testid={`checkbox-subject-${subject.id}`}
                        />
                        <Label htmlFor={`subject-${subject.id}`} className="text-sm font-normal cursor-pointer">
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Class(es) Assigned <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-4 gap-2 mt-2" data-testid="checkbox-group-classes">
                    {classes?.map((cls: any) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={formData.assignedClasses.includes(cls.id.toString())}
                          onCheckedChange={() => handleClassToggle(cls.id.toString())}
                          data-testid={`checkbox-class-${cls.id}`}
                        />
                        <Label htmlFor={`class-${cls.id}`} className="text-sm font-normal cursor-pointer">
                          {cls.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Operational Preferences */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gradingMode">Grading Mode</Label>
                    <Select value={formData.gradingMode} onValueChange={(value) => handleInputChange('gradingMode', value)}>
                      <SelectTrigger data-testid="select-grading">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100_marks">100 Marks</SelectItem>
                        <SelectItem value="ca_only">Continuous Assessment Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notificationPreference">Notification Preference</Label>
                    <Select value={formData.notificationPreference} onValueChange={(value) => handleInputChange('notificationPreference', value)}>
                      <SelectTrigger data-testid="select-notification">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="in_app">In-app Alert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="availability">Availability (Optional)</Label>
                  <Input
                    id="availability"
                    placeholder="Mon-Fri, 8AM-2PM"
                    value={formData.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    data-testid="input-availability"
                  />
                </div>

                <div>
                  <Label htmlFor="signature">Digital Signature (Upload)</Label>
                  <div className="mt-2">
                    <Input
                      id="signature"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      data-testid="input-signature"
                    />
                    {formData.signatureFile && (
                      <Badge variant="secondary" className="mt-2">
                        <Upload className="w-3 h-3 mr-1" />
                        {formData.signatureFile.name}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreement"
                      checked={formData.agreedToPolicy}
                      onCheckedChange={(checked) => handleInputChange('agreedToPolicy', checked)}
                      data-testid="checkbox-agreement"
                    />
                    <Label htmlFor="agreement" className="text-sm cursor-pointer">
                      I hereby confirm that the information provided above is accurate and that I will comply with the institution's digital data policy for student and score management.
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
                data-testid="button-previous"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={
                    (currentStep === 1 && !canProceedStep1) ||
                    (currentStep === 2 && !canProceedStep2)
                  }
                  data-testid="button-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit & Proceed'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 dark:text-blue-100" data-testid="text-info">
              <strong>Note:</strong> Your profile will be reviewed by the administrator for verification. 
              You will receive a notification once your profile is approved, granting you full access to the portal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
