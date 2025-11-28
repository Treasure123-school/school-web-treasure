import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  FileText, 
  Calendar, 
  AlertCircle, 
  ArrowLeft, 
  GraduationCap,
  Timer,
  Target,
  BarChart3,
  Loader
} from 'lucide-react';
import schoolLogo from '@assets/1000025432-removebg-preview (1)_1757796555126.png';

interface ExamResult {
  id?: number;
  sessionId?: number;
  examId?: number;
  studentId?: number;
  score: number;
  totalScore?: number;
  maxScore: number;
  percentage?: number;
  submittedAt?: string;
  timeTakenSeconds?: number;
  timeTakenFormatted?: string;
  submissionReason?: 'manual' | 'timeout' | 'violation';
  violationCount?: number;
  examTitle?: string;
  breakdown?: {
    correct: number;
    incorrect: number;
    totalQuestions: number;
    autoScored: number;
  };
  questionDetails?: Array<{
    questionId: number;
    questionText: string;
    isCorrect: boolean | null;
    pointsAwarded: number;
    maxPoints: number;
    studentAnswer?: string;
    correctAnswer?: string;
  }>;
  exam?: {
    id: number;
    title: string;
    description?: string;
    subjectId?: number;
    classId?: number;
    timeLimit?: number;
  };
}

