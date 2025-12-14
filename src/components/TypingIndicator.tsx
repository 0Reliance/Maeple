import React from "react";

interface Props {
  className?: string;
  color?: string;
}

const TypingIndicator: React.FC<Props> = ({
  className = "",
  color = "bg-slate-400 dark:bg-slate-500",
}) => {
  return (
    <div
      className={`flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit ${className}`}
      role="status"
      aria-label="AI is typing"
    >
      <div
        className={`w-2 h-2 ${color} rounded-full animate-bounce`}
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className={`w-2 h-2 ${color} rounded-full animate-bounce`}
        style={{ animationDelay: "150ms" }}
      ></div>
      <div
        className={`w-2 h-2 ${color} rounded-full animate-bounce`}
        style={{ animationDelay: "300ms" }}
      ></div>
    </div>
  );
};

export default TypingIndicator;
