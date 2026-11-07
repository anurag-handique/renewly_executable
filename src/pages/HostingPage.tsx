import React, { useState } from 'react';
import {
  Server,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { HostingAsset } from '@/types';
import { formatCurrency, formatCurrencyForPDF, formatDate, getStatusBadgeInfo } from '@/lib/utils';
import { RenewalModal } from '@/components/modals/RenewalModal';
import { DraggableModal } from '@/components/common/DraggableModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const HostingPage: React.FC = () => {
  const { hostings, saveHosting, deleteHosting } = useData();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingHosting, setEditingHosting] = useState<HostingAsset | null>(null);
  const [renewalAsset, setRenewalAsset] = useState<{
    id: string;
    type: 'hosting';
    name: string;
    currentExpiry: string;
    cost: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    website_url: '',
    hosting_provider: '',
    hosting_plan: '',
    server_location: '',
    subscription_start: new Date().toISOString().split('T')[0],
    expiry_date: '',
    renewal_cost: 29.0,
    currency: 'INR',
    billing_cycle: 'annual' as const,
    auto_renewal: true,
    ssl_status: true,
    notes: '',
  });

  const openAddModal = () => {
    setEditingHosting(null);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormData({
      website_url: 'https://',
      hosting_provider: 'AWS Elastic Beanstalk',
      hosting_plan: 'Business Pro Tier',
      server_location: 'Mumbai (ap-south-1)',
      subscription_start: new Date().toISOString().split('T')[0],
      expiry_date: nextYear.toISOString().split('T')[0],
      renewal_cost: 49.0,
      currency: 'INR',
      billing_cycle: 'annual',
      auto_renewal: true,
      ssl_status: true,
      notes: '',
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (h: HostingAsset) => {
    setEditingHosting(h);
    setFormData({
      website_url: h.website_url,
      hosting_provider: h.hosting_provider,
      hosting_plan: h.hosting_plan,
      server_location: h.server_location || '',
      subscription_start: h.subscription_start,
      expiry_date: h.expiry_date,
      renewal_cost: h.renewal_cost,
      currency: h.currency,
      billing_cycle: h.billing_cycle,
      auto_renewal: h.auto_renewal,
      ssl_status: h.ssl_status,
      notes: h.notes || '',
    });
    setIsEditorOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveHosting({
      id: editingHosting ? editingHosting.id : undefined,
      website_url: formData.website_url,
      hosting_provider: formData.hosting_provider,
      hosting_plan: formData.hosting_plan,
      server_location: formData.server_location,
      subscription_start: formData.subscription_start,
      expiry_date: formData.expiry_date,
      renewal_cost: Number(formData.renewal_cost),
      currency: formData.currency,
      billing_cycle: formData.billing_cycle,
      auto_renewal: formData.auto_renewal,
      ssl_status: formData.ssl_status,
      status: 'active',
      notes: formData.notes,
    });
    setIsEditorOpen(false);
  };

  const filteredHostings = hostings.filter((h) => {
    const matchSearch =
      h.website_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.hosting_provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.hosting_plan.toLowerCase().includes(searchTerm.toLowerCase());
    if (providerFilter === 'all') return matchSearch;
    return matchSearch && h.hosting_provider.toLowerCase().includes(providerFilter.toLowerCase());
  });

  const exportCSV = () => {
    const headers = ['Website URL,Provider,Plan,Location,Expiry Date,Renewal Cost,Billing Cycle,SSL\n'];
    const rows = filteredHostings.map((h) =>
      `"${h.website_url}","${h.hosting_provider}","${h.hosting_plan}","${h.server_location || ''}","${h.expiry_date}","${h.renewal_cost}","${h.billing_cycle}","${h.ssl_status}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renewly-hosting-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Renewly - Website Hosting Subscriptions', 14, 16);
    doc.setFontSize(9);
    doc.text(`Prepared by Renewly | Generated on ${new Date().toLocaleString()}`, 14, 22);

    const tableData = filteredHostings.map((h) => [
      h.website_url,
      h.hosting_provider,
      h.hosting_plan,
      formatDate(h.expiry_date),
      formatCurrencyForPDF(h.renewal_cost),
      h.billing_cycle,
      h.ssl_status ? 'Active' : 'Pending',
    ]);

    autoTable(doc, {
      head: [['Website', 'Provider', 'Plan', 'Expiry Date', 'Cost', 'Cycle', 'SSL']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`renewly-hostings-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Website Hosting Subscriptions
          </h1>
          <p className="text-sm text-slate-500">
            Monitor web hosting plans, server zones, SSL certificates, and recurring contracts.
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
            PDF
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Hosting
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search websites, plans, or providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Provider:</span>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
            >
              <option value="all">All Providers</option>
              <option value="vercel">Vercel</option>
              <option value="aws">AWS</option>
              <option value="kinsta">Kinsta</option>
              <option value="netlify">Netlify</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hosting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHostings.map((h) => {
          const badge = getStatusBadgeInfo(h.expiry_date, h.status);
          return (
            <div
              key={h.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">
                      {h.hosting_provider}
                    </span>
                    <a
                      href={h.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1 truncate"
                    >
                      {h.website_url}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    </a>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0 ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-2 py-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan Tier</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{h.hosting_plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Server Location</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {h.server_location || 'Global CDN'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SSL Certificate</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Valid &amp; Secured
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expires On</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(h.expiry_date)}
                    </span>
                  </div>
                </div>

                {h.notes && (
                  <p className="mt-3 text-[11px] text-slate-400 line-clamp-2">
                    {h.notes}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Renewal Rate</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {formatCurrency(h.renewal_cost, h.currency)}
                    <span className="text-xs font-normal text-slate-500 capitalize">
                      /{h.billing_cycle}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    title="Renew Hosting Subscription"
                    onClick={() =>
                      setRenewalAsset({
                        id: h.id,
                        type: 'hosting',
                        name: `${h.website_url} (${h.hosting_provider})`,
                        currentExpiry: h.expiry_date,
                        cost: h.renewal_cost,
                      })
                    }
                    className="p-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Renew
                  </button>
                  <button
                    title="Edit Hosting"
                    onClick={() => openEditModal(h)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      title="Delete Hosting"
                      onClick={() => {
                        if (confirm(`Delete hosting for ${h.website_url}?`)) {
                          deleteHosting(h.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      <DraggableModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingHosting ? 'Edit Website Hosting' : 'Add Website Hosting Plan'}
        subtitle="Manage hosting infrastructure specs, SSL certificates and billing"
        icon={<Server className="w-4 h-4" />}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Website URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.codeyogi.org"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hosting Provider *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vercel, AWS, Kinsta"
                    value={formData.hosting_provider}
                    onChange={(e) => setFormData({ ...formData, hosting_provider: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Plan Tier / Spec *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pro Team, High Concurrency"
                    value={formData.hosting_plan}
                    onChange={(e) => setFormData({ ...formData, hosting_plan: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Server Datacenter Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai (ap-south-1)"
                    value={formData.server_location}
                    onChange={(e) => setFormData({ ...formData, server_location: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expiry / Next Renewal Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Renewal Cost (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.renewal_cost}
                    onChange={(e) => setFormData({ ...formData, renewal_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_renewal}
                    onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  Auto-Renewal Enabled
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ssl_status}
                    onChange={(e) => setFormData({ ...formData, ssl_status: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  SSL Protection Active
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Deployment instructions, account IDs, or special tier caveats..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {editingHosting ? 'Save Changes' : 'Create Hosting Record'}
                </button>
              </div>
            </form>
      </DraggableModal>

      {/* Renewal Modal */}
      <RenewalModal
        isOpen={!!renewalAsset}
        onClose={() => setRenewalAsset(null)}
        asset={renewalAsset}
      />
    </div>
  );
};

