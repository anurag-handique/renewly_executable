import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatCurrencyForPDF, formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const RenewalsPage: React.FC = () => {
  const { history } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');

  const filteredHistory = history.filter((item) => {
    const matchSearch =
      item.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoice_number && item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));
    if (assetTypeFilter === 'all') return matchSearch;
    return matchSearch && item.asset_type === assetTypeFilter;
  });

  const exportCSV = () => {
    const headers = ['Asset Type,Asset Name,Amount,Payment Date,Previous Expiry,New Expiry,Payment Method,Invoice #\n'];
    const rows = filteredHistory.map((h) =>
      `"${h.asset_type}","${h.asset_name}","${h.amount}","${h.payment_date}","${h.previous_expiry_date}","${h.new_expiry_date}","${h.payment_method}","${h.invoice_number || ''}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renewly-renewal-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Renewly - Renewal & Payment History Ledger', 14, 16);
    doc.setFontSize(9);
    doc.text(`Prepared by Renewly | Generated on ${new Date().toLocaleString()}`, 14, 22);

    const tableData = filteredHistory.map((h) => [
      h.asset_name,
      h.asset_type.toUpperCase(),
      formatCurrencyForPDF(h.amount),
      formatDate(h.payment_date),
      formatDate(h.new_expiry_date),
      h.payment_method,
      h.invoice_number || 'N/A',
    ]);

    autoTable(doc, {
      head: [['Asset Name', 'Type', 'Amount', 'Date Paid', 'New Expiry', 'Method', 'Invoice #']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`renewly-renewal-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalPaid = filteredHistory.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Renewal History &amp; Payments
          </h1>
          <p className="text-sm text-slate-500">
            Audit trail of past subscription extensions, corporate receipts, and payment transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            PDF Ledger
          </button>
        </div>
      </div>

      {/* Summary Box & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Total Recorded Renewals</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {filteredHistory.length} Transactions
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Cumulative Paid Amount</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(totalPaid)}
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, payment method, asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <select
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <option value="all">All Asset Types</option>
            <option value="domain">Domains</option>
            <option value="hosting">Hosting</option>
            <option value="vps">VPS Servers</option>
          </select>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Asset / Target</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Validity Extended</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Invoice / Ref #</th>
                <th className="py-3 px-4">Renewed By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-700 dark:text-slate-300">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No payment history matches your query.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.asset_name}
                      </div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.asset_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(item.payment_date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 dark:text-slate-100 font-medium">
                        Until {formatDate(item.new_expiry_date)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Previous: {formatDate(item.previous_expiry_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 dark:text-slate-200">{item.payment_method}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {item.invoice_number ? (
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400 font-semibold">
                          {item.invoice_number}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.renewed_by || 'DevOps Admin'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

