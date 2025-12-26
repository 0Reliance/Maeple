import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const errorStyles = error ? 'border-accent-alert focus:border-accent-alert' : '';
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-small font-semibold text-text-primary mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            'input',
            leftIcon && 'pl-12',
            rightIcon && 'pr-12',
            errorStyles,
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-small text-accent-alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-2 text-small text-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const errorStyles = error ? 'border-accent-alert focus:border-accent-alert' : '';
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-small font-semibold text-text-primary mb-2"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          'input resize-none',
          errorStyles,
          className
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
        }
        {...props}
      />
      
      {error && (
        <p id={`${textareaId}-error`} className="mt-2 text-small text-accent-alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={`${textareaId}-helper`} className="mt-2 text-small text-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
};
