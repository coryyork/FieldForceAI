import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Zap,
  Users,
  Brain,
  FileText,
  BarChart,
  CheckCircle,
  Mic,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    color: "blue",
    title: "Voice-Enabled AI Assistant",
    description:
      "Talk to your business. Ask questions in plain language — by voice or text — and get answers from your own data in seconds.",
  },
  {
    icon: Users,
    color: "cyan",
    title: "CRM & Sales Pipeline",
    description:
      "Track every lead from first touch to close. Stages, values, notes, and tasks stay attached to the deal — not scattered across tools.",
  },
  {
    icon: CheckCircle,
    color: "green",
    title: "Recruitment Pipeline",
    description:
      "Post openings, collect applications, and move candidates through six tracked stages — with interview scheduling built in.",
  },
  {
    icon: FileText,
    color: "purple",
    title: "Knowledge Base",
    description:
      "Your company’s documents become searchable answers. Store, tag, and query everything your team knows.",
  },
  {
    icon: BarChart,
    color: "indigo",
    title: "Analytics & Insights",
    description:
      "Real-time metrics across sales, hiring, and team activity — plus AI-generated summaries of what changed and why it matters.",
  },
  {
    icon: ShieldCheck,
    color: "orange",
    title: "Secure by Design",
    description:
      "Multi-tenant architecture keeps every company’s data fully isolated. Invite-only access with role-based permissions.",
  },
];

const colorStyles: Record<string, { ring: string; bg: string; text: string }> = {
  blue: { ring: "hover:border-blue-200", bg: "bg-blue-100", text: "text-blue-600" },
  cyan: { ring: "hover:border-cyan-200", bg: "bg-cyan-100", text: "text-cyan-600" },
  green: { ring: "hover:border-green-200", bg: "bg-green-100", text: "text-green-600" },
  purple: { ring: "hover:border-purple-200", bg: "bg-purple-100", text: "text-purple-600" },
  indigo: { ring: "hover:border-indigo-200", bg: "bg-indigo-100", text: "text-indigo-600" },
  orange: { ring: "hover:border-orange-200", bg: "bg-orange-100", text: "text-orange-600" },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 bg-electric-blue rounded-lg flex items-center justify-center electric-blue-glow"
              aria-hidden="true"
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">
              FIELD ARMY
            </div>
          </div>
          <Link href="/auth">
            <Button className="bg-electric-blue hover:bg-blue-600 text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center" aria-labelledby="hero-heading">
          <div className="max-w-4xl mx-auto">
            <h1
              id="hero-heading"
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Run your whole business from{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                one workspace
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Field Army unifies your CRM, recruitment pipeline, and company
              knowledge — then puts a voice-enabled AI assistant on top of all
              of it. Sell, hire, and deliver without switching tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button
                  size="lg"
                  className="bg-electric-blue hover:bg-blue-600 text-white px-8 py-4 text-lg"
                >
                  Sign In to Your Workspace
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-2"
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See What It Does
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              Field Army is invite-only — ask your administrator for an invitation.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20" aria-labelledby="features-heading">
          <div className="text-center mb-16">
            <h2
              id="features-heading"
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Everything your team needs, in one place
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Built for companies that sell, hire, and share knowledge every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, color, title, description }) => {
              const styles = colorStyles[color];
              return (
                <Card key={title} className={`border-2 ${styles.ring} transition-colors`}>
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 ${styles.bg} rounded-full flex items-center justify-center mx-auto mb-6`}
                      aria-hidden="true"
                    >
                      <Icon className={`w-8 h-8 ${styles.text}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20" aria-labelledby="cta-heading">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-12 text-center text-white">
            <h2 id="cta-heading" className="text-4xl font-bold mb-4">
              Your business, answered
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Stop digging through spreadsheets, inboxes, and folders. Ask Field
              Force — and get back to work.
            </p>
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Sign In to Get Started
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Field Army. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
