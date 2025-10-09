import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Package, Crown, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '../../utils/cn';

export interface PackageCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  features: string[];
  isActive?: boolean;
  isCurrent?: boolean;
  isPopular?: boolean;
  color?: string;
  icon?: React.ReactNode;
  onAction?: (packageId: string) => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  className?: string;
  variant?: 'default' | 'current' | 'popular';
  compact?: boolean;
  maxVisibleFeatures?: number;
}

const variantStyles = {
  default: {
    card: 'hover:shadow-xl transition-all duration-300 border-gray-200 bg-white rounded-3xl',
    header: 'text-gray-900',
    price: 'text-[#14A76C]',
    badge: 'bg-gray-100 text-gray-800',
  },
  current: {
    card: 'border-2 border-[#14A76C] bg-gradient-to-br from-[#14A76C]/5 to-[#14A76C]/10 shadow-xl rounded-3xl',
    header: 'text-[#14A76C]',
    price: 'text-[#14A76C]',
    badge: 'bg-[#14A76C] text-white',
  },
  popular: {
    card: 'border-2 border-[#14A76C] bg-gradient-to-br from-[#14A76C]/10 to-[#14A76C]/5 shadow-xl rounded-3xl relative',
    header: 'text-[#14A76C]',
    price: 'text-[#14A76C]',
    badge: 'bg-[#14A76C] text-white',
  },
};

export function PackageCard({
  id,
  name,
  description,
  price,
  currency = 'USD',
  billingCycle,
  features,
  isActive = true,
  isCurrent = false,
  isPopular = false,
  icon,
  onAction,
  actionLabel = 'Select Package',
  actionDisabled = false,
  actionLoading = false,
  className,
  variant = 'default',
  compact = false,
  maxVisibleFeatures = 3,
}: PackageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine variant based on props
  const cardVariant = isCurrent ? 'current' : isPopular ? 'popular' : variant;
  const styles = variantStyles[cardVariant];

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const displayFeatures = isExpanded ? features : features.slice(0, maxVisibleFeatures);
  const hasMoreFeatures = features.length > maxVisibleFeatures;

  const renderIcon = () => {
    if (icon) return icon;
    if (isCurrent) return <Crown className="h-5 w-5 text-green-600" />;
    if (isPopular) return <Star className="h-5 w-5 text-blue-600" />;
    return <Package className="h-5 w-5 text-gray-600" />;
  };

  const renderBadge = () => {
    if (isCurrent) {
      return (
        <Badge variant="secondary" className={styles.badge}>
          Current
        </Badge>
      );
    }
    if (isPopular) {
      return (
        <Badge variant="secondary" className={styles.badge}>
          Popular
        </Badge>
      );
    }
    if (!isActive) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          Inactive
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className={cn(styles.card, className, !isActive && 'opacity-60', 'flex flex-col h-full')}>
      {/* Popular badge overlay */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-[#14A76C] text-white px-4 py-1.5 rounded-full shadow-lg">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className={compact ? 'pb-3' : 'pb-6'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {renderIcon()}
            <CardTitle className={cn('text-xl font-bold', styles.header)}>
              {name}
            </CardTitle>
          </div>
          {renderBadge()}
        </div>
        {description && (
          <CardDescription className={cn(compact ? 'text-sm' : 'text-base', 'mt-2 text-gray-600')}>
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Price */}
        <div className="text-center mb-6">
          <div className={cn('text-3xl font-bold', styles.price)}>
            {formatPrice(price, currency)}
          </div>
          <div className="text-sm text-gray-500 mt-1">per {billingCycle}</div>
        </div>

        {/* Features */}
        <div className="flex-1 mb-6">
          <h4 className="font-semibold mb-4 text-sm text-gray-800 uppercase tracking-wide">
            Features Included
          </h4>
          <div className="space-y-3">
            {displayFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#14A76C]/10 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-[#14A76C]" />
                </div>
                <span className="text-gray-700 leading-relaxed">{feature}</span>
              </div>
            ))}

            {hasMoreFeatures && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-auto p-2 text-xs text-[#14A76C] hover:text-[#14A76C] hover:bg-[#14A76C]/5 rounded-full"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {features.length - maxVisibleFeatures} More Features
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Action Button - Always at bottom */}
        {onAction && (
          <div className="mt-auto">
            <Button
              onClick={() => onAction(id)}
              disabled={actionDisabled || actionLoading || !isActive}
              className={cn(
                "w-full h-12 rounded-full font-semibold transition-all duration-200",
                isCurrent
                  ? "border-2 border-[#14A76C] text-[#14A76C] bg-white hover:bg-[#14A76C] hover:text-white"
                  : "bg-[#14A76C] hover:bg-[#14A76C]/90 text-white shadow-lg hover:shadow-xl"
              )}
              variant={isCurrent ? 'outline' : 'default'}
            >
              {actionLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading...
                </>
              ) : (
                actionLabel
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact variant for smaller spaces
export function CompactPackageCard(props: PackageCardProps) {
  return (
    <PackageCard
      {...props}
      compact={true}
      maxVisibleFeatures={2}
      className={cn('max-w-sm', props.className)}
    />
  );
}

// Grid layout helper
export function PackageCardGrid({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      className
    )}>
      {children}
    </div>
  );
}
