import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`
      bg-white dark:bg-dark-card 
      rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800
      transition-all duration-300 hover:shadow-md
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;