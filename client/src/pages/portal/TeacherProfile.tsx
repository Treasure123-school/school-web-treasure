import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Save, Edit, Camera, GraduationCap, BookOpen, Users, CheckCircle, Clock, Award, FileText } from 'lucide-react';
import { Link } from 'wouter';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { TeacherProfile, Class } from '@shared/schema';

export default function TeacherProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    recoveryEmail: '',
    gender: '', // Added gender field
    dateOfBirth: '' // Added dateOfBirth field
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
    queryKey: ['/api/teacher/profile'],
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
    if (!teacherProfile) return 0;
    let completed = 0;
    let total = 8;

    if (teacherProfile.staffId) completed++;
    if (teacherProfile.qualification) completed++;
    if (teacherProfile.specialization) completed++;
    if (teacherProfile.yearsOfExperience) completed++;
    if (teacherProfile.subjects && teacherProfile.subjects.length > 0) completed++;
    if (teacherProfile.assignedClasses && teacherProfile.assignedClasses.length > 0) completed++;
    if (teacherProfile.department) completed++;
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
        gender: teacher.gender || '', // Initialize gender
        dateOfBirth: teacher.dateOfBirth || '' // Initialize dateOfBirth
      });
    }
  }, [teacher, user]);

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
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['teacher', user.id] });
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
                  {!teacherProfile.signatureUrl && 'Upload digital signature to reach 100%'}
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
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src={teacher?.profileImageUrl || ''} />
                      <AvatarFallback className="text-lg">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={() => setShowImageUpload(!showImageUpload)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-muted-foreground">Teacher</p>

                  {showImageUpload && (
                    <div className="mt-4">
                      <FileUpload
                        type="profile"
                        userId={user.id}
                        onUploadSuccess={handleProfileImageUpload}
                        className="max-w-sm mx-auto"
                      />
                    </div>
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      disabled={!isEditing}
                    />
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
                      <Label className="text-muted-foreground">Qualification</Label>
                      <p className="text-lg font-medium mt-1" data-testid="text-qualification">{teacherProfile.qualification || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Specialization</Label>
                      <p className="text-lg font-medium mt-1" data-testid="text-specialization">{teacherProfile.specialization || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Years of Experience</Label>
                      <p className="text-lg font-medium mt-1" data-testid="text-experience">
                        {teacherProfile.yearsOfExperience ? `${teacherProfile.yearsOfExperience} years` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="text-lg font-medium mt-1" data-testid="text-department">{teacherProfile.department || 'Not set'}</p>
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
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground mb-2 block">Assigned Classes</Label>
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
                  </div>

                  {teacherProfile.signatureUrl && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground mb-2 block">Digital Signature</Label>
                        <div className="border rounded-lg p-4 bg-muted/30 inline-block">
                          <img
                            src={teacherProfile.signatureUrl}
                            alt="Digital Signature"
                            className="max-h-20 max-w-xs"
                            data-testid="img-signature"
                          />
                        </div>
                      </div>
                    </>
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