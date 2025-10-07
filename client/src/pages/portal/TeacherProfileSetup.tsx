
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserCircle, GraduationCap, Briefcase, CheckCircle, Upload, Camera } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";

// Teacher Profile Setup Schema
const teacherSetupSchema = z.object({
  // Personal Information
  fullName: z.string().min(1, "Full name is required"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  staffId: z.string().min(1, "Staff ID is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  
  // Academic & Professional Details
  qualification: z.string().min(1, "Qualification is required"),
  specialization: z.string().min(1, "Area of specialization is required"),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience must be 0 or more"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  classes: z.array(z.string()).min(1, "Select at least one class"),
  department: z.string().min(1, "Department is required"),
  
  // Operational Preferences
  gradingMode: z.string().min(1, "Grading mode is required"),
  notificationPreference: z.string().min(1, "Notification preference is required"),
  availability: z.string().optional(),
  
  // Agreement
  dataAgreement: z.boolean().refine((val) => val === true, {
    message: "You must agree to the data policy"
  })
});

type TeacherSetupFormData = z.infer<typeof teacherSetupSchema>;

export default function TeacherProfileSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  // Fetch available subjects and classes
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/classes"],
  });

  // Check if teacher profile already exists
  const { data: existingProfile, isLoading } = useQuery({
    queryKey: ["/api/teacher/profile/me"],
  });

  const form = useForm<TeacherSetupFormData>({
    resolver: zodResolver(teacherSetupSchema),
    defaultValues: {
      fullName: user ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || "",
      subjects: [],
      classes: [],
      dataAgreement: false,
    }
  });

  useEffect(() => {
    // If profile exists and is verified, redirect to dashboard
    if (existingProfile && existingProfile.verified) {
      navigate("/portal/teacher");
    }
  }, [existingProfile, navigate]);

  // Handle profile photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle signature upload
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignature(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit mutation
  const setupProfileMutation = useMutation({
    mutationFn: async (data: TeacherSetupFormData) => {
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value?.toString() || '');
        }
      });

      // Append files if available
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }
      if (signature) {
        formData.append('signature', signature);
      }

      const response = await fetch("/api/teacher/profile/setup", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to setup profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/profile/me"] });
      toast({
        title: "Profile Setup Complete!",
        description: "Your profile has been submitted for admin verification. You'll be notified once approved.",
      });
      
      // Redirect to teacher dashboard (with pending status)
      setTimeout(() => {
        navigate("/portal/teacher");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup profile",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: TeacherSetupFormData) => {
    setupProfileMutation.mutate(data);
  };

  const nextStep = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const progress = (currentStep / 3) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📘 Welcome, Teacher!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please Complete Your Profile to Access the Portal
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Setup Progress</CardTitle>
            <CardDescription>Step {currentStep} of 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" data-testid="progress-setup" />
            <div className="flex justify-between mt-4 text-sm">
              <span className={currentStep >= 1 ? "text-primary font-semibold" : "text-gray-500"}>
                Personal Info
              </span>
              <span className={currentStep >= 2 ? "text-primary font-semibold" : "text-gray-500"}>
                Academic Details
              </span>
              <span className={currentStep >= 3 ? "text-primary font-semibold" : "text-gray-500"}>
                Confirmation
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-6 w-6 text-primary" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Photo */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      {...form.register("fullName")}
                      data-testid="input-fullName"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select onValueChange={(value) => form.setValue("gender", value)}>
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.gender && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...form.register("dateOfBirth")}
                      data-testid="input-dateOfBirth"
                    />
                    {form.formState.errors.dateOfBirth && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="staffId">National ID / Staff ID *</Label>
                    <Input
                      id="staffId"
                      {...form.register("staffId")}
                      placeholder="e.g., THS-TCH-2025-007"
                      data-testid="input-staffId"
                    />
                    {form.formState.errors.staffId && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.staffId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Contact Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      data-testid="input-email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      placeholder="+234-8012345678"
                      data-testid="input-phone"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="button" onClick={nextStep}>
                  Next Step →
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2: Academic & Professional Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <CardTitle>Academic & Professional Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualification">Highest Qualification *</Label>
                    <Select onValueChange={(value) => form.setValue("qualification", value)}>
                      <SelectTrigger data-testid="select-qualification">
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B.Ed">B.Ed</SelectItem>
                        <SelectItem value="M.Ed">M.Ed</SelectItem>
                        <SelectItem value="B.Sc">B.Sc</SelectItem>
                        <SelectItem value="NCE">NCE</SelectItem>
                        <SelectItem value="PGDE">PGDE</SelectItem>
                        <SelectItem value="PhD">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.qualification && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.qualification.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="specialization">Area of Specialization *</Label>
                    <Input
                      id="specialization"
                      {...form.register("specialization")}
                      placeholder="e.g., Mathematics, English"
                      data-testid="input-specialization"
                    />
                    {form.formState.errors.specialization && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.specialization.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsOfExperience">Teaching Experience (Years) *</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      {...form.register("yearsOfExperience", { valueAsNumber: true })}
                      data-testid="input-yearsOfExperience"
                    />
                    {form.formState.errors.yearsOfExperience && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.yearsOfExperience.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select onValueChange={(value) => form.setValue("department", value)}>
                      <SelectTrigger data-testid="select-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.department && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.department.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Subject(s) to Handle *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                    {subjects.map((subject: any) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("subjects") || [];
                            if (checked) {
                              form.setValue("subjects", [...current, subject.name]);
                            } else {
                              form.setValue("subjects", current.filter((s: string) => s !== subject.name));
                            }
                          }}
                        />
                        <Label htmlFor={`subject-${subject.id}`} className="text-sm font-normal cursor-pointer">
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.subjects && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.subjects.message}</p>
                  )}
                </div>

                <div>
                  <Label>Class(es) Assigned *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-4">
                    {classes.map((cls: any) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${cls.id}`}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("classes") || [];
                            if (checked) {
                              form.setValue("classes", [...current, cls.name]);
                            } else {
                              form.setValue("classes", current.filter((c: string) => c !== cls.name));
                            }
                          }}
                        />
                        <Label htmlFor={`class-${cls.id}`} className="text-sm font-normal cursor-pointer">
                          {cls.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.classes && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.classes.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gradingMode">Grading Mode *</Label>
                    <Select onValueChange={(value) => form.setValue("gradingMode", value)}>
                      <SelectTrigger data-testid="select-gradingMode">
                        <SelectValue placeholder="Select grading mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100 Marks">100 Marks</SelectItem>
                        <SelectItem value="Continuous Assessment Only">Continuous Assessment Only</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.gradingMode && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.gradingMode.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="notificationPreference">Notification Preference *</Label>
                    <Select onValueChange={(value) => form.setValue("notificationPreference", value)}>
                      <SelectTrigger data-testid="select-notificationPreference">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="In-app">In-app Alert</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.notificationPreference && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.notificationPreference.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="availability">Availability (Optional)</Label>
                  <Input
                    id="availability"
                    {...form.register("availability")}
                    placeholder="e.g., Mon–Fri, 8AM–2PM"
                    data-testid="input-availability"
                  />
                </div>

                {/* Digital Signature Upload */}
                <div>
                  <Label>Digital Signature (Upload) *</Label>
                  <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
                    {signaturePreview ? (
                      <img src={signaturePreview} alt="Signature" className="mx-auto max-h-24" />
                    ) : (
                      <p className="text-gray-500 text-sm">JPEG / PNG only</p>
                    )}
                    <label className="mt-2 inline-block">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Signature
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleSignatureChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  ← Previous
                </Button>
                <Button type="button" onClick={nextStep}>
                  Next Step →
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <CardTitle>Review & Confirmation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Declaration */}
                <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">📋 Declaration</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    "I hereby confirm that the information provided above is accurate and that I will comply with the institution's digital data policy for student and score management."
                  </p>
                </div>

                {/* Agreement Checkbox */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="dataAgreement"
                    onCheckedChange={(checked) => form.setValue("dataAgreement", checked as boolean)}
                  />
                  <Label htmlFor="dataAgreement" className="text-sm font-semibold cursor-pointer">
                    ✅ I Agree & Proceed
                  </Label>
                </div>
                {form.formState.errors.dataAgreement && (
                  <p className="text-sm text-red-500">{form.formState.errors.dataAgreement.message}</p>
                )}

                {/* Summary Preview */}
                <div className="border rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
                  <h4 className="font-semibold mb-2">Profile Summary:</h4>
                  <p className="text-sm"><strong>Name:</strong> {form.watch("fullName")}</p>
                  <p className="text-sm"><strong>Staff ID:</strong> {form.watch("staffId")}</p>
                  <p className="text-sm"><strong>Qualification:</strong> {form.watch("qualification")}</p>
                  <p className="text-sm"><strong>Specialization:</strong> {form.watch("specialization")}</p>
                  <p className="text-sm"><strong>Department:</strong> {form.watch("department")}</p>
                  <p className="text-sm"><strong>Subjects:</strong> {form.watch("subjects")?.join(", ")}</p>
                  <p className="text-sm"><strong>Classes:</strong> {form.watch("classes")?.join(", ")}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  ← Previous
                </Button>
                <Button
                  type="submit"
                  disabled={setupProfileMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {setupProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Profile
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}
