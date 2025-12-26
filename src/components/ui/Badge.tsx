import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'positive' | 'attention' | 'alert' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const baseStyles = 'badge inline-flex items-center';
  
  const variantStyles = {
    positive: 'badge-positive',
    attention: 'badge-attention',
    alert: 'badge-alert',
    neutral: 'bg-bg-secondary text-text-secondary',
  };
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-micro',
    md: 'px-3 py-1 text-label',
  };
  
  return (
    <span className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
};
