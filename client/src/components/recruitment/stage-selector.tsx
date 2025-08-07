import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, UserCheck, Users, FileCheck, CheckCircle, XCircle } from "lucide-react";

export type CandidateStage = "applied" | "1st_round" | "2nd_round" | "offered" | "accepted" | "rejected";



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

interface StageSelectorProps {
  stage: CandidateStage | string;
  onStageChange: (newStage: CandidateStage) => void;
  disabled?: boolean;
}

export function StageSelector({ stage, onStageChange, disabled = false }: StageSelectorProps) {
  // Map legacy stages to new stages
  const mappedStage = legacyStageMapping[stage] || stage as CandidateStage;
  const config = stageConfig[mappedStage] || stageConfig.applied;
  const Icon = config?.icon || Clock;

  return (
    <div className="flex items-center gap-3">
      <Badge className={`${config.color} border-0 flex items-center gap-1.5 px-3 py-1`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </Badge>
      
      {!disabled && (
        <Select value={mappedStage} onValueChange={onStageChange}>
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

// Legacy stage mapping for backward compatibility
const legacyStageMapping: Record<string, CandidateStage> = {
  "submitted": "applied",
  "reviewing": "1st_round", 
  "interviewed": "2nd_round",
  "hired": "accepted",
  "rejected": "rejected"
};

export function StageBadge({ stage }: { stage: CandidateStage | string }) {
  // Map legacy stages to new stages
  const mappedStage = legacyStageMapping[stage] || stage as CandidateStage;
  const config = stageConfig[mappedStage] || stageConfig.applied; // fallback to applied if unknown stage
  const Icon = config?.icon || Clock;

  return (
    <Badge className={`${config.color} border-0 flex items-center gap-1.5`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
}