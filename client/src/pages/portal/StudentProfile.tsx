import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Calendar, School, Save, Edit, Camera, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Link } from 'wouter';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

export default function StudentProfile() {
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
    emergencyContact: '',
    emergencyPhone: '',
    recoveryEmail: ''
  });

  if (!user) {
    return <div>Please log in to access your profile.</div>;
  }

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/students/${user.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch student data');
      return response.json();
    }
  });

  const { data: classes } = useQuery({
    queryKey: ['student-classes', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/students/${user.id}/classes`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    }
  });

  // Initialize form data when student data loads
  React.useEffect(() => {
    if (student) {
      setProfileData({
        firstName: student.firstName || user.firstName || '',
        lastName: student.lastName || user.lastName || '',
        email: student.email || user.email || '',
        phone: student.phone || '',
        address: student.address || '',
        emergencyContact: student.emergencyContact || '',
        emergencyPhone: student.emergencyPhone || '',
        recoveryEmail: user.recoveryEmail || ''
      });
    }
  }, [student, user]);

  const handleProfileImageUpload = (result: any) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Profile Image Updated</span>
        </div>
      ),
      description: "Your profile image has been uploaded successfully.",
      className: "border-green-500 bg-green-50",
    });
    
    // Refresh user data to show new profile image
    queryClient.invalidateQueries({ queryKey: ['student', user.id] });
    setShowImageUpload(false);
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest('PATCH', `/api/students/${user.id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return await response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['student', user.id] });
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Profile Updated</span>
          </div>
        ),
        description: "Your profile has been updated successfully.",
        className: "border-green-500 bg-green-50",
      });
    },
    onError: (error: Error) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Update Failed</span>
          </div>
        ),
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    }
  });

  const handleSave = () => {
    saveProfileMutation.mutate(profileData);
  };

  const handleChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <PortalLayout 
      userRole="student" 
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
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={saveProfileMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
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
                      <AvatarImage src={user?.profileImageUrl || student?.profileImage} />
                      <AvatarFallback className="text-lg">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {user.roleId === 4 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={() => setShowImageUpload(!showImageUpload)}
                        data-testid="profile-image-upload-button"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-muted-foreground">Student</p>
                  
                  {user.roleId === 4 && showImageUpload && (
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
                    <School className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Student ID</p>
                      <p className="text-sm text-muted-foreground">
                        {student?.admissionNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Date of Birth</p>
                      <p className="text-sm text-muted-foreground">
                        {student?.dateOfBirth 
                          ? new Date(student.dateOfBirth).toLocaleDateString()
                          : 'Not provided'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Class</p>
                      <p className="text-sm text-muted-foreground">
                        {student?.className || 'Not assigned'}
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
                      disabled={!isEditing}
                    />
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

            {/* Security Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recoveryEmail">
                      Recovery Email
                      <span className="text-xs text-muted-foreground ml-2">(for password reset)</span>
                    </Label>
                    <Input
                      id="recoveryEmail"
                      type="email"
                      value={profileData.recoveryEmail}
                      onChange={(e) => handleChange('recoveryEmail', e.target.value)}
                      placeholder="recovery@example.com"
                      disabled={!isEditing}
                    />
                    {!profileData.recoveryEmail && !isEditing && (
                      <p className="text-sm text-orange-600">
                        No recovery email set. Click "Edit Profile" to add one for account security.
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Why set a recovery email?
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
                      <li>Reset your password if you forget it</li>
                      <li>Receive important account notifications</li>
                      <li>Secure your account access</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={profileData.emergencyContact}
                      onChange={(e) => handleChange('emergencyContact', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={profileData.emergencyPhone}
                      onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Classes */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <School className="h-5 w-5" />
                  <span>Current Classes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classes && classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.map((classItem: any, index: number) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{classItem.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {classItem.teacher || 'Teacher not assigned'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No classes assigned yet</p>
                  </div>
                )}
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
                <Link href="/portal/student/grades">
                  <School className="h-6 w-6" />
                  <span className="text-sm">View Grades</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                <Link href="/portal/student/attendance">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Check Attendance</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                <Link href="/portal/student/messages">
                  <Mail className="h-6 w-6" />
                  <span className="text-sm">Messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                <Link href="/portal/student">
                  <User className="h-6 w-6" />
                  <span className="text-sm">Dashboard</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}