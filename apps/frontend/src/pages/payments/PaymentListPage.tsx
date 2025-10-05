import React from 'react';
import { PaymentList } from '../../components/payments/PaymentList';

export function PaymentListPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground">
            Track and manage all payment transactions
          </p>
        </div>
      </div>

      {/* Payment List Component */}
      <PaymentList />
    </div>
  );
}
