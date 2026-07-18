import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Calendar, Mail, Edit, Trash2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import VoiceCommentButton from "@/components/shared/voice-comment-button";

interface Note {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface NotesTimelineProps {
  leadId: string;
}

export default function NotesTimeline({ leadId }: NotesTimelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ content: "", type: "note" });
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const { data: notes = [], isLoading, error } = useQuery<Note[]>({
    queryKey: ["/api/leads", leadId, "notes"],
    queryFn: () => apiRequest(`/api/leads/${leadId}/notes`),
    enabled: !!leadId,
    retry: false,
  });

  // Handle error state
  if (error && isUnauthorizedError(error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { content: string; type: string }) => {
      return await apiRequest(`/api/leads/${leadId}/notes`, {
        method: "POST",
        body: noteData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setNewNote({ content: "", type: "note" });
      setIsAddingNote(false);
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, updates }: { noteId: string; updates: { content: string; type: string } }) => {
      return await apiRequest(`/api/leads/${leadId}/notes/${noteId}`, {
        method: "PUT",
        body: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "notes"] });
      setEditingNote(null);
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return await apiRequest(`/api/leads/${leadId}/notes/${noteId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "notes"] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  const getNoteIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="w-4 h-4" />;
      case "meeting": return <Calendar className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "call": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "meeting": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "email": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const appendVoiceTranscript = (text: string) => {
    setNewNote((current) => ({
      ...current,
      content: current.content ? `${current.content} ${text}` : text,
    }));
  };

  const handleVoiceError = (message: string) => {
    toast({
      title: "Voice comment failed",
      description: message,
      variant: "destructive",
    });
  };

  const handleAddNote = () => {
    if (!newNote.content.trim()) return;
    createNoteMutation.mutate(newNote);
  };

  const handleUpdateNote = (noteId: string, content: string, type: string) => {
    updateNoteMutation.mutate({ noteId, updates: { content, type } });
  };

  const getUserName = (user: Note['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Notes & Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Notes & Timeline
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddingNote(true)}
            className="bg-electric-blue hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note form */}
        {isAddingNote && (
          <Card className="border-2 border-electric-blue">
            <CardContent className="pt-4 space-y-4">
              <Select
                value={newNote.type}
                onValueChange={(value) => setNewNote({ ...newNote, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-start gap-2">
                <Textarea
                  placeholder="Add your note here... Hold the mic to talk."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={3}
                  className="flex-1"
                />
                <VoiceCommentButton
                  onTranscript={appendVoiceTranscript}
                  onError={handleVoiceError}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote({ content: "", type: "note" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.content.trim() || createNoteMutation.isPending}
                  className="bg-electric-blue hover:bg-blue-600 text-white"
                >
                  {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {!Array.isArray(notes) || notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notes yet. Add the first note to start the timeline.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-electric-blue text-white flex items-center justify-center">
                    {getNoteIcon(note.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getNoteTypeColor(note.type)}>
                            {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getUserName(note.user)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingNote(note.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            disabled={deleteNoteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {editingNote === note.id ? (
                        <EditNoteForm
                          note={note}
                          onSave={handleUpdateNote}
                          onCancel={() => setEditingNote(null)}
                          isUpdating={updateNoteMutation.isPending}
                        />
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface EditNoteFormProps {
  note: Note;
  onSave: (noteId: string, content: string, type: string) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

function EditNoteForm({ note, onSave, onCancel, isUpdating }: EditNoteFormProps) {
  const [content, setContent] = useState(note.content);
  const [type, setType] = useState(note.type);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(note.id, content, type);
  };

  return (
    <div className="space-y-4">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="note">Note</SelectItem>
          <SelectItem value="call">Call</SelectItem>
          <SelectItem value="meeting">Meeting</SelectItem>
          <SelectItem value="email">Email</SelectItem>
        </SelectContent>
      </Select>
      
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!content.trim() || isUpdating}
          className="bg-electric-blue hover:bg-blue-600 text-white"
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );
}