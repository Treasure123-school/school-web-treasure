import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Printer, 
  User,
  GraduationCap,
  Calendar,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  BookOpen,
  Star,
  Loader2,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SubjectScore {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
  testScore: number | null;
  testMaxScore: number | null;
  testWeightedScore: number | null;
  examScore: number | null;
  examMaxScore: number | null;
  examWeightedScore: number | null;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  remarks: string;
  teacherRemarks?: string | null;
  isOverridden?: boolean;
  canEditTest?: boolean;
  canEditExam?: boolean;
  canEditRemarks?: boolean;
}

interface ClassStatistics {
  highestScore: number;
  lowestScore: number;
  classAverage: number;
  totalStudents: number;
}

interface AttendanceSummary {
  timesSchoolOpened: number;
  timesPresent: number;
  timesAbsent: number;
  attendancePercentage: number;
}

interface AffectiveTraits {
  punctuality: number;
  neatness: number;
  attentiveness: number;
  politeness: number;
  classParticipation: number;
  relationshipWithOthers: number;
  perseverance: number;
  selfControl: number;
  emotionalStability: number;
}

interface PsychomotorSkills {
  handwriting: number;
  drawingCreativity: number;
  gamesSports: number;
  musicalSkills: number;
  practicalSkills: number;
}

interface ReportCardData {
  id: number;
  studentId: string;
  studentName: string;
  studentPhoto?: string;
  admissionNumber: string;
  className: string;
  classArm?: string;
  termName: string;
  academicSession?: string;
  averagePercentage: number;
  overallGrade: string;
  position: number;
  totalStudentsInClass: number;
  totalScore?: number;
  items: SubjectScore[];
  teacherRemarks?: string | null;
  principalRemarks?: string | null;
  status: string;
  generatedAt?: string;
  classStatistics?: ClassStatistics;
  attendance?: AttendanceSummary;
  affectiveTraits?: AffectiveTraits;
  psychomotorSkills?: PsychomotorSkills;
}

