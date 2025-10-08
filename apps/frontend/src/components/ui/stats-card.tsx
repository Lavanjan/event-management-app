import * as React from 'react';
import { cn } from '../../utils/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: 'teal' | 'blue' | 'purple' | 'orange' | 'green';
}

const colorVariants = {
  teal: {
    bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
    icon: 'text-teal-100',
    text: 'text-white',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    icon: 'text-blue-100',
    text: 'text-white',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    icon: 'text-purple-100',
    text: 'text-white',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    icon: 'text-orange-100',
    text: 'text-white',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    icon: 'text-emerald-100',
    text: 'text-white',
  },
};

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className, 
  color = 'teal' 
}: StatsCardProps) {
  const colorClasses = colorVariants[color];

  return (
    <div
      className={cn(
        'rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200',
        colorClasses.bg,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium opacity-90', colorClasses.text)}>
            {title}
          </p>
          <p className={cn('text-3xl font-bold mt-2', colorClasses.text)}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  trend.isPositive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/20 text-white'
                )}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('text-4xl opacity-80', colorClasses.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// White variant for different styling
export function StatsCardWhite({ 
  title, 
  value, 
  icon, 
  trend, 
  className,
  iconColor = 'text-teal-600'
}: StatsCardProps & { iconColor?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  trend.isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('text-4xl', iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
