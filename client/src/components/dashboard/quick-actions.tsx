import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { UserPlus, FileUp, Plus } from "lucide-react";
import LeadForm from "@/components/crm/lead-form";
import DocumentUpload from "@/components/knowledge-base/document-upload";
// import TaskForm from "@/components/tasks/task-form";

export default function QuickActions() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const actions = [
    {
      title: "Add New Lead",
      description: "Create a new lead entry",
      icon: UserPlus,
      color: "bg-blue-100 text-blue-600",
      onClick: () => setIsNewLeadOpen(true),
    },
    {
      title: "Upload Document",
      description: "Add to knowledge base",
      icon: FileUp,
      color: "bg-green-100 text-green-600",
      onClick: () => setIsUploadDocOpen(true),
    },
    {
      title: "Create Task",
      description: "Add new todo item",
      icon: Plus,
      color: "bg-cyan-100 text-cyan-600",
      onClick: () => setIsNewTaskOpen(true),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={action.onClick}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <LeadForm onSuccess={() => setIsNewLeadOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <DocumentUpload onSuccess={() => setIsUploadDocOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSuccess={() => setIsNewTaskOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Simple TaskForm component for the quick actions
function TaskForm({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Task management will be available in the next update.
      </p>
      <Button onClick={onSuccess} variant="outline">
        Close
      </Button>
    </div>
  );
}
