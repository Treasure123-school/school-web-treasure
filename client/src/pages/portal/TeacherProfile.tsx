import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Save, Edit, Camera, GraduationCap, BookOpen, Users, CheckCircle, Clock, Award, FileText } from 'lucide-react';
import { Link } from 'wouter';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { ImageCapture } from '@/components/ui/image-capture';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import type { TeacherProfile, Class } from '@shared/schema';

export default function TeacherProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    recoveryEmail: '',
    gender: '',
    dateOfBirth: '',
    nationalId: ''
  });
  const [professionalData, setProfessionalData] = useState({
    qualification: '',
    specialization: '',
    yearsOfExperience: 0,
    department: '',
    gradingMode: 'manual',
    notificationPreference: 'all',
    availability: 'full-time',
    subjects: [] as number[],
    assignedClasses: [] as number[],
    staffId: ''
  });

  if (!user) {
    return <div>Please log in to access your profile.</div>;
  }

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teacher data');
      return response.json();
    }
  });

  // Fetch teacher professional profile
  const { data: teacherProfile } = useQuery<TeacherProfile>({
    queryKey: ['/api/teacher/profile/me'],
    enabled: !!user
  });

  // Fetch classes for display
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    enabled: !!user
  });

  // Fetch subjects for display
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
    enabled: !!user
  });

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    if (!teacherProfile || !teacher) return 0;
    let completed = 0;
    let total = 15; // Total fields from setup form

    // Professional fields (from setup)
    if (teacherProfile.staffId) completed++;
    if (teacherProfile.qualification) completed++;
    if (teacherProfile.specialization) completed++;
    if (teacherProfile.yearsOfExperience && teacherProfile.yearsOfExperience > 0) completed++;
    if (teacherProfile.subjects && teacherProfile.subjects.length > 0) completed++;
    if (teacherProfile.assignedClasses && teacherProfile.assignedClasses.length > 0) completed++;
    if (teacherProfile.department) completed++;
    
    // Personal fields (from setup)
    if (teacher.gender) completed++;
    if (teacher.dateOfBirth) completed++;
    if (teacher.phone) completed++;
    if (teacher.profileImageUrl) completed++;
    
    // Operational preferences (from setup)
    if (teacherProfile.gradingMode) completed++;
    if (teacherProfile.notificationPreference) completed++;
    if (teacherProfile.availability) completed++;
    
    // Optional: Digital signature (bonus for 100%)
    if (teacherProfile.signatureUrl) completed++;

    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateCompletion();

  // Initialize form data when teacher data loads
  React.useEffect(() => {
    if (teacher) {
      setProfileData({
        firstName: teacher.firstName || user.firstName || '',
        lastName: teacher.lastName || user.lastName || '',
        email: teacher.email || user.email || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        recoveryEmail: teacher.recoveryEmail || '',
        gender: teacher.gender || '',
        dateOfBirth: teacher.dateOfBirth || '',
        nationalId: teacher.nationalId || ''
      });
    }
  }, [teacher, user]);

  // Initialize professional data when teacher profile loads
  React.useEffect(() => {
    if (teacherProfile) {
      // Handle subjects - ensure it's always an array
      const subjectsArray = Array.isArray(teacherProfile.subjects) 
        ? teacherProfile.subjects 
        : teacherProfile.subjects ? [teacherProfile.subjects] : [];
      
      // Handle assignedClasses - ensure it's always an array
      const classesArray = Array.isArray(teacherProfile.assignedClasses) 
        ? teacherProfile.assignedClasses 
        : teacherProfile.assignedClasses ? [teacherProfile.assignedClasses] : [];

      setProfessionalData({
        qualification: teacherProfile.qualification || '',
        specialization: teacherProfile.specialization || '',
        yearsOfExperience: teacherProfile.yearsOfExperience || 0,
        department: teacherProfile.department || '',
        gradingMode: teacherProfile.gradingMode || 'manual',
        notificationPreference: teacherProfile.notificationPreference || 'all',
        availability: teacherProfile.availability || 'full-time',
        subjects: subjectsArray,
        assignedClasses: classesArray,
        staffId: teacherProfile.staffId || ''
      });
    }
  }, [teacherProfile]);

  const handleProfileImageUpload = (result: any) => {
    toast({
      title: "Profile image updated",
      description: "Your profile image has been uploaded successfully.",
    });

    queryClient.invalidateQueries({ queryKey: ['teacher', user.id] });
    setShowImageUpload(false);
  };

  const handleSave = async () => {
    try {
      // Upload profile image if changed
      if (profileImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('profileImage', profileImageFile);
        
        const imageResponse = await fetch('/api/upload/profile', {
          method: 'POST',
          credentials: 'include',
          body: imageFormData
        });
        
        if (!imageResponse.ok) {
          throw new Error('Failed to upload profile image');
        }
      }

      // Upload signature if changed
      if (signatureFile) {
        const sigFormData = new FormData();
        sigFormData.append('signature', signatureFile);
        
        const sigResponse = await fetch('/api/upload/signature', {
          method: 'POST',
          credentials: 'include',
          body: sigFormData
        });
        
        if (!sigResponse.ok) {
          throw new Error('Failed to upload signature');
        }
      }

      // Update personal data (users table)
      const userResponse = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || 'Failed to update personal information');
      }

      // Update professional data (teacher_profiles table)
      const profileResponse = await fetch('/api/teacher/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...professionalData,
          phone: profileData.phone,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          nationalId: profileData.nationalId
        })
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.message || 'Failed to update professional information');
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['teacher', user.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/profile'] });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfessionalChange = (field: string, value: string | number) => {
    setProfessionalData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <PortalLayout
      userRole="teacher"
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">
              View and manage your personal information
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Completion Progress */}
        {teacherProfile && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800" data-testid="card-progress">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold" data-testid="text-completion-title">Profile Completion</h3>
                  <p className="text-sm text-muted-foreground">
                    {profileCompletion === 100 ? 'Your profile is complete! ✅' : 'Complete your profile for better visibility'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary" data-testid="text-completion-percentage">{profileCompletion}%</p>
                </div>
              </div>
              <Progress value={profileCompletion} className="h-2" data-testid="progress-completion" />
              {profileCompletion < 100 && (
                <p className="text-xs text-muted-foreground mt-2" data-testid="text-missing-info">
                  {(() => {
                    const missing = [];
                    if (!teacherProfile?.staffId) missing.push('Staff ID');
                    if (!teacherProfile?.qualification) missing.push('Qualification');
                    if (!teacherProfile?.department) missing.push('Department');
                    if (!teacherProfile?.subjects?.length) missing.push('Subjects');
                    if (!teacherProfile?.assignedClasses?.length) missing.push('Classes');
                    if (!teacher?.gender) missing.push('Gender');
                    if (!teacher?.dateOfBirth) missing.push('Date of Birth');
                    if (!teacher?.phone) missing.push('Phone');
                    if (!teacher?.profileImageUrl) missing.push('Profile Photo');
                    if (!teacherProfile?.signatureUrl) missing.push('Digital Signature (Optional)');
                    
                    return missing.length > 0 
                      ? `Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` +${missing.length - 3} more` : ''}`
                      : 'Complete your profile to reach 100%';
                  })()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading profile...</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Overview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  {isEditing ? (
                    <ImageCapture
                      value={profileImageFile}
                      onChange={setProfileImageFile}
                      label="Profile Photo"
                      shape="circle"
                    />
                  ) : (
                    <>
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarImage src={teacher?.profileImageUrl || ''} />
                        <AvatarFallback className="text-lg">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-muted-foreground">Teacher</p>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Staff ID</p>
                      <p className="text-sm text-muted-foreground">
                        {teacher?.username || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {teacher?.email || user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={true}
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                      id="gender"
                      value={profileData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={profileData.nationalId}
                      onChange={(e) => handleChange('nationalId', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., 12345678901"
                      data-testid="input-national-id"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="recoveryEmail">Recovery Email</Label>
                    <Input
                      id="recoveryEmail"
                      type="email"
                      value={profileData.recoveryEmail}
                      onChange={(e) => handleChange('recoveryEmail', e.target.value)}
                      disabled={!isEditing}
                      placeholder="alternate@email.com"
                      data-testid="input-recovery-email"
                    />
                    <p className="text-xs text-muted-foreground">Used for account recovery purposes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic & Professional Details */}
            {teacherProfile && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2" data-testid="heading-academic">
                    <GraduationCap className="h-5 w-5" />
                    <span>Academic & Professional Details</span>
                  </CardTitle>
                  <CardDescription>Your qualifications and professional information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-muted-foreground">Staff ID</Label>
                      <p className="text-lg font-medium mt-1" data-testid="text-staff-id">{teacherProfile.staffId || 'Not set'}</p>
                    </div>
                    <div>
                      <Label htmlFor="qualification">Qualification</Label>
                      {isEditing ? (
                        <Input
                          id="qualification"
                          value={professionalData.qualification}
                          onChange={(e) => handleProfessionalChange('qualification', e.target.value)}
                          placeholder="e.g., B.Ed, M.Ed, Ph.D"
                        />
                      ) : (
                        <p className="text-lg font-medium mt-1" data-testid="text-qualification">{teacherProfile.qualification || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      {isEditing ? (
                        <Input
                          id="specialization"
                          value={professionalData.specialization}
                          onChange={(e) => handleProfessionalChange('specialization', e.target.value)}
                          placeholder="e.g., Mathematics, Science"
                        />
                      ) : (
                        <p className="text-lg font-medium mt-1" data-testid="text-specialization">{teacherProfile.specialization || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      {isEditing ? (
                        <Input
                          id="yearsOfExperience"
                          type="number"
                          value={professionalData.yearsOfExperience}
                          onChange={(e) => handleProfessionalChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      ) : (
                        <p className="text-lg font-medium mt-1" data-testid="text-experience">
                          {teacherProfile.yearsOfExperience ? `${teacherProfile.yearsOfExperience} years` : 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      {isEditing ? (
                        <Input
                          id="department"
                          value={professionalData.department}
                          onChange={(e) => handleProfessionalChange('department', e.target.value)}
                          placeholder="e.g., Science, Arts"
                        />
                      ) : (
                        <p className="text-lg font-medium mt-1" data-testid="text-department">{teacherProfile.department || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Verification Status</Label>
                      <div className="mt-1">
                        {teacherProfile.verified ? (
                          <Badge variant="default" className="gap-1" data-testid="badge-verified">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1" data-testid="badge-pending">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Teaching Assignments */}
            {teacherProfile && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2" data-testid="heading-assignments">
                    <BookOpen className="h-5 w-5" />
                    <span>Teaching Assignments</span>
                  </CardTitle>
                  <CardDescription>Subjects and classes you teach</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Subjects</Label>
                    {isEditing ? (
                      <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                        {subjects.map((subject: any) => (
                          <div key={subject.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={professionalData.subjects.includes(subject.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProfessionalData(prev => ({
                                    ...prev,
                                    subjects: [...prev.subjects, subject.id]
                                  }));
                                } else {
                                  setProfessionalData(prev => ({
                                    ...prev,
                                    subjects: prev.subjects.filter(id => id !== subject.id)
                                  }));
                                }
                              }}
                            />
                            <label
                              htmlFor={`subject-${subject.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {subject.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2" data-testid="container-subjects">
                        {teacherProfile.subjects && teacherProfile.subjects.length > 0 ? (
                          teacherProfile.subjects.map((subjectId: number, idx: number) => {
                            const subjectData = subjects.find((s: any) => s.id === subjectId);
                            return (
                              <Badge key={idx} variant="secondary" className="text-sm" data-testid={`badge-subject-${idx}`}>
                                <BookOpen className="w-3 h-3 mr-1" />
                                {subjectData?.name || `Subject ${subjectId}`}
                              </Badge>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">No subjects assigned</p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground mb-2 block">Assigned Classes</Label>
                    {isEditing ? (
                      <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                        {classes.map((cls: any) => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`class-${cls.id}`}
                              checked={professionalData.assignedClasses.includes(cls.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setProfessionalData(prev => ({
                                    ...prev,
                                    assignedClasses: [...prev.assignedClasses, cls.id]
                                  }));
                                } else {
                                  setProfessionalData(prev => ({
                                    ...prev,
                                    assignedClasses: prev.assignedClasses.filter(id => id !== cls.id)
                                  }));
                                }
                              }}
                            />
                            <label
                              htmlFor={`class-${cls.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {cls.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2" data-testid="container-classes">
                        {teacherProfile.assignedClasses && teacherProfile.assignedClasses.length > 0 ? (
                          teacherProfile.assignedClasses.map((classId: number, idx: number) => {
                            const classData = classes.find((c) => c.id === classId);
                            return (
                              <Badge key={idx} variant="outline" className="text-sm" data-testid={`badge-class-${idx}`}>
                                <Users className="w-3 h-3 mr-1" />
                                {classData?.name || `Class ${classId}`}
                              </Badge>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">No classes assigned</p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />
                  
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Digital Signature</Label>
                    {isEditing ? (
                      <ImageCapture
                        value={signatureFile}
                        onChange={setSignatureFile}
                        label="Digital Signature"
                        shape="square"
                        className="max-w-xs"
                      />
                    ) : teacherProfile.signatureUrl ? (
                      <div className="border rounded-lg p-4 bg-muted/30 inline-block">
                        <img
                          src={teacherProfile.signatureUrl}
                          alt="Digital Signature"
                          className="max-h-20 max-w-xs"
                          data-testid="img-signature"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No signature uploaded</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Operational Preferences */}
            {teacherProfile && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2" data-testid="heading-preferences">
                    <Award className="h-5 w-5" />
                    <span>Operational Preferences</span>
                  </CardTitle>
                  <CardDescription>Your teaching and notification preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="gradingMode">Grading Mode</Label>
                      {isEditing ? (
                        <Select
                          value={professionalData.gradingMode}
                          onValueChange={(value) => handleProfessionalChange('gradingMode', value)}
                        >
                          <SelectTrigger id="gradingMode">
                            <SelectValue placeholder="Select grading mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg font-medium mt-1 capitalize" data-testid="text-grading-mode">
                          {teacherProfile.gradingMode || 'Manual'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="notificationPreference">Notification Preference</Label>
                      {isEditing ? (
                        <Select
                          value={professionalData.notificationPreference}
                          onValueChange={(value) => handleProfessionalChange('notificationPreference', value)}
                        >
                          <SelectTrigger id="notificationPreference">
                            <SelectValue placeholder="Select notification preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Notifications</SelectItem>
                            <SelectItem value="important">Important Only</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg font-medium mt-1 capitalize" data-testid="text-notification-pref">
                          {teacherProfile.notificationPreference || 'All'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="availability">Availability</Label>
                      {isEditing ? (
                        <Select
                          value={professionalData.availability}
                          onValueChange={(value) => handleProfessionalChange('availability', value)}
                        >
                          <SelectTrigger id="availability">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="on-leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-lg font-medium mt-1 capitalize" data-testid="text-availability">
                          {teacherProfile.availability || 'Full-time'}
                        </p>
                      )}
                    </div>
                  </div>
                  {teacherProfile.updatedAt && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground" data-testid="text-last-updated">
                        Last updated: {new Date(teacherProfile.updatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Account Security - Recovery Email */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Account Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recoveryEmail">Recovery Email (for password resets)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      This email will be used to recover your account if you forget your password
                    </p>
                    <Input
                      id="recoveryEmail"
                      type="email"
                      value={profileData.recoveryEmail || ''}
                      onChange={(e) => handleChange('recoveryEmail', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter recovery email address"
                    />
                    {!profileData.recoveryEmail && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ No recovery email set. Add one to protect your account.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                <Link href="/portal/teacher">
                  <User className="h-6 w-6" />
                  <span className="text-sm">Dashboard</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                <Link href="/portal/teacher/exams">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-sm">My Exams</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                <Link href="/portal/teacher/grades">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-sm">Grades</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                <Link href="/portal/teacher/attendance">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-sm">Attendance</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}