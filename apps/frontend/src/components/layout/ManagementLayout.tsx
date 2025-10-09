// @ts-ignore
import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { LucideIcon } from 'lucide-react';

export interface StatCard {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
}

export interface ActionButton {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export interface ManagementLayoutProps {
  title: string;
  description: string;
  stats: StatCard[];
  actions: ActionButton[];
  tableTitle: string;
  tableDescription: string;
  children: ReactNode; // This will be the DataTable component
}

export function ManagementLayout({
  title,
  description,
  stats,
  actions,
  tableTitle,
  tableDescription,
  children,
}: ManagementLayoutProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="flex items-center gap-2"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${stats.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="text-center pt-3 pb-3">
              <div className="flex flex-col items-center space-y-2">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.iconColor || 'bg-gradient-to-br from-[#14A76C] to-[#0f8a5f]'}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor ? 'text-white' : 'text-white'}`} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 truncate w-full">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Table */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle>{tableTitle}</CardTitle>
          <CardDescription>{tableDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4">
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
