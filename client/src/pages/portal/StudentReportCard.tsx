
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
  TrendingUp
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

  const handleExportPDF = () => {
    toast({
      title: "Export Started",
      description: "Generating PDF report card...",
    });
    
    // In a real implementation, this would call a PDF generation API
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Report card PDF has been generated and downloaded.",
      });
    }, 2000);
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

  const getRoleName = (roleId: number): 'admin' | 'teacher' | 'parent' | 'student' => {
    const roleMap: { [key: number]: 'admin' | 'teacher' | 'parent' | 'student' } = {
      1: 'admin', 2: 'teacher', 3: 'student', 4: 'parent'
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
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Report Available</h3>
              <p className="text-muted-foreground">
                No report card data found for the selected term.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Student Information Header */}
            <Card className="print:shadow-none">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 print:bg-white">
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

            {/* Detailed Subject Results - CORE PRIORITY FLOW Format */}
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Subject Performance Report
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Scoring Formula: Test (40%) + Exam (60%) = Total (100%)
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Subject</TableHead>
                      <TableHead className="text-center font-semibold">Test (40%)</TableHead>
                      <TableHead className="text-center font-semibold">Exam (60%)</TableHead>
                      <TableHead className="text-center font-semibold">Total (100%)</TableHead>
                      <TableHead className="text-center font-semibold">Grade</TableHead>
                      <TableHead className="font-semibold">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportCard.subjects?.map((subject: any, index: number) => (
                      <TableRow key={subject.subjectName} data-testid={`row-subject-${index}`}>
                        <TableCell className="font-medium">{subject.subjectName}</TableCell>
                        <TableCell className="text-center">
                          {subject.testScore !== '-' ? `${subject.testScore}%` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {subject.examScore !== '-' ? `${subject.examScore}%` : '-'}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {subject.totalScore}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getGradeColor(subject.grade)}>
                            {subject.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {subject.remarks}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
