import { useState } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface GradingTask {
  id: number;
  sessionId: number;
  answerId: number;
  assignedTeacherId: string;
  questionId: number;
  status: string;
  priority: number;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
}

export default function TeacherGradingQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<GradingTask | null>(null);
  const [pointsEarned, setPointsEarned] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');

  // Fetch pending grading tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/grading-tasks'],
    enabled: !!user
  });

  // Fetch answer details when a task is selected
  const { data: answerDetails, isLoading: answerLoading } = useQuery({
    queryKey: ['/api/student-answers', selectedTask?.answerId],
    enabled: !!selectedTask,
  });

  // Complete grading mutation
  const completeMutation = useMutation({
    mutationFn: async ({ taskId, points, feedback }: { taskId: number; points: number; feedback: string }) => {
      const response = await fetch(`/api/grading-tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pointsEarned: points, feedbackText: feedback }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to grade answer');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grading-tasks'] });
      toast({
        title: 'Success',
        description: 'Answer graded successfully'
      });
      setSelectedTask(null);
      setPointsEarned('');
      setFeedbackText('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grade answer',
        variant: 'destructive'
      });
    }
  });

  const handleSubmitGrade = () => {
    if (!selectedTask) return;

    const points = parseFloat(pointsEarned);
    if (isNaN(points) || points < 0) {
      toast({
        title: 'Invalid Points',
        description: 'Please enter a valid number of points',
        variant: 'destructive'
      });
      return;
    }

    completeMutation.mutate({
      taskId: selectedTask.id,
      points,
      feedback: feedbackText
    });
  };

  if (!user) {
    return <div>Please log in to access the grading queue.</div>;
  }

  const pendingTasks = (tasks as GradingTask[]).filter((t: GradingTask) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = (tasks as GradingTask[]).filter((t: GradingTask) => t.status === 'completed');

  return (
    <PortalLayout
      userRole="teacher"
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="title-grading-queue">
          Manual Grading Queue
        </h1>
        <p className="text-muted-foreground">Review and grade essay questions and written responses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card data-testid="card-pending-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">
              {pendingTasks.length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-count">
              {completedTasks.length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">
              {(tasks as GradingTask[]).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task List */}
        <Card data-testid="card-task-list">
          <CardHeader>
            <CardTitle>Pending Grading Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-center py-8" data-testid="loading-tasks">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-tasks">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending grading tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task: GradingTask, index: number) => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTask?.id === task.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTask(task)}
                    data-testid={`task-item-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium" data-testid={`text-task-id-${index}`}>
                        Task #{task.id}
                      </span>
                      <Badge
                        variant={task.status === 'in_progress' ? 'default' : 'secondary'}
                        data-testid={`badge-task-status-${index}`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div data-testid={`text-task-session-${index}`}>
                        Session ID: {task.sessionId}
                      </div>
                      <div data-testid={`text-task-question-${index}`}>
                        Question ID: {task.questionId}
                      </div>
                      {task.priority > 0 && (
                        <div className="flex items-center gap-1 text-orange-600" data-testid={`text-task-priority-${index}`}>
                          <AlertCircle className="h-3 w-3" />
                          High Priority
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grading Interface */}
        <Card data-testid="card-grading-interface">
          <CardHeader>
            <CardTitle>Grade Answer</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedTask ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="no-task-selected">
                <ClipboardCheck className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Select a task from the list to start grading</p>
              </div>
            ) : answerLoading ? (
              <div className="text-center py-12" data-testid="loading-answer">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Student Answer</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg" data-testid="text-student-answer">
                    {(answerDetails as any)?.textAnswer || 'No text answer provided'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Question Details</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg" data-testid="text-question-details">
                    Question ID: {selectedTask.questionId}
                    {(answerDetails as any)?.questionType && (
                      <div className="mt-1">Type: {(answerDetails as any).questionType}</div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="points">Points Earned *</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    step="0.5"
                    value={pointsEarned}
                    onChange={(e) => setPointsEarned(e.target.value)}
                    placeholder="Enter points (e.g., 5)"
                    data-testid="input-points"
                  />
                </div>

                <div>
                  <Label htmlFor="feedback">Feedback (Optional)</Label>
                  <Textarea
                    id="feedback"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={4}
                    data-testid="textarea-feedback"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitGrade}
                    disabled={completeMutation.isPending || !pointsEarned}
                    className="flex-1"
                    data-testid="button-submit-grade"
                  >
                    {completeMutation.isPending ? 'Submitting...' : 'Submit Grade'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTask(null);
                      setPointsEarned('');
                      setFeedbackText('');
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card className="mt-6" data-testid="card-completed-tasks">
          <CardHeader>
            <CardTitle>Recently Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map((task: GradingTask, index: number) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
                  data-testid={`completed-task-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium" data-testid={`text-completed-task-${index}`}>
                      Task #{task.id} - Session {task.sessionId}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid={`text-completed-time-${index}`}>
                    {task.completedAt && new Date(task.completedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PortalLayout>
  );
}
