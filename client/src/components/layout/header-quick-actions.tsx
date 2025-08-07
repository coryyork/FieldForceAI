import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, User, Upload, Calendar } from "lucide-react";
import LeadForm from "@/components/crm/lead-form";
import DocumentUpload from "@/components/knowledge-base/document-upload";

export default function HeaderQuickActions() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const actions = [
    {
      title: "Add New Lead",
      description: "Create a new lead entry",
      icon: User,
      onClick: () => setIsNewLeadOpen(true),
    },
    {
      title: "Upload Document",
      description: "Add to knowledge base",
      icon: Upload,
      onClick: () => setIsUploadDocOpen(true),
    },
    {
      title: "Create Task",
      description: "Add new todo item",
      icon: Calendar,
      onClick: () => setIsNewTaskOpen(true),
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-3 rounded-xl touch-target hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                className="flex items-center space-x-3 p-3 cursor-pointer"
              >
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {action.description}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

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