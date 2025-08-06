import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { Link } from "wouter";

export default function AIAssistantBanner() {
  const quickQueries = [
    "Show me hot leads from this month",
    "What are our top performing campaigns?",
    "Find documents about pricing strategy",
  ];

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 overflow-hidden">
      <div className="p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">AI Assistant Ready</h2>
            <p className="text-blue-100 mb-4 max-w-2xl">
              Search across your CRM data, knowledge base, and business metrics with natural language.
            </p>
            <div className="flex flex-wrap gap-2">
              {quickQueries.map((query, index) => (
                <Link key={index} href="/ai-assistant">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 text-sm font-medium transition-colors"
                  >
                    "{query}"
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          <div className="ml-6 hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
