import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Trophy, Play, Eye, CheckCircle, XCircle, Timer } from 'lucide-react';
import type { Exam, ExamSession, ExamQuestion, QuestionOption, StudentAnswer } from '@shared/schema';

export default function StudentExams() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available exams
  const { data: exams = [], isLoading: loadingExams } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
    enabled: !!user,
  });

  // Fetch exam questions for active session
  const { data: examQuestions = [], isLoading: loadingQuestions } = useQuery<ExamQuestion[]>({
    queryKey: ['/api/exam-questions', activeSession?.examId],
    enabled: !!activeSession?.examId,
  });

  // Fetch question options for current question
  const currentQuestion = examQuestions[currentQuestionIndex];
  const { data: questionOptions = [] } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options', currentQuestion?.id],
    enabled: !!currentQuestion?.id && currentQuestion?.questionType === 'multiple_choice',
  });

  // Fetch existing answers for active session
  const { data: existingAnswers = [] } = useQuery<StudentAnswer[]>({
    queryKey: ['/api/student-answers/session', activeSession?.id],
    enabled: !!activeSession?.id,
  });

  // Load existing answers into state
  useEffect(() => {
    if (existingAnswers.length > 0) {
      const answerMap: Record<number, any> = {};
      existingAnswers.forEach(answer => {
        if (answer.selectedOptionId) {
          answerMap[answer.questionId] = answer.selectedOptionId;
        } else if (answer.textAnswer) {
          answerMap[answer.questionId] = answer.textAnswer;
        }
      });
      setAnswers(answerMap);
    }
  }, [existingAnswers]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && activeSession && !activeSession.isCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Auto-submit when time runs out
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, activeSession]);

  // Start exam mutation
  const startExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiRequest('POST', '/api/exam-sessions', {
        examId,
        studentId: user?.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start exam');
      }
      return response.json();
    },
    onSuccess: (session: ExamSession) => {
      setActiveSession(session);
      setCurrentQuestionIndex(0);
      // Set timer if exam has time limit
      const exam = exams.find(e => e.id === session.examId);
      if (exam?.timeLimit) {
        setTimeRemaining(exam.timeLimit * 60); // Convert minutes to seconds
      }
      toast({
        title: "Exam Started",
        description: "Good luck with your exam!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: any }) => {
      const answerData = currentQuestion?.questionType === 'multiple_choice'
        ? { sessionId: activeSession!.id, questionId, selectedOptionId: answer }
        : { sessionId: activeSession!.id, questionId, textAnswer: answer };

      const response = await apiRequest('POST', '/api/student-answers', answerData);
      if (!response.ok) throw new Error('Failed to submit answer');
      return response.json();
    },
  });

  // Submit exam mutation
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error('No active session');
      
      const response = await apiRequest('PUT', `/api/exam-sessions/${activeSession.id}`, {
        isCompleted: true,
        submittedAt: new Date(),
        status: 'submitted',
      });
      if (!response.ok) throw new Error('Failed to submit exam');
      return response.json();
    },
    onSuccess: () => {
      setActiveSession(null);
      setAnswers({});
      setTimeRemaining(null);
      setCurrentQuestionIndex(0);
      queryClient.invalidateQueries({ queryKey: ['/api/exam-sessions'] });
      toast({
        title: "Exam Submitted",
        description: "Your exam has been submitted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam);
    startExamMutation.mutate(exam.id);
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    submitAnswerMutation.mutate({ questionId, answer });
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      await submitExamMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = examQuestions.length > 0 ? ((currentQuestionIndex + 1) / examQuestions.length) * 100 : 0;

  if (!user) {
    return <div>Please log in to access the exam portal.</div>;
  }

  // Map roleId to role name
  const getRoleName = (roleId: number): 'admin' | 'teacher' | 'parent' | 'student' => {
    const roleMap: { [key: number]: 'admin' | 'teacher' | 'parent' | 'student' } = {
      1: 'admin',
      2: 'teacher', 
      3: 'parent',
      4: 'student'
    };
    return roleMap[roleId] || 'student';
  };

  return (
    <PortalLayout
      userRole={getRoleName(user.roleId)}
      userName={user.firstName + ' ' + user.lastName}
      userInitials={user.firstName.charAt(0) + user.lastName.charAt(0)}
    >
      {/* Active Exam Interface */}
      {activeSession && examQuestions.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Exam Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedExam?.name}</CardTitle>
                  <p className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {examQuestions.length}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {timeRemaining !== null && (
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4" />
                      <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                    data-testid="button-submit-exam"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="w-full" />
            </CardHeader>
          </Card>

          {/* Current Question */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {currentQuestionIndex + 1}
                  <Badge variant="outline" className="ml-2">
                    {currentQuestion.points} points
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base leading-relaxed" data-testid="question-text">
                  {currentQuestion.questionText}
                </p>

                {/* Multiple Choice */}
                {currentQuestion.questionType === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                    data-testid="question-options"
                  >
                    {questionOptions.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.id.toString()}
                          id={`option-${option.id}`}
                          data-testid={`option-${index}`}
                        />
                        <Label
                          htmlFor={`option-${option.id}`}
                          className="text-base cursor-pointer flex-1"
                        >
                          {option.optionText}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Text/Essay Questions */}
                {(currentQuestion.questionType === 'text' || currentQuestion.questionType === 'essay') && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    rows={currentQuestion.questionType === 'essay' ? 8 : 4}
                    data-testid="text-answer"
                  />
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(examQuestions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === examQuestions.length - 1}
                    data-testid="button-next"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {examQuestions.map((question, index) => (
                  <Button
                    key={question.id}
                    variant={currentQuestionIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className="h-8 w-8 p-0"
                    data-testid={`question-nav-${index}`}
                  >
                    {answers[question.id] ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Exam List */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Exams</h1>
              <p className="text-muted-foreground">View available exams and take tests</p>
            </div>
          </div>

          {/* Available Exams */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingExams ? (
              <div className="col-span-full text-center py-8">Loading exams...</div>
            ) : exams.filter(exam => exam.isPublished).length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No exams available at the moment.
              </div>
            ) : (
              exams
                .filter(exam => exam.isPublished)
                .map((exam) => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow" data-testid={`exam-card-${exam.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{exam.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(exam.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={exam.isPublished ? 'default' : 'secondary'}>
                          {exam.isPublished ? 'Available' : 'Draft'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4" />
                          <span>{exam.totalMarks} marks</span>
                        </div>
                        {exam.timeLimit && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{exam.timeLimit} min</span>
                          </div>
                        )}
                      </div>

                      {exam.instructions && (
                        <p className="text-sm text-muted-foreground">
                          {exam.instructions}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleStartExam(exam)}
                          disabled={startExamMutation.isPending}
                          className="flex-1"
                          data-testid={`button-start-exam-${exam.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {startExamMutation.isPending ? 'Starting...' : 'Start Exam'}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          data-testid={`button-view-exam-${exam.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}