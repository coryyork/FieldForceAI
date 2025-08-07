import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, UserCheck, Users, FileCheck, CheckCircle, XCircle } from "lucide-react";

export type CandidateStage = "applied" | "1st_round" | "2nd_round" | "offered" | "accepted" | "rejected";

interface StageSelectorProps {
  stage: CandidateStage;
  onStageChange: (newStage: CandidateStage) => void;
  disabled?: boolean;
}

const stageConfig = {
  applied: {
    label: "Applied",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Clock,
  },
  "1st_round": {
    label: "1st Round Interview",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    icon: UserCheck,
  },
  "2nd_round": {
    label: "2nd Round Interview", 
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: Users,
  },
  offered: {
    label: "Offered",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    icon: FileCheck,
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: XCircle,
  },
};

export function StageSelector({ stage, onStageChange, disabled = false }: StageSelectorProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <Badge className={`${config.color} border-0 flex items-center gap-1.5 px-3 py-1`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </Badge>
      
      {!disabled && (
        <Select value={stage} onValueChange={onStageChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(stageConfig).map(([key, config]) => {
              const StageIcon = config.icon;
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <StageIcon className="w-4 h-4" />
                    {config.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function StageBadge({ stage }: { stage: CandidateStage }) {
  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} border-0 flex items-center gap-1.5`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
}