import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TeamManagement from "@/components/team/team-management";

export default function TeamPage() {
  const { user } = useAuth();

  // Only allow admin/owner users to access this page
  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.role !== 'admin' && user.role !== 'owner') {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Invite and manage team members in your organization
              </p>
            </div>
            <TeamManagement />
          </div>
        </main>
      </div>
    </div>
  );
}