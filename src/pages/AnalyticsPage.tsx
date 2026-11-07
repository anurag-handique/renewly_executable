import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  DollarSign,
  Download,
  Calendar,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatCurrencyForPDF } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AnalyticsPage: React.FC = () => {
  const { stats, domains, hostings, vps, history } = useData();

  // Aggregate Category breakdown
  const categoryData = [
    {
      name: 'Domains',
      count: domains.length,
      annualExpense: domains.reduce((sum, d) => sum + Number(d.renewal_cost), 0),
      color: '#6366f1',
    },
    {
      name: 'Hosting',
      count: hostings.length,
      annualExpense: hostings.reduce(
        (sum, h) => sum + (h.billing_cycle === 'monthly' ? Number(h.renewal_cost) * 12 : Number(h.renewal_cost)),
        0
      ),
      color: '#3b82f6',
    },
    {
      name: 'VPS Servers',
      count: vps.length,
      annualExpense: vps.reduce(
        (sum, v) => sum + (v.billing_cycle === 'monthly' ? Number(v.renewal_cost) * 12 : Number(v.renewal_cost)),
        0
      ),
      color: '#06b6d4',
    },
  ];

  // Dynamically compute real projected monthly breakdown for the next 6 months from actual assets
  const monthlyProjectionData = React.useMemo(() => {
    const months: { month: string; estimate: number; renewals: number; key: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      months.push({ month: monthLabel, estimate: 0, renewals: 0, key: monthKey });
    }

    const checkAndAdd = (expiryDate: string, cost: number, billingCycle?: string) => {
      if (!expiryDate) return;
      const exp = new Date(expiryDate);
      if (isNaN(exp.getTime())) return;

      const numCost = Number(cost) || 0;

      // If monthly billing, it renews every month
      if (billingCycle === 'monthly') {
        months.forEach((m) => {
          m.estimate += numCost;
          m.renewals += 1;
        });
        return;
      }

      // If annual or other, find the specific matching month within the 6-month window
      const expKey = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, '0')}`;
      const found = months.find((m) => m.key === expKey);
      if (found) {
        found.estimate += numCost;
        found.renewals += 1;
      }
    };

    domains.forEach((d) => checkAndAdd(d.expiry_date, d.renewal_cost, d.billing_cycle));
    hostings.forEach((h) => checkAndAdd(h.expiry_date, h.renewal_cost, h.billing_cycle));
    vps.forEach((v) => checkAndAdd(v.expiry_date, v.renewal_cost, v.billing_cycle));

    return months.map(({ month, estimate, renewals }) => ({
      month,
      estimate: Math.round(estimate),
      renewals,
    }));
  }, [domains, hostings, vps]);

  // Top providers by spend
  const providerSpendMap: Record<string, number> = {};
  domains.forEach((d) => {
    providerSpendMap[d.registrar] = (providerSpendMap[d.registrar] || 0) + Number(d.renewal_cost);
  });
  hostings.forEach((h) => {
    const cost = h.billing_cycle === 'monthly' ? Number(h.renewal_cost) * 12 : Number(h.renewal_cost);
    providerSpendMap[h.hosting_provider] = (providerSpendMap[h.hosting_provider] || 0) + cost;
  });
  vps.forEach((v) => {
    const cost = v.billing_cycle === 'monthly' ? Number(v.renewal_cost) * 12 : Number(v.renewal_cost);
    providerSpendMap[v.provider] = (providerSpendMap[v.provider] || 0) + cost;
  });

  const providerData = Object.entries(providerSpendMap)
    .map(([provider, spend]) => ({ provider, spend: Math.round(spend) }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const exportFinancialReport = () => {
    const doc = new jsPDF();
    doc.text('Renewly - Annual Infrastructure Financial Report', 14, 16);
    doc.setFontSize(9);
    doc.text(`Prepared by Renewly | Generated on ${new Date().toLocaleDateString()}`, 14, 22);

    const breakdownRows = categoryData.map((c) => [
      c.name,
      c.count.toString(),
      formatCurrencyForPDF(c.annualExpense),
      `${((c.annualExpense / (stats.totalAnnualExpense || 1)) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      head: [['Infrastructure Tier', 'Total Assets', 'Annual Projected Cost', '% Total Budget']],
      body: breakdownRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.text('Top Cloud & Registrar Vendors by Annual Volume', 14, finalY);

    const vendorRows = providerData.map((p) => [p.provider, formatCurrencyForPDF(p.spend)]);
    autoTable(doc, {
      head: [['Vendor / Provider', 'Annualized Spend']],
      body: vendorRows,
      startY: finalY + 4,
      theme: 'striped',
    });

    doc.save(`renewly-financial-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Reports &amp; Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Real-time financial analytics, renewal cadence forecasting, and vendor concentration.
          </p>
        </div>

        <button
          onClick={exportFinancialReport}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          Export Financial Report (PDF)
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Annual Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.totalAnnualExpense)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Projected 12-month run-rate</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Burn Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.totalMonthlyExpense)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Average per month</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tracked Assets</span>
            <PieIcon className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats.totalAssets} Active Subscriptions
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Domains, Hosting &amp; VPS</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Paid Renewals Count</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {history.length} Invoices
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Verified payment logs</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Projection Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            6-Month Renewal Expense Projection
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Expected monthly renewals based on scheduled subscription terms
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProjectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Projected Renewal']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="estimate" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Annual Budget by Asset Class
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Relative expense distribution across domains, hosting, and compute
            </p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="annualExpense"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            {categoryData.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">
                  {formatCurrency(c.annualExpense)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Concentration Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
          Top Infrastructure Vendors by Spend
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Identifies critical provider concentration and vendor exposure
        </p>

        <div className="space-y-3">
          {providerData.map((p) => {
            const percentage = Math.min(
              100,
              Math.round((p.spend / (stats.totalAnnualExpense || 1)) * 100)
            );
            return (
              <div key={p.provider} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{p.provider}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(p.spend)} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

