import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  CheckSquare,
  Target,
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIFab from "@/components/ai/ai-fab";
import MetricCard from "@/components/dashboard/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lead, Task, JobApplication, JobOpening } from "@shared/schema";

const PIPELINE_STAGES = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "closed_won", label: "Won" },
  { value: "closed_lost", label: "Lost" },
] as const;

const CANDIDATE_STAGES = [
  { value: "applied", label: "Applied" },
  { value: "1st_round", label: "1st Round" },
  { value: "2nd_round", label: "2nd Round" },
  { value: "offered", label: "Offered" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(187, 85%, 43%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Analytics() {
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
  });

  const { data: jobOpenings = [], isLoading: jobsLoading } = useQuery<JobOpening[]>({
    queryKey: ["/api/job-openings"],
  });

  const isLoading = leadsLoading || tasksLoading || candidatesLoading || jobsLoading;

  const wonLeads = leads.filter((lead) => lead.stage === "closed_won");
  const lostLeads = leads.filter((lead) => lead.stage === "closed_lost");
  const closedLeads = wonLeads.length + lostLeads.length;
  const totalRevenue = wonLeads.reduce(
    (sum, lead) => sum + (parseFloat(lead.value || "0") || 0),
    0,
  );
  const pipelineValue = leads
    .filter((lead) => !["closed_won", "closed_lost"].includes(lead.stage))
    .reduce((sum, lead) => sum + (parseFloat(lead.value || "0") || 0), 0);
  const conversionRate = closedLeads > 0 ? Math.round((wonLeads.length / closedLeads) * 100) : 0;
  const activeJobs = jobOpenings.filter((job) => job.status === "active").length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  const pipelineData = PIPELINE_STAGES.map((stage) => ({
    stage: stage.label,
    count: leads.filter((lead) => lead.stage === stage.value).length,
    value: leads
      .filter((lead) => lead.stage === stage.value)
      .reduce((sum, lead) => sum + (parseFloat(lead.value || "0") || 0), 0),
  }));

  const sourceCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const source = lead.source || "unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const sourceData = Object.entries(sourceCounts).map(([source, count]) => ({
    name: source
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    value: count,
  }));

  const recruitmentData = CANDIDATE_STAGES.map((stage) => ({
    stage: stage.label,
    count: candidates.filter((candidate) => candidate.status === stage.value).length,
  }));

  const taskData = [
    { name: "Pending", value: tasks.filter((task) => task.status === "pending").length },
    { name: "In Progress", value: tasks.filter((task) => task.status === "in_progress").length },
    { name: "Completed", value: tasks.filter((task) => task.status === "completed").length },
    { name: "Cancelled", value: tasks.filter((task) => task.status === "cancelled").length },
  ].filter((item) => item.value > 0);

  const metrics = [
    {
      title: "Won Revenue",
      value: formatCurrency(totalRevenue),
      change: `${wonLeads.length} deals won`,
      changeType: "positive" as const,
      icon: DollarSign,
      color: "success-green" as const,
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(pipelineValue),
      change: `${leads.length - closedLeads} open leads`,
      changeType: "neutral" as const,
      icon: TrendingUp,
      color: "electric-blue" as const,
    },
    {
      title: "Win Rate",
      value: `${conversionRate}%`,
      change: closedLeads > 0 ? `${wonLeads.length}/${closedLeads} closed` : "No closed deals",
      changeType: conversionRate >= 50 ? ("positive" as const) : ("neutral" as const),
      icon: Target,
      color: "tech-cyan" as const,
    },
    {
      title: "Candidates",
      value: candidates.length.toString(),
      change: `${activeJobs} active jobs`,
      changeType: "neutral" as const,
      icon: Users,
      color: "neutral-grey" as const,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto app-container py-6 space-y-6 safe-area-bottom">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sales, recruitment, and productivity insights from your live data
            </p>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {metrics.map((metric, index) => (
                  <MetricCard key={index} {...metric} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Pipeline</CardTitle>
                    <CardDescription>Leads by stage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {leads.length === 0 ? (
                      <EmptyChart message="No leads yet — add leads in Sales to see pipeline analytics." />
                    ) : (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pipelineData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                name === "count" ? value : formatCurrency(value),
                                name === "count" ? "Leads" : "Value",
                              ]}
                            />
                            <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lead Sources</CardTitle>
                    <CardDescription>Where your leads come from</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sourceData.length === 0 ? (
                      <EmptyChart message="No lead source data available yet." />
                    ) : (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sourceData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {sourceData.map((_, index) => (
                                <Cell
                                  key={`source-${index}`}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Recruitment Funnel
                    </CardTitle>
                    <CardDescription>Candidates by hiring stage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {candidates.length === 0 ? (
                      <EmptyChart message="No candidates yet — open a job and collect applications." />
                    ) : (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={recruitmentData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis
                              type="category"
                              dataKey="stage"
                              width={90}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(187, 85%, 43%)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Task Status
                    </CardTitle>
                    <CardDescription>
                      {completedTasks} completed · {pendingTasks} pending
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {taskData.length === 0 ? (
                      <EmptyChart message="No tasks yet — create tasks to track productivity." />
                    ) : (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={taskData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={90}
                              paddingAngle={2}
                            >
                              {taskData.map((_, index) => (
                                <Cell
                                  key={`task-${index}`}
                                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>

      <AIFab />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-72 flex items-center justify-center text-center px-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
