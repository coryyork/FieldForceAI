import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle, Circle, Clock, Plus, Send } from "lucide-react";
import type { Task } from "@shared/schema";

interface LeadTasksProps {
  leadId: string;
}

export default function LeadTasks({ leadId }: LeadTasksProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/leads", leadId, "tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string; dueDate?: string }) => {
      return apiRequest(`/api/leads/${leadId}/tasks`, {
        method: "POST",
        body: {
          title: taskData.title,
          description: "",
          status: "pending",
          priority: "medium",
          dueDate: taskData.dueDate || undefined,
          leadId,
          assignedTo: user?.id, // Auto-assign to current user
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTaskText("");
      setDueDate("");
      toast({
        title: "Task Created",
        description: "Task has been added and assigned to you.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<TaskFormData> }) => {
      return apiRequest(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task Updated",
        description: "Task status has been updated.",
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTaskText.trim()) return;
    
    createTaskMutation.mutate({
      title: newTaskText.trim(),
      dueDate: dueDate || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateTask();
    }
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({
      taskId: task.id,
      data: { status: newStatus },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "cancelled":
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Calendar className="w-5 h-5 mr-2" />
          Tasks {tasks.length > 0 && `(${tasks.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Add Task - Always visible */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Add a quick task for this lead..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 min-h-[40px] max-h-[80px] resize-none text-sm"
              rows={1}
            />
            <Button
              onClick={handleCreateTask}
              disabled={!newTaskText.trim() || createTaskMutation.isPending}
              size="sm"
              className="px-3 h-10 bg-electric-blue hover:bg-blue-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Due:</span>
            </div>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-auto text-sm"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Auto-assigned to you
            </div>
          </div>
        </div>

        {/* Existing Tasks */}
        {tasks.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className="mt-0.5 hover:scale-110 transition-transform"
                >
                  {getStatusIcon(task.status)}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className={`font-medium text-sm leading-5 ${
                      task.status === "completed" 
                        ? "line-through text-gray-500" 
                        : "text-gray-900 dark:text-white"
                    }`}>
                      {task.title}
                    </h4>
                    {task.priority !== "medium" && (
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center space-x-3">
                      {task.dueDate && (
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                      <span>Assigned to you</span>
                    </div>
                    <span>
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}