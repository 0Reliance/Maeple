import { memo } from "react";

import { LucideIcon } from "lucide-react";

const COLOR_STYLES: Record<string, { bg: string; text: string; gradient: string }> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-400 to-blue-500",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/50",
    text: "text-pink-600 dark:text-pink-400",
    gradient: "from-pink-400 to-pink-500",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/50",
    text: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-400 to-purple-500",
  },
  cyan: {
    bg: "bg-cyan-100 dark:bg-cyan-900/50",
    text: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-400 to-cyan-500",
  },
};

interface CapacitySliderProps {
  label: string;
  icon: LucideIcon;
  value: number;
  color: string;
  suggested?: number;
  informedBy?: string | null;
  onValueChange: (value: number) => void;
}

const CapacitySlider = memo(function CapacitySlider({
  label,
  icon: Icon,
  value,
  color,
  suggested,
  informedBy,
  onValueChange,
}: CapacitySliderProps) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.blue;
  const isSuggested = suggested !== undefined && value === suggested;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${styles.bg} ${styles.text}`}>
            <Icon size={14} />
          </div>
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {isSuggested && <span className="text-xs text-primary font-medium">(Suggested)</span>}
        </div>
        <span className="text-sm font-bold text-text-primary">{value}/10</span>
      </div>

      {informedBy && (
        <div className="mb-2 text-xs text-primary flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
          <span>💡</span>
          <span>{informedBy}</span>
        </div>
      )}

      <div className="relative h-3 bg-bg-secondary rounded-full overflow-hidden cursor-pointer group">
        <div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${styles.gradient} rounded-full transition-all duration-300`}
          style={{ width: `${value * 10}%` }}
        ></div>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={e => {
            const parsed = Number(e.target.value);
            if (!Number.isNaN(parsed)) {
              onValueChange(parsed);
            }
          }}
          aria-label={label}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={value}
          aria-valuetext={`${value} out of 10`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
});

export default CapacitySlider;
