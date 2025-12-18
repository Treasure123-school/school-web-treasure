import { forwardRef } from 'react';
import logoPath from '@assets/school-logo.png';

interface SubjectScore {
  subjectName: string;
  testScore: number | null;
  testMaxScore?: number | null;
  testWeightedScore?: number | null;
  examScore: number | null;
  examMaxScore?: number | null;
  examWeightedScore?: number | null;
  totalMarks?: number;
  obtainedMarks: number;
  grade: string;
  remarks?: string;
  subjectPosition?: number | null;
}

interface AttendanceSummary {
  timesSchoolOpened: number;
  timesPresent: number;
  timesAbsent: number;
  attendancePercentage?: number;
}

interface AffectiveTraits {
  punctuality?: number;
  neatness?: number;
  attentiveness?: number;
  teamwork?: number;
  leadership?: number;
  assignments?: number;
  classParticipation?: number;
  honesty?: number;
  politeness?: number;
  selfControl?: number;
  obedience?: number;
  reliability?: number;
  senseOfResponsibility?: number;
  relationshipWithOthers?: number;
}

interface PsychomotorSkills {
  handlingOfTools?: number;
  drawingPainting?: number;
  handwriting?: number;
  publicSpeaking?: number;
  speechFluency?: number;
  sports?: number;
  musicalSkills?: number;
  creativity?: number;
}

interface ReportCardData {
  id?: number;
  studentId?: string;
  studentName: string;
  studentPhoto?: string;
  admissionNumber: string;
  className: string;
  classArm?: string;
  department?: string | null;
  isSSS?: boolean;
  termName: string;
  academicSession?: string;
  termYear?: string;
  averagePercentage: number;
  overallGrade: string;
  position: number;
  totalStudentsInClass: number;
  totalScore?: number;
  items?: SubjectScore[];
  subjects?: SubjectScore[];
  teacherRemarks?: string | null;
  principalRemarks?: string | null;
  status?: string;
  generatedAt?: string;
  classStatistics?: {
    highestScore: number;
    lowestScore: number;
    classAverage: number;
    totalStudents: number;
  };
  attendance?: AttendanceSummary;
  affectiveTraits?: AffectiveTraits;
  psychomotorSkills?: PsychomotorSkills;
  dateIssued?: string;
  nextTermBegins?: string;
  teacherName?: string;
  principalName?: string;
  gender?: string;
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  club?: string;
}

interface BaileysReportTemplateProps {
  reportCard: ReportCardData;
  testWeight?: number;
  examWeight?: number;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolMotto?: string;
}

const getRemarkFromGrade = (grade: string): string => {
  if (!grade) return '';
  const g = grade.toUpperCase();
  if (g === 'A' || g === 'A+') return 'EXCELLENT';
  if (g === 'B' || g === 'B+') return 'VERY GOOD';
  if (g === 'C' || g === 'C+') return 'GOOD';
  if (g === 'D' || g === 'D+') return 'PASS';
  if (g === 'E') return 'FAIR';
  return 'WEAK';
};

const formatPosition = (pos: number): string => {
  if (!pos) return '-';
  if (pos >= 11 && pos <= 13) return `${pos}th`;
  switch (pos % 10) {
    case 1: return `${pos}st`;
    case 2: return `${pos}nd`;
    case 3: return `${pos}rd`;
    default: return `${pos}th`;
  }
};

const getGradeFromScore = (score: number): string => {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  if (score >= 30) return 'E';
  return 'F';
};

const countGrades = (subjects: SubjectScore[]) => {
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  subjects.forEach(s => {
    const g = s.grade?.toUpperCase()?.charAt(0);
    if (g && g in counts) {
      counts[g as keyof typeof counts]++;
    }
  });
  return counts;
};

