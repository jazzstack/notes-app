import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
