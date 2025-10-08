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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
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
            <CardContent className="p-6">
              <div className="flex items-center">
                <stat.icon className={`h-8 w-8 ${stat.iconColor || 'text-primary'}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>{tableTitle}</CardTitle>
          <CardDescription>{tableDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