export const BaileysReportTemplate = forwardRef<HTMLDivElement, BaileysReportTemplateProps>(({
  reportCard,
  testWeight = 40,
  examWeight = 60,
  schoolName = "TREASURE-HOME SCHOOL",
  schoolAddress = "Seriki-Soyinka, Ifo, Ogun State, Nigeria",
  schoolPhone = "08012345678",
  schoolEmail = "info@treasurehomeschool.com",
  schoolMotto = "Honesty and Success"
}, ref) => {
  const subjects = reportCard.items || reportCard.subjects || [];
  const totalObtained = subjects.reduce((sum, s) => sum + (s.obtainedMarks || 0), 0);
  const totalMax = subjects.length * 100;
  const avgPercentage = reportCard.averagePercentage || (totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0);
  const overallGrade = reportCard.overallGrade || getGradeFromScore(avgPercentage);
  const gradeCounts = countGrades(subjects);
  
  const attendance = reportCard.attendance || {
    timesSchoolOpened: 0,
    timesPresent: 0,
    timesAbsent: 0,
    attendancePercentage: 0
  };

  const affectiveTraits = reportCard.affectiveTraits || {};
  const psychomotorSkills = reportCard.psychomotorSkills || {};

  const affectiveLabels = [
    { key: 'attentiveness', label: 'Attentiveness' },
    { key: 'honesty', label: 'Honesty' },
    { key: 'neatness', label: 'Neatness' },
    { key: 'politeness', label: 'Politeness' },
    { key: 'punctuality', label: 'Punctuality/Assembly' },
    { key: 'selfControl', label: 'Self Control/ Calmness' },
    { key: 'obedience', label: 'Obedience' },
    { key: 'reliability', label: 'Reliability' },
    { key: 'senseOfResponsibility', label: 'Sense Of Responsibility' },
    { key: 'relationshipWithOthers', label: 'Relationship With Others' },
  ];

  const psychomotorLabels = [
    { key: 'handlingOfTools', label: 'Handling Of Tools' },
    { key: 'drawingPainting', label: 'Drawing/ Painting' },
    { key: 'handwriting', label: 'Handwriting' },
    { key: 'publicSpeaking', label: 'Public Speaking' },
    { key: 'speechFluency', label: 'Speech Fluency' },
    { key: 'sports', label: 'Sports & Games' },
  ];

  const RatingCell = ({ value }: { value: number | undefined }) => {
    return (
      <div className="flex justify-center gap-0.5">
        {[5, 4, 3, 2, 1].map((n) => (
          <div
            key={n}
            className={`w-4 h-4 border border-gray-400 text-[9px] flex items-center justify-center ${
              value && value >= n ? 'bg-gray-800 text-white' : 'bg-white'
            }`}
          >
            {n}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      ref={ref}
      className="bg-white text-black p-6 font-sans text-[11px] leading-tight"
      style={{ 
        width: '210mm', 
        minHeight: '297mm',
        maxWidth: '210mm',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* School Header */}
      <div className="text-center border-b-2 border-gray-800 pb-3 mb-2">
        <div className="flex items-center justify-center gap-4">
          <img 
            src={logoPath} 
            alt="School Logo" 
            className="h-16 w-16 object-contain"
            crossOrigin="anonymous"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-gray-900" style={{ fontFamily: 'Times New Roman, serif' }}>
              {schoolName}
            </h1>
            <p className="text-xs text-gray-700">{schoolAddress}</p>
            <p className="text-xs text-gray-600">TEL: {schoolPhone}; Email: {schoolEmail}</p>
          </div>
        </div>
        <div className="mt-2 bg-gray-100 py-1 px-4 inline-block">
          <span className="font-bold text-sm tracking-wide">
            {reportCard.termName?.toUpperCase() || 'FIRST TERM'} STUDENT'S PERFORMANCE REPORT
          </span>
        </div>
      </div>

      {/* Student Information Row */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-[10px]">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="font-semibold min-w-[80px]">NAME:</span>
            <span className="uppercase border-b border-gray-400 flex-1">{reportCard.studentName}</span>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">CLASS:</span>
              <span className="border-b border-gray-400 flex-1">{reportCard.className}{reportCard.classArm ? ` ${reportCard.classArm}` : ''}</span>
            </div>
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">SESSION:</span>
              <span className="border-b border-gray-400 flex-1">{reportCard.academicSession || reportCard.termYear || '2024/2025'}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">D.O.B:</span>
              <span className="border-b border-gray-400 flex-1">{reportCard.dateOfBirth || '-'}</span>
            </div>
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">AGE:</span>
              <span className="border-b border-gray-400">{'-'}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex gap-4">
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">GENDER:</span>
              <span className="border-b border-gray-400 flex-1">{reportCard.gender || '-'}</span>
            </div>
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">ADMISSION NO:</span>
              <span className="border-b border-gray-400 flex-1">{reportCard.admissionNumber}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">HT:</span>
              <span className="border-b border-gray-400">{reportCard.height || '-'} cm</span>
            </div>
            <div className="flex gap-2 flex-1">
              <span className="font-semibold">WT:</span>
              <span className="border-b border-gray-400">{reportCard.weight || '-'} kg</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">CLUB/SOCIETY:</span>
            <span className="border-b border-gray-400 flex-1">{reportCard.club || '-'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex gap-3">
        {/* Left Column - Cognitive Domain */}
        <div className="flex-1">
          <div className="border border-gray-800">
            <div className="bg-gray-200 text-center py-1 font-bold border-b border-gray-800 text-[10px]">
              COGNITIVE DOMAIN
            </div>
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-1 text-left font-semibold">SUBJECTS</th>
                  <th className="border border-gray-400 p-1 text-center font-semibold w-8">C.A</th>
                  <th className="border border-gray-400 p-1 text-center font-semibold w-8">EXAM</th>
                  <th className="border border-gray-400 p-1 text-center font-semibold w-8">TOTAL</th>
                  <th className="border border-gray-400 p-1 text-center font-semibold w-8">GRADE</th>
                  <th className="border border-gray-400 p-1 text-center font-semibold w-8">POS</th>
                  <th className="border border-gray-400 p-1 text-center font-semibold">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, idx) => {
                  const testScore = subject.testScore ?? subject.testWeightedScore ?? 0;
                  const examScore = subject.examScore ?? subject.examWeightedScore ?? 0;
                  const total = subject.obtainedMarks || (Number(testScore) + Number(examScore));
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 p-1 font-medium uppercase">{subject.subjectName}</td>
                      <td className="border border-gray-400 p-1 text-center">{testScore}</td>
                      <td className="border border-gray-400 p-1 text-center">{examScore}</td>
                      <td className="border border-gray-400 p-1 text-center font-semibold">{total}</td>
                      <td className="border border-gray-400 p-1 text-center font-semibold">{subject.grade || '-'}</td>
                      <td className="border border-gray-400 p-1 text-center">{subject.subjectPosition || '-'}</td>
                      <td className="border border-gray-400 p-1 text-center text-[8px]">{subject.remarks || getRemarkFromGrade(subject.grade)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Performance Summary */}
          <div className="border border-gray-800 mt-2">
            <div className="bg-gray-200 text-center py-1 font-bold border-b border-gray-800 text-[10px]">
              PERFORMANCE SUMMARY
            </div>
            <div className="p-2 text-[10px] grid grid-cols-2 gap-1">
              <div className="flex justify-between">
                <span>Total Obtained:</span>
                <span className="font-bold">{totalObtained}</span>
              </div>
              <div className="flex justify-between">
                <span>%AGE:</span>
                <span className="font-bold">{avgPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span>Total Obtainable:</span>
                <span className="font-bold">{totalMax}</span>
              </div>
              <div className="flex justify-between">
                <span>GRADE:</span>
                <span className="font-bold text-lg">{overallGrade}</span>
              </div>
            </div>
            <div className="border-t border-gray-400 p-2 text-center">
              <span className="font-bold text-sm">{getRemarkFromGrade(overallGrade)}</span>
            </div>
          </div>

          {/* Grade Scale */}
          <div className="border border-gray-800 mt-2">
            <div className="bg-gray-200 text-center py-1 font-bold border-b border-gray-800 text-[9px]">
              GRADE SCALE
            </div>
            <div className="p-1 text-[8px] text-center">
              70-100%=A(EXCELLENT) 60-69%=B(VERY GOOD) 50-59%=C(GOOD) 40-49%=D(PASS) 30-39%=E(FAIR) 0-29%=F(WEAK)
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[180px]">
          {/* Student Photo Placeholder */}
          <div className="border border-gray-800 h-24 mb-2 flex items-center justify-center bg-gray-50">
            {reportCard.studentPhoto ? (
              <img 
                src={reportCard.studentPhoto} 
                alt={reportCard.studentName}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <span className="text-gray-400 text-xs">Photo</span>
            )}
          </div>

          {/* Attendance Summary */}
          <div className="border border-gray-800 mb-2">
            <div className="bg-gray-200 text-center py-1 font-bold border-b border-gray-800 text-[9px]">
              ATTENDANCE SUMMARY
            </div>
            <div className="text-[9px]">
              <div className="flex justify-between p-1 border-b border-gray-300">
                <span>No of Times School Opened</span>
                <span className="font-bold">{attendance.timesSchoolOpened}</span>
              </div>
              <div className="flex justify-between p-1 border-b border-gray-300">
                <span>No of Times Present</span>
                <span className="font-bold">{attendance.timesPresent}</span>
              </div>
              <div className="flex justify-between p-1 border-b border-gray-300">
                <span>No of Times Absent</span>
                <span className="font-bold">{attendance.timesAbsent}</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Attendance %</span>
                <span className="font-bold">{attendance.attendancePercentage || (attendance.timesSchoolOpened > 0 ? Math.round((attendance.timesPresent / attendance.timesSchoolOpened) * 100) : 0)}%</span>
              </div>
            </div>
          </div>

          {/* Affective Domain */}
          <div className="border border-gray-800 mb-2">
            <div className="bg-gray-200 text-center py-1 font-bold border-b border-gray-800 text-[9px]">
              AFFECTIVE DOMAIN
            </div>
            <table className="w-full text-[8px]">
              <thead>
                <tr>
                  <th className="border-b border-gray-300 p-0.5 text-left"></th>
                  <th className="border-b border-gray-300 p-0.5 text-center" colSpan={5}>5 4 3 2 1</th>
                </tr>
              </thead>
              <tbody>
                {affectiveLabels.map(({ key, label }) => (
                  <tr key={key}>
                    <td className="p-0.5 border-b border-gray-200">{label}</td>
                    <td className="p-0.5 border-b border-gray-200">
                      <RatingCell value={affectiveTraits[key as keyof AffectiveTraits]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Psychomotor Domain */}
          <div className="border border-gray-800 mb-2">
            <div className="bg-gray-200 text-center py-1 font-bold border-b border-gray-800 text-[9px]">
              PSYCHOMOTOR DOMAIN
            </div>
            <table className="w-full text-[8px]">
              <thead>
                <tr>
                  <th className="border-b border-gray-300 p-0.5 text-left"></th>
                  <th className="border-b border-gray-300 p-0.5 text-center" colSpan={5}>5 4 3 2 1</th>
                </tr>
              </thead>
              <tbody>
                {psychomotorLabels.map(({ key, label }) => (
                  <tr key={key}>
                    <td className="p-0.5 border-b border-gray-200">{label}</td>
                    <td className="p-0.5 border-b border-gray-200">
                      <RatingCell value={psychomotorSkills[key as keyof PsychomotorSkills]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rating Indices */}
          <div className="border border-gray-800 mb-2 text-[8px] p-1">
            <div className="font-bold text-center border-b border-gray-300 pb-1 mb-1">Rating Indices</div>
            <div>5 - Maintains an Excellent degree of Observable traits.</div>
            <div>4 - Maintains a High level of Observable traits.</div>
            <div>3 - Acceptable level of Observable traits.</div>
            <div>2 - Shows Minimal regard for Observable traits.</div>
            <div>1 - Has No regard for Observable traits.</div>
          </div>

          {/* Grade Analysis */}
          <div className="border border-gray-800">
            <div className="bg-gray-200 text-center py-1 font-bold border-b border-gray-800 text-[9px]">
              GRADE ANALYSIS
            </div>
            <table className="w-full text-[9px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-0.5">GRADE</th>
                  <th className="border border-gray-300 p-0.5">A</th>
                  <th className="border border-gray-300 p-0.5">B</th>
                  <th className="border border-gray-300 p-0.5">C</th>
                  <th className="border border-gray-300 p-0.5">D</th>
                  <th className="border border-gray-300 p-0.5">E</th>
                  <th className="border border-gray-300 p-0.5">F</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-0.5 text-center font-semibold">No.</td>
                  <td className="border border-gray-300 p-0.5 text-center">{gradeCounts.A}</td>
                  <td className="border border-gray-300 p-0.5 text-center">{gradeCounts.B}</td>
                  <td className="border border-gray-300 p-0.5 text-center">{gradeCounts.C}</td>
                  <td className="border border-gray-300 p-0.5 text-center">{gradeCounts.D}</td>
                  <td className="border border-gray-300 p-0.5 text-center">{gradeCounts.E}</td>
                  <td className="border border-gray-300 p-0.5 text-center">{gradeCounts.F}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-center py-1 border-t border-gray-300 font-semibold">
              TOTAL SUBJECTS OFFERED: {subjects.length}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Remarks and Signatures */}
      <div className="mt-3 space-y-2">
        {/* Teacher's Remark */}
        <div className="border border-gray-800">
          <div className="flex">
            <div className="bg-gray-200 p-1 font-bold text-[10px] w-24 border-r border-gray-800">Teacher's Remark:</div>
            <div className="p-1 flex-1 min-h-[24px] text-[10px] italic">
              {reportCard.teacherRemarks || 'A bright, diligent and studious student. Always inquisitive and ready to learn.'}
            </div>
          </div>
        </div>

        {/* Teacher's Signature */}
        <div className="flex gap-4 text-[10px]">
          <div className="flex gap-2 flex-1">
            <span className="font-semibold">Teacher's Name:</span>
            <span className="border-b border-gray-400 flex-1 uppercase">{reportCard.teacherName || ''}</span>
          </div>
          <div className="flex gap-2 w-32">
            <span className="font-semibold">Sign:</span>
            <span className="border-b border-gray-400 flex-1"></span>
          </div>
        </div>

        {/* Principal's Remark */}
        <div className="border border-gray-800">
          <div className="flex">
            <div className="bg-gray-200 p-1 font-bold text-[10px] w-24 border-r border-gray-800">Principal's Remark:</div>
            <div className="p-1 flex-1 min-h-[24px] text-[10px] italic">
              {reportCard.principalRemarks || 'An outstanding result!! You should keep it up'}
            </div>
          </div>
        </div>

        {/* Principal's Signature */}
        <div className="flex gap-4 text-[10px]">
          <div className="flex gap-2 flex-1">
            <span className="font-semibold">Principal's Name:</span>
            <span className="border-b border-gray-400 flex-1 uppercase">{reportCard.principalName || ''}</span>
          </div>
          <div className="flex gap-2 w-32">
            <span className="font-semibold">Sign:</span>
            <span className="border-b border-gray-400 flex-1"></span>
          </div>
        </div>

        {/* Next Term and Date */}
        <div className="flex justify-between text-[10px] border-t border-gray-400 pt-2 mt-2">
          <div className="flex gap-2">
            <span className="font-semibold">Next Term Begins:</span>
            <span className="border-b border-gray-400 min-w-[100px]">{reportCard.nextTermBegins || ''}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">Date:</span>
            <span className="border-b border-gray-400 min-w-[100px]">{reportCard.dateIssued || new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Position Summary */}
        <div className="text-center border border-gray-800 py-2 bg-gray-50 mt-2">
          <span className="font-bold text-sm">
            CLASS POSITION: {formatPosition(reportCard.position)} out of {reportCard.totalStudentsInClass} Students
          </span>
        </div>

        {/* Footer */}
        <div className="text-center text-[8px] text-gray-500 mt-2 pt-2 border-t border-gray-300">
          <p className="italic">"{schoolMotto}"</p>
          <p>{schoolName} - {schoolAddress}</p>
        </div>
      </div>
    </div>
  );
});

BaileysReportTemplate.displayName = 'BaileysReportTemplate';

export default BaileysReportTemplate;
