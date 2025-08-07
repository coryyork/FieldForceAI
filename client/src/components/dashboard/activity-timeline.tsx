import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Activity } from "lucide-react";

export default function ActivityTimeline() {
  const { user } = useAuth();
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });

  const getActivityColor = (type: string) => {
    switch (type) {
      case "lead_created":
        return "bg-blue-500";
      case "lead_updated":
        return "bg-blue-400";
      case "task_created":
        return "bg-cyan-500";
      case "task_completed":
        return "bg-green-500";
      case "document_uploaded":
        return "bg-purple-500";
      default:
        return "bg-gray-400";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start space-x-4">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.type)}`}></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimeAgo(activity.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No recent activity
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
              Activity will appear here as you use the platform
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
