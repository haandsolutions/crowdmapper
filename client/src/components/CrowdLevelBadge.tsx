import { getCrowdLevelLabel, getCrowdLevelColor } from "@/lib/crowd-utils";

interface CrowdLevelBadgeProps {
  level: number;
  className?: string;
  size?: "small" | "medium" | "large";
}

export default function CrowdLevelBadge({ level, className = "", size = "medium" }: CrowdLevelBadgeProps) {
  const crowdColor = getCrowdLevelColor(level);
  const crowdLabel = getCrowdLevelLabel(level);
  
  const sizeClasses = {
    small: "px-2 py-1 text-xs",
    medium: "px-3 py-1 text-sm",
    large: "px-4 py-2 text-base"
  };
  
  return (
    <div className={`flex items-center ${crowdColor.lightBg} ${crowdColor.lightText} rounded-full font-medium ${sizeClasses[size]} ${className}`}>
      <span className={`w-2 h-2 ${crowdColor.bg} rounded-full mr-1`}></span>
      <span>{crowdLabel} Crowd</span>
    </div>
  );
}
