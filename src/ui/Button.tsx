import React from 'react'

type ButtonVariant = 'red500' |'red900' | 'green900' | 'blue900'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  red500: "bg-red-500 hover:bg-red-500/60 text-white",
  red900: "bg-red-900 hover:bg-red-900/60 text-white",
  green900: "bg-green-900 hover:bg-green-900/60 text-white",
  blue900: "bg-blue-900 hover:bg-blue-900/60 text-white",
}

export default function Button({ variant = 'blue900', children, className = '', ...props }: ButtonProps) {
  const baseClasses =
    "w-full px-1 py-2 rounded font-medium cursor-pointer"

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
