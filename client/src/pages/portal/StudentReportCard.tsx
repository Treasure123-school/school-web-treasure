
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { 
  Download, 
  FileText, 
  GraduationCap, 
  Award,
  Calendar,
  User,
  School,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function StudentReportCard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  // Fetch available terms
  const { data: terms = [] } = useQuery({
    queryKey: ['/api/terms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/terms');
      return await response.json();
    },
  });

  // Fetch student report card data
  const { data: reportCard, isLoading } = useQuery({
    queryKey: ['/api/reports/student-report-card', user?.id, selectedTerm],
    queryFn: async () => {
      if (!user?.id || !selectedTerm) return null;
      const response = await apiRequest('GET', `/api/reports/student-report-card/${user.id}?termId=${selectedTerm}`);
      return await response.json();
    },
    enabled: !!user?.id && !!selectedTerm,
  });

  // Fetch student details
  const { data: studentDetails } = useQuery({
    queryKey: ['/api/students/details', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await apiRequest('GET', `/api/students/${user.id}`);
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const handleExportPDF = async () => {
    if (!user?.id || !selectedTerm) {
      toast({
        title: "Error",
        description: "Please select a term first",
        variant: "destructive",
      });
      return;
    }
    try {
      toast({
        title: "Export Started",
        description: "Generating PDF report card...",
      });

      const response = await fetch(`/api/report-card/${user.id}/${selectedTerm}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-card-${user.firstName}-${user.lastName}-${selectedTerm}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Report card PDF has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report card",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-green-100 text-green-700';
      case 'B+': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-blue-100 text-blue-700';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOverallGPA = () => {
    if (!reportCard?.subjects) return 0;
    
    const gradePoints = {
      'A+': 4.0, 'A': 3.7, 'B+': 3.3, 'B': 3.0, 'C': 2.0, 'F': 0.0
    };
    
    const totalPoints = reportCard.subjects.reduce((sum: number, subject: any) => {
      return sum + (gradePoints[subject.grade as keyof typeof gradePoints] || 0);
    }, 0);
    
    return (totalPoints / reportCard.subjects.length).toFixed(2);
  };

  if (!user) {
    return <div>Please log in to access your report card.</div>;
  }
  // Map roleId to role name - matches ROLE_IDS in lib/roles.ts
  const getRoleName = (roleId: number): 'admin' | 'teacher' | 'parent' | 'student' => {
    const roleMap: { [key: number]: 'admin' | 'teacher' | 'parent' | 'student' } = {
      1: 'admin', 2: 'admin', 3: 'teacher', 4: 'student', 5: 'parent'
    };
    return roleMap[roleId] || 'student';
  };

  return (
    <PortalLayout
      userRole={getRoleName(user.roleId)}
      userName={user.firstName + ' ' + user.lastName}
      userInitials={user.firstName.charAt(0) + user.lastName.charAt(0)}
    >
      <div className="space-y-6 print:space-y-4" data-testid="student-report-card">
        {/* Header */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-3xl font-bold">Student Report Card</h1>
            <p className="text-muted-foreground">Academic performance summary</p>
          </div>
          <div className="flex space-x-2">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-48" data-testid="select-term">
                <SelectValue placeholder="Select Academic Term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term: any) => (
                  <SelectItem key={term.id} value={term.id.toString()}>
                    {term.name} ({term.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrint} data-testid="button-print">
              <FileText className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleExportPDF} data-testid="button-export-pdf">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {!selectedTerm ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Academic Term</h3>
              <p className="text-muted-foreground">
                Please select an academic term to view your report card.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading report card...</p>
            </CardContent>
          </Card>
        ) : !reportCard ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Report Card Not Yet Available</h3>
              <p className="text-muted-foreground mb-2">
                Your report card for this term has not been published yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check back later or contact your teacher for more information.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Student Information Header */}
            <Card className="print:shadow-none">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 print:bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          ID: {studentDetails?.admissionNumber || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <School className="w-4 h-4 mr-1" />
                          Class: {studentDetails?.className || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Term: {reportCard.termName} ({reportCard.termYear})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{calculateOverallGPA()}</div>
                    <div className="text-sm text-muted-foreground">Overall GPA</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
              <Card className="print:shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Subjects</p>
                      <p className="text-2xl font-bold">{reportCard.subjects?.length || 0}</p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="print:shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                      <p className="text-2xl font-bold">{reportCard.overallAverage || 0}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="print:shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Grade</p>
                      <p className="text-2xl font-bold">{reportCard.overallGrade || 'N/A'}</p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="print:shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Class Rank</p>
                      <p className="text-2xl font-bold">{reportCard.classRank || 'N/A'}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Report Card Format */}
            <Card className="print:shadow-none bg-gradient-to-br from-blue-50 to-blue-100 print:bg-white">
              <CardHeader className="text-center border-b-2 border-blue-200 print:border-gray-400">
                {/* School Letterhead */}
                <div className="flex items-center justify-center mb-6 print:mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-4 mb-2">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">TH</span>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-800">TREASURE-HOME SCHOOL</h1>
                        <p className="text-sm text-gray-600">Excellence in Education Since 2020</p>
                        <p className="text-xs text-gray-500">📍 Lagos, Nigeria | 📞 +234-XXX-XXXX | 📧 info@treasurehome.edu.ng</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-600 text-white p-4 rounded-lg mb-4 print:bg-gray-800">
                  <h2 className="text-2xl font-bold">OFFICIAL STUDENT REPORT CARD</h2>
                  <p className="text-sm mt-1 text-blue-100">Academic Performance Report</p>
                </div>
                
                {/* Student Information Box */}
                <div className="bg-white p-4 rounded-lg border border-blue-200 print:border-gray-400">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                      <p><strong>Student ID:</strong> {studentDetails?.admissionNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p><strong>Class:</strong> {studentDetails?.className || 'N/A'}</p>
                      <p><strong>Academic Session:</strong> {reportCard.termName} ({reportCard.termYear})</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Professional Subject Performance Table */}
                <div className="overflow-hidden">
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-blue-100 print:bg-gray-100">
                        <TableHead className="border border-gray-300 font-bold text-center py-3">Subject</TableHead>
                        <TableHead className="border border-gray-300 font-bold text-center py-3">Test (40)</TableHead>
                        <TableHead className="border border-gray-300 font-bold text-center py-3">Exam (60)</TableHead>
                        <TableHead className="border border-gray-300 font-bold text-center py-3">Total (100)</TableHead>
                        <TableHead className="border border-gray-300 font-bold text-center py-3">Grade</TableHead>
                        <TableHead className="border border-gray-300 font-bold text-center py-3">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportCard.subjects?.map((subject: any, index: number) => (
                        <TableRow key={subject.subjectName} data-testid={`row-subject-${index}`} className="hover:bg-blue-25 print:hover:bg-transparent">
                          <TableCell className="border border-gray-300 font-medium py-3">{subject.subjectName}</TableCell>
                          <TableCell className="border border-gray-300 text-center py-3 font-semibold">
                            {subject.testScore !== '-' ? `${subject.testScore}/40` : '-'}
                          </TableCell>
                          <TableCell className="border border-gray-300 text-center py-3 font-semibold">
                            {subject.examScore !== '-' ? `${subject.examScore}/60` : '-'}
                          </TableCell>
                          <TableCell className="border border-gray-300 text-center py-3 font-bold text-lg">
                            {subject.totalScore}/100
                          </TableCell>
                          <TableCell className="border border-gray-300 text-center py-3">
                            <span className={`px-3 py-1 rounded-full font-bold ${getGradeColor(subject.grade)}`}>
                              {subject.grade}
                            </span>
                          </TableCell>
                          <TableCell className="border border-gray-300 text-sm py-3">
                            {subject.remarks || 'Good'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Section */}
                <div className="bg-blue-50 print:bg-gray-50 p-6 border-t-2 border-blue-200 print:border-gray-400">
                  <h3 className="text-lg font-bold mb-4 text-center">Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Total Marks Obtained</p>
                      <p className="text-2xl font-bold text-blue-600">{reportCard.summary?.totalPoints || 0} / {reportCard.summary?.maxPoints || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Overall Percentage</p>
                      <p className="text-2xl font-bold text-green-600">{reportCard.summary?.averagePercentage || 0}%</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Class Rank</p>
                      <p className="text-2xl font-bold text-purple-600">{reportCard.classRank || 'N/A'} of {reportCard.totalStudents || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Teacher's Comments */}
                  {reportCard.teacherComments && reportCard.teacherComments.length > 0 && (
                    <div className="mt-6 bg-white p-4 rounded-lg border">
                      <h4 className="font-bold mb-3">Teacher's Comments:</h4>
                      <div className="space-y-2">
                        {reportCard.teacherComments.map((comment: any, index: number) => (
                          <p key={index} className="text-sm italic border-l-4 border-blue-400 pl-3">
                            <strong>{comment.subjectName}:</strong> {comment.comment}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Signature Section */}
                <div className="bg-white p-6 border-t print:border-gray-400">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2 h-16 flex items-end justify-center">
                        <span className="text-2xl font-cursive text-blue-600">{user.firstName.charAt(0)}. {user.lastName}</span>
                      </div>
                      <p className="text-sm font-medium">Class Teacher Signature</p>
                      <p className="text-xs text-muted-foreground">Date Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="border-b border-gray-400 mb-2 h-16 flex items-end justify-center">
                        <span className="text-2xl font-cursive text-purple-600">Dr. S. Chen</span>
                      </div>
                      <p className="text-sm font-medium">Principal/Head Signature</p>
                    </div>

                    <div className="text-center">
                      <div className="flex justify-center space-x-2 mb-4">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                          🖨️ Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportPDF}>
                          📄 Export PDF
                        </Button>
                        <Button variant="outline" size="sm">
                          📊 Export Excel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Academic Year: {reportCard.termYear}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Comments & School Remarks */}
            {reportCard.teacherComments && (
              <Card className="print:shadow-none">
                <CardHeader>
                  <CardTitle>Teacher Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportCard.teacherComments.map((comment: any, index: number) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <p className="font-medium">{comment.subjectName} - {comment.teacherName}</p>
                        <p className="text-sm text-muted-foreground mt-1">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer */}
            <Card className="print:shadow-none">
              <CardContent className="py-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div>
                    <p>Generated on: {new Date().toLocaleDateString()}</p>
                    <p>Academic Year: {reportCard.termYear}</p>
                  </div>
                  <div className="text-right">
                    <p>Treasure Home School</p>
                    <p>Student Management System</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
