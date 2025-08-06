import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, File, FileImage } from "lucide-react";

export default function KnowledgeBasePreview() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const recentDocuments = documents?.slice(0, 4) || [];

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return FileImage;
    if (fileType?.includes('pdf')) return FileText;
    return File;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      const weeks = Math.floor(diffInHours / 168);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Knowledge Base</CardTitle>
          <Link href="/knowledge-base">
            <Button variant="outline" size="sm">
              Browse All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                <div className="rounded-lg bg-gray-200 h-8 w-8"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentDocuments.length > 0 ? (
          <div className="space-y-3">
            {recentDocuments.map((document: any) => {
              const FileIcon = getFileIcon(document.fileType);
              return (
                <div
                  key={document.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {document.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Updated {formatTimeAgo(document.updatedAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <File className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              No documents yet
            </p>
            <Link href="/knowledge-base">
              <Button size="sm" className="bg-electric-blue hover:bg-blue-600 text-white">
                Upload Your First Document
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
