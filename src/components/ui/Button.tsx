import { Loader2 } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  magnetic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  magnetic = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'btn';
  
  // Variant styles
  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    ghost: 'bg-transparent text-text-primary hover:bg-bg-secondary',
  };
  
  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-small',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-large',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  const magneticStyles = magnetic ? 'btn-magnetic' : '';
  const disabledStyles = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        magneticStyles,
        disabledStyles,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin mr-2" size={size === 'sm' ? 14 : 18} />}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};