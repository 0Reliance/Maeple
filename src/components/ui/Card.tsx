import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  clickable = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'card';
  const hoverStyles = hoverable ? 'card-hoverable' : '';
  const cursorStyles = clickable ? 'cursor-pointer' : '';
  
  return (
    <div
      className={cn(baseStyles, hoverStyles, cursorStyles, className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn('mb-4', className)}>{children}</div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={cn('font-display font-semibold text-h3 text-text-primary', className)}>
    {children}
  </h3>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => (
  <p className={cn('font-body text-small text-text-secondary mt-1', className)}>
    {children}
  </p>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn('mt-4 flex items-center', className)}>{children}</div>
);
