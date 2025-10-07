
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
    staffId: '',
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
    const totalFields = 15; // Total required fields
    let completedFields = 0;

    if (formData.staffId) completedFields++;
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
        throw new Error(errorData.message || 'Profile creation failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);

      toast({
        title: "Profile Setup Complete!",
        description: "Your profile has been created and verified. Redirecting to dashboard...",
      });
      
      // Clear draft from localStorage
      localStorage.removeItem('teacher_profile_draft');
      
      // CRITICAL: Update cache BEFORE navigation to prevent redirect loop
      queryClient.setQueryData(['/api/teacher/profile/status'], {
        hasProfile: true,
        verified: true,
        firstLogin: false
      });
      
      // Invalidate to ensure fresh data loads after navigation
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/profile/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Navigate immediately - cache is already updated
      navigate('/portal/teacher');
    },
    onError: (error: any) => {
      toast({
        title: "Profile Creation Failed",
        description: error.message || "An error occurred while creating your profile.",
        variant: "destructive",
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
    if (!formData.nationalId) errors.push("National ID / Staff ID");
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

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        submitData.append(key, JSON.stringify(value));
      } else {
        submitData.append(key, String(value));
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
          <CardHeader className="p-4 sm:p-6">
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
                <div className="relative">
                  <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                    {profileImage ? (
                      <img 
                        src={URL.createObjectURL(profileImage)} 
                        alt="Profile Preview" 
                        className="h-full w-full object-cover"
                        data-testid="profile-image-preview"
                      />
                    ) : (
                      <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg cursor-pointer transition-colors">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="profile-image-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              title: "File Too Large",
                              description: "Please select an image smaller than 5MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          // Validate file type
                          if (!file.type.startsWith('image/')) {
                            toast({
                              title: "Invalid File Type",
                              description: "Please select an image file",
                              variant: "destructive",
                            });
                            return;
                          }
                          setProfileImage(file);
                          toast({
                            title: "Image Selected",
                            description: `${file.name} ready to upload`,
                          });
                        }
                      }}
                    />
                  </label>
                </div>
                {profileImage ? (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>{profileImage.name} selected</span>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 text-center">
                    <span className="text-red-500">*</span> Upload your profile photo (Required)
                  </p>
                )}
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
                    National ID / Staff ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    placeholder="e.g., 12345678901 (NIN) or THS/2024/001"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your 11-digit National Identification Number (NIN) or school-assigned Staff ID
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
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      id="signature-upload"
                      className="hidden"
                      data-testid="signature-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          // Validate file size (max 2MB)
                          if (file.size > 2 * 1024 * 1024) {
                            toast({
                              title: "File Too Large",
                              description: "Please select a signature image smaller than 2MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          // Validate file type
                          if (!file.type.startsWith('image/')) {
                            toast({
                              title: "Invalid File Type",
                              description: "Please select an image file",
                              variant: "destructive",
                            });
                            return;
                          }
                          setSignatureFile(file);
                          toast({
                            title: "Signature Selected",
                            description: `${file.name} ready to upload`,
                          });
                        }
                      }}
                    />
                    <label htmlFor="signature-upload" className="cursor-pointer">
                      {signatureFile ? (
                        <div className="space-y-2">
                          <img 
                            src={URL.createObjectURL(signatureFile)} 
                            alt="Signature preview" 
                            className="max-h-24 mx-auto border border-gray-200 dark:border-gray-700 rounded bg-white p-2"
                            data-testid="signature-preview"
                          />
                          <p className="text-xs text-muted-foreground">{signatureFile.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload signature</p>
                          <p className="text-xs text-gray-500">PNG, JPG - Max 2MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {signatureFile && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>Signature ready to upload</span>
                    </div>
                  )}
                </div>
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
