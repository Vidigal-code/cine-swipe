import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
}

export function Button({
    children,
    isLoading,
    variant = 'primary',
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = "w-full py-3 px-4 font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-card text-card-foreground hover:bg-card/90",
        outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            {children}
        </button>
    );
}
