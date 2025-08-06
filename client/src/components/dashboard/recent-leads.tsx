import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users } from "lucide-react";

export default function RecentLeads() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["/api/leads"],
  });

  const recentLeads = leads?.slice(0, 5) || [];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "new":
        return "bg-gray-100 text-gray-800";
      case "qualified":
        return "bg-blue-100 text-blue-800";
      case "proposal":
        return "bg-yellow-100 text-yellow-800";
      case "negotiation":
        return "bg-orange-100 text-orange-800";
      case "closed_won":
        return "bg-green-100 text-green-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStage = (stage: string) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Link href="/crm">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentLeads.length > 0 ? (
          <div className="space-y-4">
            {recentLeads.map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {lead.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{lead.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{lead.company}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ${parseFloat(lead.value || 0).toLocaleString()}
                  </div>
                  <Badge className={getStageColor(lead.stage)}>
                    {formatStage(lead.stage)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">No leads yet</p>
            <Link href="/crm">
              <Button size="sm" className="mt-2 bg-electric-blue hover:bg-blue-600 text-white">
                Add Your First Lead
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