export default function StudentExamResults() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [latestResult, setLatestResult] = useState<ExamResult | null>(null);
  
  // First, check sessionStorage for the most recent exam result
  useEffect(() => {
    const storedResult = sessionStorage.getItem('lastExamResult');
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setLatestResult(parsed);
        // Don't remove immediately - keep until confirmed by API or user navigates away
      } catch (e) {
        console.error('Failed to parse stored exam result:', e);
      }
    }
  }, []);

  // Clear sessionStorage when API confirms the result is saved (prevents duplicate on refresh)
  useEffect(() => {
    if (latestResult && examResults.length > 0) {
      // Check if API results include the submitted exam
      const apiHasLatest = examResults.some(r => 
        r.sessionId === latestResult.sessionId || 
        (r.examId === latestResult.examId && r.submittedAt)
      );
      if (apiHasLatest) {
        // Safe to clear sessionStorage as API has the data
        sessionStorage.removeItem('lastExamResult');
      }
    }
  }, [latestResult, examResults]);

  // Fetch exam results from API as fallback or for history
  const { data: examResults = [], isLoading, error } = useQuery<ExamResult[]>({
    queryKey: ['/api/exam-results'],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiRequest('GET', '/api/exam-results');
      if (!response.ok) {
        throw new Error('Failed to fetch exam results');
      }
      const results = await response.json();
      // Filter to only show results for this student
      return results.filter((r: any) => r.studentId === user.id);
    },
    enabled: !!user?.id,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Combine latestResult (from sessionStorage) with API results for display
  // Always prioritize the latestResult (freshly submitted) at the top
  const allResults = useMemo(() => {
    if (!latestResult) return examResults;
    
    // Check if latestResult is already in API results (by sessionId or matching timestamp)
    const isDuplicate = examResults.some(r => 
      r.sessionId === latestResult.sessionId ||
      (r.examId === latestResult.examId && 
       Math.abs(new Date(r.submittedAt || 0).getTime() - new Date(latestResult.submittedAt || 0).getTime()) < 60000)
    );
    
    if (isDuplicate) {
      // API has this result, use API version but keep order
      return examResults;
    }
    
    // Add latestResult at the beginning
    return [latestResult, ...examResults];
  }, [latestResult, examResults]);

  const selectedResult = useMemo(() => {
    // Prioritize latestResult for immediate display after submission (when no selection made)
    if (latestResult && !selectedResultId) return latestResult;
    if (!selectedResultId) return allResults[0] || null;
    return allResults.find(r => r.id === selectedResultId) || allResults[0] || null;
  }, [selectedResultId, allResults, latestResult]);

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: 'Outstanding', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' };
    if (percentage >= 80) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    if (percentage >= 70) return { label: 'Very Good', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    if (percentage >= 60) return { label: 'Good', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
    if (percentage >= 50) return { label: 'Fair', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' };
    return { label: 'Needs Improvement', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' };
  };

  const getSubmissionTypeInfo = (reason?: string, violations?: number) => {
    if (reason === 'violation') {
      return { 
        label: `Auto-Submitted (${violations || 0} Violations)`, 
        color: 'text-red-600', 
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: AlertCircle 
      };
    }
    if (reason === 'timeout') {
      return { 
        label: 'Auto-Submitted (Time Expired)', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        icon: Timer 
      };
    }
    return { 
      label: 'Submitted Manually', 
      color: 'text-green-600', 
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: CheckCircle 
    };
  };

  // Show loading only if we don't have a latestResult from sessionStorage
  if (isLoading && !latestResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading your exam results...</p>
        </div>
      </div>
    );
  }

  // Show no results only if we don't have latestResult AND API returned empty
  if ((error || allResults.length === 0) && !latestResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <img src={schoolLogo} alt="Treasure-Home School" className="h-10 w-10 object-contain" />
              <div>
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">Treasure-Home School</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exam Results</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Exam Results Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't completed any exams yet.</p>
              <Button onClick={() => setLocation('/portal/student/exams')} data-testid="button-go-to-exams">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Exams
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const result = selectedResult;
  if (!result) return null;

  const percentage = result.percentage || Math.round((result.score / result.maxScore) * 100) || 0;
  const performance = getPerformanceLevel(percentage);
  const submissionInfo = getSubmissionTypeInfo(result.submissionReason, result.violationCount);
  const SubmissionIcon = submissionInfo.icon;

  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={schoolLogo} alt="Treasure-Home School" className="h-10 w-10 object-contain" />
              <div>
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">Treasure-Home School</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Exam Results</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/portal/student/exams')}
              data-testid="button-back-to-exams"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Exams
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {allResults.length > 1 && (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Your Exam History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allResults.map((r, index) => {
                  const resultPercentage = r.percentage ?? (r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0);
                  const isSelected = selectedResultId === r.id || (!selectedResultId && index === 0);
                  return (
                    <Button
                      key={r.id || r.sessionId || index}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => r.id && setSelectedResultId(r.id)}
                      className="flex items-center gap-2"
                      data-testid={`button-result-${r.id || index}`}
                    >
                      <span>{r.examTitle || r.exam?.title || `Exam #${r.examId || index + 1}`}</span>
                      <Badge variant={resultPercentage >= 60 ? "default" : "destructive"} className="text-xs">
                        {resultPercentage}%
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-6" data-testid="banner-result-success">
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 ${performance.bgColor} rounded-full flex items-center justify-center`}>
              <Trophy className={`w-10 h-10 ${performance.color}`} />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {result.examTitle || result.exam?.title || 'Exam'} - Results
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your exam has been successfully submitted and scored.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 shadow-lg" data-testid="card-score-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Score Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className={`${percentage >= 60 ? 'text-green-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white" data-testid="text-percentage">
                      {percentage}%
                    </div>
                    <div className={`text-sm font-medium ${performance.color}`} data-testid="text-performance">
                      {performance.label}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-score">
                    {result.score} / {result.maxScore}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Points Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-lg" data-testid="card-detailed-stats">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Detailed Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.breakdown && (
                <>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-medium text-green-700 dark:text-green-300">Correct Answers</span>
                    </div>
                    <span className="text-xl font-bold text-green-600" data-testid="value-correct">
                      {result.breakdown.correct}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-medium text-red-700 dark:text-red-300">Incorrect Answers</span>
                    </div>
                    <span className="text-xl font-bold text-red-600" data-testid="value-incorrect">
                      {result.breakdown.incorrect}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-blue-700 dark:text-blue-300">Total Questions</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600" data-testid="value-total">
                      {result.breakdown.totalQuestions}
                    </span>
                  </div>
                </>
              )}

              {result.timeTakenFormatted && (
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-medium text-indigo-700 dark:text-indigo-300">Time Taken</span>
                  </div>
                  <span className="text-xl font-bold text-indigo-600" data-testid="value-time">
                    {result.timeTakenFormatted}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-purple-700 dark:text-purple-300">Submitted At</span>
                </div>
                <span className="text-sm font-medium text-purple-600" data-testid="value-submitted">
                  {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : 'Just now'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 ${submissionInfo.bgColor} rounded-lg`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${submissionInfo.bgColor}`}>
                    <SubmissionIcon className={`w-5 h-5 ${submissionInfo.color}`} />
                  </div>
                  <span className={`font-medium ${submissionInfo.color}`}>Submission Type</span>
                </div>
                <span className={`text-sm font-medium ${submissionInfo.color}`} data-testid="value-submission-type">
                  {submissionInfo.label}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {result.questionDetails && result.questionDetails.length > 0 && (
          <Card className="bg-white dark:bg-gray-800 shadow-lg" data-testid="card-question-breakdown">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Question-by-Question Breakdown
                </div>
                <Badge variant="outline">
                  {result.questionDetails.filter(q => q.isCorrect === true).length} / {result.questionDetails.length} Correct
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {result.questionDetails.map((question, index) => (
                  <div
                    key={question.questionId || index}
                    className={`p-4 rounded-lg border-l-4 ${
                      question.isCorrect === true
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : question.isCorrect === false
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                    }`}
                    data-testid={`question-result-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Question {index + 1}
                          </span>
                          {question.isCorrect === true && (
                            <Badge className="bg-green-600 text-white text-xs">Correct</Badge>
                          )}
                          {question.isCorrect === false && (
                            <Badge variant="destructive" className="text-xs">Incorrect</Badge>
                          )}
                          {question.isCorrect === null && (
                            <Badge variant="secondary" className="text-xs">Pending Review</Badge>
                          )}
                        </div>
                        {question.questionText && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {question.questionText}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Points: {question.pointsAwarded}/{question.maxPoints}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/portal/student/exams')}
            className="flex items-center gap-2"
            data-testid="button-view-more-exams"
          >
            <ArrowLeft className="w-4 h-4" />
            View Available Exams
          </Button>
          <Button 
            onClick={() => setLocation('/portal/student')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            data-testid="button-go-to-dashboard"
          >
            <GraduationCap className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          <p>Your results have been saved and will be available in your academic records.</p>
          <p>For any questions, please contact your teacher or school administration.</p>
        </div>
      </div>
    </div>
  );
}
