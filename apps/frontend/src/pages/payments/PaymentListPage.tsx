import { useState } from 'react';
import { PaymentList } from '../../components/payments/PaymentList';
import { ManagementLayout, StatCard, ActionButton } from '../../components/layout/ManagementLayout';
import { DollarSign, CreditCard, TrendingUp, Download, Plus } from 'lucide-react';
import { ProcessPaymentModal } from '../../components/payments/ProcessPaymentModal';

export function PaymentListPage() {
  const [showProcessModal, setShowProcessModal] = useState(false);

  const stats: StatCard[] = [
    {
      icon: DollarSign,
      label: 'Total Payments',
      value: '0', // This would come from API
      iconColor: 'bg-teal-100',
    },
    {
      icon: CreditCard,
      label: 'Processed Today',
      value: '0', // This would come from API
      iconColor: 'bg-green-100',
    },
    {
      icon: TrendingUp,
      label: 'Total Revenue',
      value: '$0.00', // This would come from API
      iconColor: 'bg-blue-100',
    },
    {
      icon: DollarSign,
      label: 'Pending',
      value: '0', // This would come from API
      iconColor: 'bg-orange-100',
    },
  ];

  const actions: ActionButton[] = [
    {
      icon: Plus,
      label: 'Process Payment',
      onClick: () => setShowProcessModal(true),
      variant: 'default',
    },
    {
      icon: Download,
      label: 'Export',
      onClick: () => {
        // Export functionality
        console.log('Export payments');
      },
      variant: 'outline',
    },
  ];

  return (
    <>
      <ManagementLayout
        title="Payment Management"
        description="Track and manage all payment transactions"
        stats={stats}
        actions={actions}
        tableTitle="All Payments"
        tableDescription="Manage and track all payment transactions with advanced filtering and search capabilities."
      >
        <PaymentList />
      </ManagementLayout>

      {showProcessModal && (
        <ProcessPaymentModal
          isOpen={showProcessModal}
          onClose={() => setShowProcessModal(false)}
          onSuccess={() => {
            setShowProcessModal(false);
            // Refresh will be handled by the PaymentList component
          }}
        />
      )}
    </>
  );
}
