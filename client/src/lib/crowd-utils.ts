import { CrowdLevel } from "./types";
import { format, formatDistanceToNow } from "date-fns";

export const crowdLevelColors = {
  low: {
    bg: "bg-crowd-low",
    text: "text-crowd-low",
    hoverBg: "hover:bg-green-200",
    border: "border-crowd-low",
    lightBg: "bg-green-100",
    lightText: "text-green-700",
  },
  medium: {
    bg: "bg-crowd-medium",
    text: "text-crowd-medium",
    hoverBg: "hover:bg-amber-200",
    border: "border-crowd-medium",
    lightBg: "bg-amber-100",
    lightText: "text-amber-700",
  },
  high: {
    bg: "bg-crowd-high",
    text: "text-crowd-high",
    hoverBg: "hover:bg-red-200",
    border: "border-crowd-high",
    lightBg: "bg-red-100",
    lightText: "text-red-700",
  },
};

export const getCrowdLevelLabel = (level: number): string => {
  switch (level) {
    case 1:
      return "Low";
    case 2:
      return "Medium";
    case 3:
      return "High";
    default:
      return "Unknown";
  }
};

export const getCrowdLevelColor = (level: number) => {
  switch (level) {
    case 1:
      return crowdLevelColors.low;
    case 2:
      return crowdLevelColors.medium;
    case 3:
      return crowdLevelColors.high;
    default:
      return crowdLevelColors.low;
  }
};

export const formatTimestamp = (timestamp: string | Date): string => {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "Unknown time";
  }
};

export const formatChartTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  
  try {
    return format(date, "h aaa");
  } catch (error) {
    return "Unknown";
  }
};

export const prepareCrowdHistoryData = (crowdHistory: CrowdLevel[]) => {
  // Sort by timestamp ascending
  const sortedHistory = [...crowdHistory].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sortedHistory.map(record => ({
    time: formatChartTime(record.timestamp),
    percentage: record.percentage,
    level: record.level,
  }));
};
