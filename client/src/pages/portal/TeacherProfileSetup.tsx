import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FileUpload } from '@/components/ui/file-upload';
import { ImageCapture } from '@/components/ui/image-capture';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import {
  User,
  GraduationCap,
  CheckCircle,
  Camera,
  Calendar,
  Phone,
  IdCard,
  BookOpen,
  Award,
  Briefcase,
  Users,
  Building,
  Upload,
  Bell,
  Clock,
  FileSignature,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Save,
  TrendingUp
} from 'lucide-react';

interface TeacherProfileData {
  staffId: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  nationalId: string;
  qualification: string;
  specialization: string;
  yearsOfExperience: number;
  subjects: number[];
  assignedClasses: number[];
  department: string;
  signatureUrl: string;
  gradingMode: string;
  notificationPreference: string;
  availability: string;
  agreement: boolean;
}

export default function TeacherProfileSetup() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<TeacherProfileData>({
    staffId: '', // Optional - will be auto-generated if left empty
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    nationalId: '',
    qualification: '',
    specialization: '',
    yearsOfExperience: 0,
    subjects: [],
    assignedClasses: [],
    department: '',
    signatureUrl: '',
    gradingMode: 'manual',
    notificationPreference: 'all',
    availability: 'full-time',
    agreement: false,
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate profile completeness percentage
  const calculateCompleteness = (): number => {
    const totalFields = 14; // Total required fields (staffId is optional, auto-generated)
    let completedFields = 0;

    // staffId is optional - will be auto-generated if not provided
    if (formData.gender) completedFields++;
    if (formData.dateOfBirth) completedFields++;
    if (formData.phoneNumber) completedFields++;
    if (formData.nationalId) completedFields++;
    if (formData.qualification) completedFields++;
    if (formData.specialization) completedFields++;
    if (formData.department) completedFields++;
    if (formData.yearsOfExperience > 0) completedFields++;
    if (formData.subjects.length > 0) completedFields++;
    if (formData.assignedClasses.length > 0) completedFields++;
    if (profileImage) completedFields++;
    if (signatureFile) completedFields++;
    if (formData.gradingMode) completedFields++;
    if (formData.agreement) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const completeness = calculateCompleteness();

  // Auto-save draft every 10 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (completeness > 0 && completeness < 100) {
        setIsSaving(true);
        // Save to localStorage
        localStorage.setItem('teacher_profile_draft', JSON.stringify({
          formData,
          profileImageName: profileImage?.name,
          signatureName: signatureFile?.name,
          currentStep
        }));
        setLastSaved(new Date());
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData, profileImage, signatureFile, currentStep, completeness]);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('teacher_profile_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.formData);
        setCurrentStep(draft.currentStep || 1);
        // Potentially set profileImage and signatureFile if names are stored, though not strictly necessary for this logic
        // if (draft.profileImageName) { /* logic to handle image */ }
        // if (draft.signatureName) { /* logic to handle signature */ }
        toast({
          title: "Draft Restored",
          description: "Your previous progress has been restored.",
        });
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, []);

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/teacher/profile/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: data,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        // FIX #5: Attach full error data for better error handling
        const error = new Error(errorData.message || 'Profile creation failed') as any;
        error.code = errorData.code;
        error.details = errorData.details;
        error.constraint = errorData.constraint;
        error.status = response.status;
        error.existingProfile = errorData.existingProfile;
        throw error;
      }

      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Profile creation successful, response:', data);
      
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      toast({
        title: "🎉 Profile Completed Successfully!",
        description: "Welcome aboard, Teacher! Redirecting to your personalized dashboard...",
        duration: 5000,
      });

      // Clear draft from localStorage
      localStorage.removeItem('teacher_profile_draft');

      // CRITICAL: Update caches with ACTUAL backend values to prevent mismatches
      queryClient.setQueryData(['/api/teacher/profile/status'], {
        hasProfile: data.hasProfile ?? true,
        verified: data.verified ?? true,
        firstLogin: false
      });

      // Update the profile data cache if backend returned it
      if (data.profile) {
        queryClient.setQueryData(['/api/teacher/profile/me'], data.profile);
      }

      // Invalidate auth to refresh user status
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

      // Navigate after confetti animation
      setTimeout(() => {
        navigate('/portal/teacher');
      }, 3000);
    },
    onError: (error: any) => {
      console.error('❌ PROFILE CREATION ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        constraint: error.constraint,
        status: error.status,
        existingProfile: error.existingProfile,
        fullError: error
      });
      
      let errorMessage = error.message || "An error occurred while creating your profile.";
      const errorDetails: string[] = [];
      
      // Parse backend error response
      if (error.code) errorDetails.push(`Code: ${error.code}`);
      if (error.status) errorDetails.push(`Status: ${error.status}`);
      if (error.constraint) errorDetails.push(`DB Constraint: ${error.constraint}`);
      
      // Check for network errors
      if (error.message === 'Failed to fetch') {
        errorMessage = "Network error - cannot connect to server. Please check your internet connection.";
        errorDetails.push("The server may be restarting or unavailable.");
      }
      
      // Special handling for profile already exists
      if (error.existingProfile) {
        errorMessage = "You already have a profile. Redirecting to dashboard...";
        setTimeout(() => navigate('/portal/teacher'), 2000);
      }
      
      // Helpful action hints
      let actionHint = '';
      if (error.code === 'STAFF_ID_EXISTS') {
        actionHint = 'Leave Staff ID blank for auto-generation.';
      } else if (error.message?.includes('unique constraint')) {
        actionHint = 'A profile with this information already exists. Contact admin if this is an error.';
      } else if (error.message === 'Failed to fetch') {
        actionHint = 'Try refreshing the page and submitting again in a few moments.';
      }
      
      toast({
        title: "Profile Creation Failed",
        description: (
          <div className="space-y-2">
            <p className="font-medium">{errorMessage}</p>
            {errorDetails.length > 0 && (
              <div className="text-xs opacity-80 space-y-1">
                {errorDetails.map((detail, idx) => (
                  <p key={idx}>{detail}</p>
                ))}
              </div>
            )}
            {actionHint && (
              <p className="text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 p-2 rounded mt-2">
                💡 {actionHint}
              </p>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 15000,
      });
    },
  });

  const handleInputChange = (field: keyof TeacherProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: 'subjects' | 'assignedClasses', value: string) => {
    const numValue = parseInt(value);
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(numValue)
        ? prev[field].filter(id => id !== numValue)
        : [...prev[field], numValue]
    }));
  };

  const validateStep1 = (): boolean => {
    const errors: string[] = [];

    if (!formData.gender) errors.push("Gender");
    if (!formData.dateOfBirth) errors.push("Date of Birth");
    if (!formData.nationalId) errors.push("National ID (NIN)");
    if (!formData.phoneNumber) errors.push("Phone Number");
    if (!profileImage) errors.push("Profile Photo");

    if (errors.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const errors: string[] = [];

    if (!formData.qualification) errors.push("Qualification");
    if (!formData.specialization) errors.push("Specialization");
    if (!formData.department) errors.push("Department");
    if (!formData.yearsOfExperience || formData.yearsOfExperience < 0) errors.push("Years of Experience");
    if (formData.subjects.length === 0) errors.push("At least one Subject");
    if (formData.assignedClasses.length === 0) errors.push("At least one Class");

    if (errors.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // Comprehensive validation - all critical fields required
    const errors: string[] = [];

    // Critical fields validation
    if (!formData.agreement) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!profileImage) {
      toast({
        title: "Profile Photo Required",
        description: "Please upload a profile photo before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Required academic fields - STRICT validation
    if (formData.subjects.length === 0) {
      errors.push("At least one subject");
    }

    if (formData.assignedClasses.length === 0) {
      errors.push("At least one class");
    }

    if (!formData.department || formData.department.trim() === '') {
      errors.push("Department");
    }

    if (!formData.yearsOfExperience || formData.yearsOfExperience <= 0) {
      errors.push("Years of experience (must be greater than 0)");
    }

    if (!formData.qualification || formData.qualification.trim() === '') {
      errors.push("Qualification");
    }

    if (!formData.specialization || formData.specialization.trim() === '') {
      errors.push("Specialization");
    }

    // Block submission if any critical fields are missing
    if (errors.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please complete the following required fields: ${errors.join(', ')}`,
        variant: "destructive",
        duration: 10000,
      });
      return;
    }

    const submitData = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        submitData.append(key, JSON.stringify(value));
      } else {
        const stringValue = String(value).trim();
        // CRITICAL FIX: Skip staffId entirely if empty - backend will auto-generate
        if (key === 'staffId' && (!stringValue || stringValue === 'undefined' || stringValue === 'null')) {
          return; // Don't send staffId at all if empty
        }
        // Skip other empty values except booleans
        if (typeof value !== 'boolean' && (!stringValue || stringValue === 'undefined' || stringValue === 'null')) {
          return;
        }
        submitData.append(key, stringValue);
      }
    });

    if (profileImage) {
      submitData.append('profileImage', profileImage);
    }
    if (signatureFile) {
      submitData.append('signature', signatureFile);
    }

    createProfileMutation.mutate(submitData);
  };

  const progressPercentage = (currentStep / 3) * 100;

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Academic Details', icon: GraduationCap },
    { number: 3, title: 'Confirmation', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-6 sm:py-8 md:py-12 px-3 sm:px-4 lg:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-3 shadow-lg">
              <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Welcome, Teacher!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Please Complete Your Profile to Access the Portal
              </p>
            </div>
          </div>
        </div>

        {/* Profile Completeness Meter */}
        <Card className="mb-6 sm:mb-8 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-semibold">Profile Completeness</h3>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Save className="h-3 w-3 animate-pulse" />
                    <span>Saving...</span>
                  </div>
                )}
                {lastSaved && !isSaving && (
                  <span className="text-xs text-muted-foreground">
                    Saved {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {completeness < 100
                    ? `Fill in all required fields to complete your profile`
                    : 'All fields completed! Ready to submit'}
                </span>
                <Badge
                  variant={completeness === 100 ? "default" : "secondary"}
                  className={completeness === 100 ? "bg-green-600" : ""}
                >
                  {completeness}%
                </Badge>
              </div>
              <Progress
                value={completeness}
                className={`h-3 ${completeness === 100 ? 'bg-green-100' : ''}`}
              />
              {completeness < 100 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Your progress is auto-saved every 10 seconds
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        <Card className="mb-6 sm:mb-8 shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="p-4 sm:p-6 border-b">
            <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-600" />
              Profile Setup Progress
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Step {currentStep} of 3</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Progress value={progressPercentage} className="h-2 mb-4" />
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
              {steps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.number}
                    className={`flex items-center gap-2 sm:gap-3 flex-1 p-2 sm:p-3 rounded-lg transition-all ${
                      currentStep === step.number
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : currentStep > step.number
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    <div className={`p-1.5 sm:p-2 rounded-full ${
                      currentStep === step.number
                        ? 'bg-white/20'
                        : currentStep > step.number
                        ? 'bg-green-100 dark:bg-green-800'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      <StepIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold hidden sm:inline">{step.title}</span>
                    <span className="text-xs font-semibold sm:hidden">{step.number}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
            <CardHeader className="p-4 sm:p-6 border-b">
              <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <ImageCapture
                  value={profileImage}
                  onChange={setProfileImage}
                  label="Upload your profile photo (Required)"
                  required={true}
                  shape="circle"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={`${user?.firstName} ${user?.lastName}`}
                    disabled
                    className="bg-gray-50 dark:bg-gray-700 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger className="text-sm">
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
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <IdCard className="h-3 w-3 sm:h-4 sm:w-4" />
                    National ID (NIN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    placeholder="e.g., 12345678901"
                    className="text-sm"
                    data-testid="input-national-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your 11-digit National Identification Number (NIN)
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    if (validateStep1()) {
                      setCurrentStep(2);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-2 text-sm sm:text-base"
                  data-testid="button-next-step-1"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Academic & Professional Details */}
        {currentStep === 2 && (
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
            <CardHeader className="p-4 sm:p-6 border-b">
              <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Academic & Professional Details
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your qualifications and teaching information</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                    Qualification <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.qualification} onValueChange={(value) => handleInputChange('qualification', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bsc">B.Sc / B.A</SelectItem>
                      <SelectItem value="msc">M.Sc / M.A</SelectItem>
                      <SelectItem value="phd">Ph.D</SelectItem>
                      <SelectItem value="nce">NCE</SelectItem>
                      <SelectItem value="pgde">PGDE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    Specialization <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    placeholder="e.g., Mathematics, Physics"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                    Years of Experience <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value))}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g., Science, Arts"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                  Subjects to Teach <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-h-48 overflow-y-auto">
                  {(subjects as any[]).map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={formData.subjects.includes(subject.id)}
                        onCheckedChange={() => handleMultiSelect('subjects', subject.id.toString())}
                      />
                      <label htmlFor={`subject-${subject.id}`} className="text-xs sm:text-sm cursor-pointer">
                        {subject.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  Assigned Classes <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-h-48 overflow-y-auto">
                  {(classes as any[]).map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`class-${cls.id}`}
                        checked={formData.assignedClasses.includes(cls.id)}
                        onCheckedChange={() => handleMultiSelect('assignedClasses', cls.id.toString())}
                      />
                      <label htmlFor={`class-${cls.id}`} className="text-xs sm:text-sm cursor-pointer">
                        {cls.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="gap-2 text-sm sm:text-base"
                  data-testid="button-previous-step-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={() => {
                    if (validateStep2()) {
                      setCurrentStep(3);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-2 text-sm sm:text-base"
                  data-testid="button-next-step-2"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Operational Preferences */}
        {currentStep === 3 && (
          <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
            <CardHeader className="p-4 sm:p-6 border-b">
              <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Operational Preferences
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure your working preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <FileSignature className="h-3 w-3 sm:h-4 sm:w-4" />
                    Grading Mode
                  </Label>
                  <Select value={formData.gradingMode} onValueChange={(value) => handleInputChange('gradingMode', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Grading</SelectItem>
                      <SelectItem value="auto">Auto Grading</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                    Notification Preference
                  </Label>
                  <Select value={formData.notificationPreference} onValueChange={(value) => handleInputChange('notificationPreference', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Notifications</SelectItem>
                      <SelectItem value="important">Important Only</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    Availability
                  </Label>
                  <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <Label className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  <FileSignature className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Digital Signature Upload (Optional)
                </Label>
                <ImageCapture
                  value={signatureFile}
                  onChange={setSignatureFile}
                  label="Upload Digital Signature"
                  required={false}
                  shape="square"
                />
              </div>

              <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <Checkbox
                  id="agreement"
                  checked={formData.agreement}
                  onCheckedChange={(checked) => handleInputChange('agreement', checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="agreement" className="text-xs sm:text-sm cursor-pointer leading-relaxed">
                    I confirm that all information provided is accurate and complete. I understand that my profile will be reviewed by the admin before I can access the portal.
                  </label>
                </div>
              </div>

              {!formData.agreement && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-xs sm:text-sm">Please agree to the terms to submit your profile</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2 text-sm sm:text-base"
                  data-testid="button-previous-step-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.agreement || createProfileMutation.isPending}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit-profile"
                >
                  {createProfileMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}