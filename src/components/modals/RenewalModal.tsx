import React, { useState } from 'react';
import { CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { formatCurrency } from '@/lib/utils';
import { DraggableModal } from '@/components/common/DraggableModal';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    type: 'domain' | 'hosting' | 'vps';
    name: string;
    currentExpiry: string;
    cost: number;
  } | null;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({ isOpen, onClose, asset }) => {
  const { processRenewal } = useData();

  const [newExpiry, setNewExpiry] = useState('');
  const [cost, setCost] = useState(asset?.cost || 0);
  const [paymentMethod, setPaymentMethod] = useState('Corporate Credit Card');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (asset) {
      setCost(asset.cost);
      const current = new Date(asset.currentExpiry);
      if (!isNaN(current.getTime())) {
        current.setFullYear(current.getFullYear() + 1);
        setNewExpiry(current.toISOString().split('T')[0]);
      } else {
        const next = new Date();
        next.setFullYear(next.getFullYear() + 1);
        setNewExpiry(next.toISOString().split('T')[0]);
      }
      setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
      setSubmitted(false);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processRenewal({
      assetType: asset.type,
      assetId: asset.id,
      newExpiryDate: newExpiry,
      cost: Number(cost),
      paymentMethod,
      invoiceNumber,
      notes,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Asset Renewal"
      subtitle="Record renewal payment and extend validity"
      icon={<CreditCard className="w-4 h-4" />}
      maxWidthClass="max-w-lg"
    >
      {submitted ? (
        <div className="p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Renewal Successfully Recorded!
          </h3>
          <p className="text-xs text-slate-500">
            The expiry date has been updated and a verified payment receipt was added to history.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-400 block uppercase text-[10px] font-bold">Target Asset</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.name}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block uppercase text-[10px] font-bold">Type</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                {asset.type}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Expiration Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Renewal Cost (INR ₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Corporate Credit Card">Corporate Credit Card (Stripe)</option>
                <option value="HDFC Bank Wire">HDFC Bank Wire Transfer</option>
                <option value="Razorpay UPI">Razorpay UPI Gateway</option>
                <option value="PayPal Corporate">PayPal Corporate Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Invoice / Reference #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9921"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes &amp; Confirmation Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes or confirmation codes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            >
              Confirm Renewal ({formatCurrency(cost)})
            </button>
          </div>
        </form>
      )}
    </DraggableModal>
  );
};