interface ProfessionalReportCardProps {
  reportCard: ReportCardData;
  testWeight: number;
  examWeight: number;
  onEditSubject?: (item: SubjectScore) => void;
  onSaveRemarks?: (teacherRemarks: string, principalRemarks: string) => void;
  canEditRemarks?: boolean;
  isLoading?: boolean;
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const getGradeColor = (grade: string) => {
  if (!grade) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  const gradeUpper = grade.toUpperCase();
  if (gradeUpper.startsWith('A')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (gradeUpper.startsWith('B')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (gradeUpper.startsWith('C')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (gradeUpper.startsWith('D') || gradeUpper.startsWith('E')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
};

const getPositionSuffix = (pos: number): string => {
  if (!pos) return '';
  if (pos >= 11 && pos <= 13) return 'th';
  switch (pos % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatPosition = (pos: number): string => {
  if (!pos) return '-';
  return `${pos}${getPositionSuffix(pos)}`;
};

const RatingStars = ({ value, onChange, readonly = false }: { value: number; onChange?: (val: number) => void; readonly?: boolean }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
            ${star <= value 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'}
            ${!readonly ? 'hover-elevate cursor-pointer' : 'cursor-default'}
          `}
          data-testid={`rating-star-${star}`}
        >
          {star}
        </button>
      ))}
      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
        {value > 0 ? RATING_LABELS[value] : '-'}
      </span>
    </div>
  );
};

export function ProfessionalReportCard({
  reportCard,
  testWeight,
  examWeight,
  onEditSubject,
  onSaveRemarks,
  canEditRemarks = false,
  isLoading = false
}: ProfessionalReportCardProps) {
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(true);
  const [isAffectiveOpen, setIsAffectiveOpen] = useState(true);
  const [isPsychomotorOpen, setIsPsychomotorOpen] = useState(true);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(true);
  const [localRemarks, setLocalRemarks] = useState({
    teacher: reportCard.teacherRemarks || '',
    principal: reportCard.principalRemarks || ''
  });
  const [affectiveTraits, setAffectiveTraits] = useState<AffectiveTraits>(
    reportCard.affectiveTraits || {
      punctuality: 0,
      neatness: 0,
      attentiveness: 0,
      politeness: 0,
      classParticipation: 0,
      relationshipWithOthers: 0,
      perseverance: 0,
      selfControl: 0,
      emotionalStability: 0
    }
  );
  const [psychomotorSkills, setPsychomotorSkills] = useState<PsychomotorSkills>(
    reportCard.psychomotorSkills || {
      handwriting: 0,
      drawingCreativity: 0,
      gamesSports: 0,
      musicalSkills: 0,
      practicalSkills: 0
    }
  );
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const attendance = reportCard.attendance || {
    timesSchoolOpened: 0,
    timesPresent: 0,
    timesAbsent: 0,
    attendancePercentage: 0
  };

  const classStats = reportCard.classStatistics || {
    highestScore: 0,
    lowestScore: 0,
    classAverage: 0,
    totalStudents: reportCard.totalStudentsInClass || 0
  };

  const totalSubjects = reportCard.items?.length || 0;
  const totalObtained = reportCard.items?.reduce((sum, item) => sum + (item.obtainedMarks || 0), 0) || 0;
  const totalMax = reportCard.items?.reduce((sum, item) => sum + (item.totalMarks || 100), 0) || 0;

  const affectiveTraitLabels: { key: keyof AffectiveTraits; label: string }[] = [
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'neatness', label: 'Neatness' },
    { key: 'attentiveness', label: 'Attentiveness' },
    { key: 'politeness', label: 'Politeness' },
    { key: 'classParticipation', label: 'Class Participation' },
    { key: 'relationshipWithOthers', label: 'Relationship with Others' },
    { key: 'perseverance', label: 'Perseverance' },
    { key: 'selfControl', label: 'Self-Control' },
    { key: 'emotionalStability', label: 'Emotional Stability' }
  ];

  const psychomotorLabels: { key: keyof PsychomotorSkills; label: string }[] = [
    { key: 'handwriting', label: 'Handwriting' },
    { key: 'drawingCreativity', label: 'Drawing & Creativity' },
    { key: 'gamesSports', label: 'Games & Sports' },
    { key: 'musicalSkills', label: 'Musical Skills' },
    { key: 'practicalSkills', label: 'Practical Skills' }
  ];

  return (
    <div ref={printRef} className="w-full bg-background print:bg-white">
      {/* Print Header - Hidden on screen, shown only when printing */}
      <div className="hidden print:block mb-6">
        <div className="text-center border-b-2 border-primary pb-4">
          <h1 className="text-2xl font-bold text-primary">TREASURE HOME SCHOOL</h1>
          <p className="text-sm text-muted-foreground">Seriki-Soyinka, Ifo, Ogun State</p>
          <p className="text-xs italic mt-1">Motto: Honesty and Success</p>
        </div>
        <h2 className="text-center text-lg font-semibold mt-4 mb-2">STUDENT ACADEMIC REPORT</h2>
      </div>

      {/* Action Buttons - Screen only */}
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print">
          <Printer className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Print</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
          <Download className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </div>

      {/* Student Info Panel - Responsive */}
      <Card className="mb-4 print:shadow-none print:border-2">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Student Photo */}
            <div className="flex justify-center sm:justify-start">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/20 print:border-primary">
                {reportCard.studentPhoto ? (
                  <AvatarImage src={reportCard.studentPhoto} alt={reportCard.studentName} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xl">
                  {reportCard.studentName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Student Details - Responsive Grid */}
            <div className="flex-1">
              <h3 className="font-bold text-lg sm:text-xl text-center sm:text-left mb-3" data-testid="text-student-name">
                {reportCard.studentName}
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Admission No:</span>
                  <span className="font-medium ml-1" data-testid="text-admission-number">{reportCard.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class:</span>
                  <span className="font-medium ml-1" data-testid="text-class-name">{reportCard.className}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Session:</span>
                  <span className="font-medium ml-1" data-testid="text-session">{reportCard.academicSession || '2024/2025'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Term:</span>
                  <span className="font-medium ml-1" data-testid="text-term">{reportCard.termName}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Summary - Responsive Grid */}
      <Card className="mb-4 print:shadow-none print:border-2">
        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Academic Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-muted/50 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Total Score</p>
              <p className="text-lg sm:text-xl font-bold" data-testid="text-total-score">
                {totalObtained}<span className="text-sm font-normal text-muted-foreground">/{totalMax}</span>
              </p>
            </div>
            <div className="bg-muted/50 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-lg sm:text-xl font-bold" data-testid="text-average">
                {reportCard.averagePercentage || 0}%
              </p>
            </div>
            <div className="bg-muted/50 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Grade</p>
              <Badge className={`text-sm sm:text-base ${getGradeColor(reportCard.overallGrade)}`} data-testid="badge-grade">
                {reportCard.overallGrade || '-'}
              </Badge>
            </div>
            <div className="bg-muted/50 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Subjects</p>
              <p className="text-lg sm:text-xl font-bold" data-testid="text-subjects-count">
                {totalSubjects}
              </p>
            </div>
            <div className="bg-primary/10 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Award className="w-3 h-3" /> Position
              </p>
              <p className="text-lg sm:text-xl font-bold text-primary" data-testid="text-position">
                {formatPosition(reportCard.position)} <span className="text-sm font-normal text-muted-foreground">of {reportCard.totalStudentsInClass}</span>
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" /> Class Highest
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-600" data-testid="text-class-highest">
                {classStats.highestScore}%
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-600" /> Class Lowest
              </p>
              <p className="text-lg sm:text-xl font-bold text-red-600" data-testid="text-class-lowest">
                {classStats.lowestScore}%
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-md text-center">
              <p className="text-xs text-muted-foreground">Class Average</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600" data-testid="text-class-average">
                {classStats.classAverage}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Scores - Collapsible on Mobile */}
      <Collapsible open={isSubjectsOpen} onOpenChange={setIsSubjectsOpen} className="mb-4">
        <Card className="print:shadow-none print:border-2">
          <CollapsibleTrigger asChild className="print:hidden">
            <CardHeader className="pb-2 pt-3 px-3 sm:px-4 cursor-pointer hover-elevate">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Subject Performance
                  <span className="text-xs text-muted-foreground font-normal">
                    (Test {testWeight}% | Exam {examWeight}%)
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2 sm:hidden">
                  {isSubjectsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          {/* Print Header */}
          <CardHeader className="hidden print:block pb-2 pt-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              Subject Performance (Test {testWeight}% | Exam {examWeight}%)
            </CardTitle>
          </CardHeader>
          
          <CollapsibleContent className="print:!block">
            <CardContent className="p-0 sm:p-3 print:p-3">
              {/* Desktop Table View */}
              <div className="hidden sm:block print:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 font-semibold border-b">Subject</th>
                      <th className="text-center p-2 font-semibold border-b">Test ({testWeight}%)</th>
                      <th className="text-center p-2 font-semibold border-b">Exam ({examWeight}%)</th>
                      <th className="text-center p-2 font-semibold border-b">Total</th>
                      <th className="text-center p-2 font-semibold border-b">Grade</th>
                      <th className="text-left p-2 font-semibold border-b print:hidden">Remarks</th>
                      <th className="text-center p-2 font-semibold border-b print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard.items?.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="p-2 font-medium border-b">{item.subjectName}</td>
                        <td className="text-center p-2 border-b">
                          {item.testScore !== null ? item.testScore : '-'}/{item.testMaxScore || testWeight}
                        </td>
                        <td className="text-center p-2 border-b">
                          {item.examScore !== null ? item.examScore : '-'}/{item.examMaxScore || examWeight}
                        </td>
                        <td className="text-center p-2 font-semibold border-b">
                          {item.obtainedMarks || 0}/100
                          <span className="text-xs text-muted-foreground ml-1">({item.percentage || 0}%)</span>
                        </td>
                        <td className="text-center p-2 border-b">
                          <Badge className={`${getGradeColor(item.grade)}`}>{item.grade || '-'}</Badge>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground border-b max-w-[150px] truncate print:hidden">
                          {item.remarks || item.teacherRemarks || '-'}
                        </td>
                        <td className="text-center p-2 border-b print:hidden">
                          {(item.canEditTest || item.canEditExam || item.canEditRemarks) && onEditSubject && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onEditSubject(item)}
                              data-testid={`button-edit-subject-${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-2 p-3 print:hidden">
                {reportCard.items?.map((item) => (
                  <div key={item.id} className="bg-muted/30 rounded-md p-3" data-testid={`card-subject-${item.id}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{item.subjectName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getGradeColor(item.grade)} text-xs`}>{item.grade || '-'}</Badge>
                          <span className="text-xs text-muted-foreground">{item.percentage || 0}%</span>
                        </div>
                      </div>
                      {(item.canEditTest || item.canEditExam || item.canEditRemarks) && onEditSubject && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEditSubject(item)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-background p-2 rounded">
                        <p className="text-muted-foreground">Test</p>
                        <p className="font-medium">{item.testScore !== null ? item.testScore : '-'}/{item.testMaxScore || testWeight}</p>
                      </div>
                      <div className="bg-background p-2 rounded">
                        <p className="text-muted-foreground">Exam</p>
                        <p className="font-medium">{item.examScore !== null ? item.examScore : '-'}/{item.examMaxScore || examWeight}</p>
                      </div>
                      <div className="bg-background p-2 rounded">
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold">{item.obtainedMarks || 0}/100</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Attendance Summary */}
      <Collapsible open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen} className="mb-4">
        <Card className="print:shadow-none print:border-2">
          <CollapsibleTrigger asChild className="print:hidden">
            <CardHeader className="pb-2 pt-3 px-3 sm:px-4 cursor-pointer hover-elevate">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance Summary
                </CardTitle>
                <div className="flex items-center gap-2 sm:hidden">
                  {isAttendanceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CardHeader className="hidden print:block pb-2 pt-3 px-4">
            <CardTitle className="text-base">Attendance Summary</CardTitle>
          </CardHeader>
          
          <CollapsibleContent className="print:!block">
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-muted/50 p-2 sm:p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">School Opened</p>
                  <p className="text-lg font-bold" data-testid="text-school-opened">{attendance.timesSchoolOpened}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 sm:p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">Times Present</p>
                  <p className="text-lg font-bold text-green-600" data-testid="text-times-present">{attendance.timesPresent}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 sm:p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">Times Absent</p>
                  <p className="text-lg font-bold text-red-600" data-testid="text-times-absent">{attendance.timesAbsent}</p>
                </div>
                <div className="bg-primary/10 p-2 sm:p-3 rounded-md text-center">
                  <p className="text-xs text-muted-foreground">Attendance %</p>
                  <p className="text-lg font-bold text-primary" data-testid="text-attendance-percentage">
                    {attendance.attendancePercentage}%
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Affective Traits (Behavioural) */}
      <Collapsible open={isAffectiveOpen} onOpenChange={setIsAffectiveOpen} className="mb-4">
        <Card className="print:shadow-none print:border-2">
          <CollapsibleTrigger asChild className="print:hidden">
            <CardHeader className="pb-2 pt-3 px-3 sm:px-4 cursor-pointer hover-elevate">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Affective Traits (Behavioural)
                </CardTitle>
                <div className="flex items-center gap-2 sm:hidden">
                  {isAffectiveOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CardHeader className="hidden print:block pb-2 pt-3 px-4">
            <CardTitle className="text-base">Affective Traits (Behavioural)</CardTitle>
          </CardHeader>
          
          <CollapsibleContent className="print:!block">
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {affectiveTraitLabels.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <Label className="text-xs sm:text-sm">{label}</Label>
                    <RatingStars
                      value={affectiveTraits[key]}
                      onChange={(val) => setAffectiveTraits(prev => ({ ...prev, [key]: val }))}
                      readonly={!canEditRemarks}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Rating: 1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Psychomotor Skills */}
      <Collapsible open={isPsychomotorOpen} onOpenChange={setIsPsychomotorOpen} className="mb-4">
        <Card className="print:shadow-none print:border-2">
          <CollapsibleTrigger asChild className="print:hidden">
            <CardHeader className="pb-2 pt-3 px-3 sm:px-4 cursor-pointer hover-elevate">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Psychomotor Skills
                </CardTitle>
                <div className="flex items-center gap-2 sm:hidden">
                  {isPsychomotorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CardHeader className="hidden print:block pb-2 pt-3 px-4">
            <CardTitle className="text-base">Psychomotor Skills</CardTitle>
          </CardHeader>
          
          <CollapsibleContent className="print:!block">
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {psychomotorLabels.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <Label className="text-xs sm:text-sm">{label}</Label>
                    <RatingStars
                      value={psychomotorSkills[key]}
                      onChange={(val) => setPsychomotorSkills(prev => ({ ...prev, [key]: val }))}
                      readonly={!canEditRemarks}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Rating: 1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Teacher & Principal Remarks */}
      <Card className="mb-4 print:shadow-none print:border-2">
        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
          <CardTitle className="text-sm sm:text-base">Remarks & Sign-Off</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-4">
          {/* Teacher Remarks */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Class Teacher's Comment</Label>
            <Textarea
              value={localRemarks.teacher}
              onChange={(e) => setLocalRemarks(prev => ({ ...prev, teacher: e.target.value }))}
              placeholder="Enter class teacher's remarks..."
              disabled={!canEditRemarks}
              className="resize-none min-h-[80px] text-sm"
              data-testid="textarea-teacher-remarks"
            />
          </div>

          {/* Principal Remarks */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Principal's Comment</Label>
            <Textarea
              value={localRemarks.principal}
              onChange={(e) => setLocalRemarks(prev => ({ ...prev, principal: e.target.value }))}
              placeholder="Enter principal's remarks..."
              disabled={!canEditRemarks}
              className="resize-none min-h-[80px] text-sm"
              data-testid="textarea-principal-remarks"
            />
          </div>

          {/* Save Remarks Button or Lock Notice */}
          <div className="flex justify-end print:hidden">
            {canEditRemarks && onSaveRemarks ? (
              <Button
                size="sm"
                onClick={() => onSaveRemarks(localRemarks.teacher, localRemarks.principal)}
                disabled={isLoading}
                data-testid="button-save-remarks"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Saving...' : 'Save Remarks'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Remarks are locked. Revert to draft to edit.</span>
              </div>
            )}
          </div>

          {/* Signature Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t print:pt-8">
            <div className="text-center">
              <div className="border-b border-muted-foreground/30 pb-8 mb-2 min-h-[40px] flex items-end justify-center">
                <span className="text-muted-foreground text-sm print:text-black">_____________________</span>
              </div>
              <p className="font-medium text-sm">Class Teacher's Signature</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {reportCard.generatedAt ? format(new Date(reportCard.generatedAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
              </p>
            </div>
            <div className="text-center">
              <div className="border-b border-muted-foreground/30 pb-8 mb-2 min-h-[40px] flex items-end justify-center">
                <span className="text-muted-foreground text-sm print:text-black">_____________________</span>
              </div>
              <p className="font-medium text-sm">Principal's Signature</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {reportCard.generatedAt ? format(new Date(reportCard.generatedAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grading Key - For Print */}
      <Card className="print:shadow-none print:border-2 print:break-inside-avoid">
        <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
          <CardTitle className="text-sm">Grading Key</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center text-xs">
            <div className="flex items-center gap-1">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">A</Badge>
              <span>75-100 (Excellent)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">B</Badge>
              <span>65-74 (Very Good)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">C</Badge>
              <span>55-64 (Good)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">D</Badge>
              <span>45-54 (Fair)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">F</Badge>
              <span>0-44 (Needs Improvement)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-2 {
            border-width: 2px !important;
          }
          .print\\:pt-8 {
            padding-top: 2rem !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
          [data-state="closed"] > [data-radix-collapsible-content] {
            display: block !important;
            visibility: visible !important;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}

export default ProfessionalReportCard;
