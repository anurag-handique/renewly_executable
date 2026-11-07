import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CreditCard,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { DomainAsset } from '@/types';
import { formatCurrency, formatCurrencyForPDF, formatDate, getStatusBadgeInfo } from '@/lib/utils';
import { RenewalModal } from '@/components/modals/RenewalModal';
import { DraggableModal } from '@/components/common/DraggableModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const DomainsPage: React.FC = () => {
  const { domains, saveDomain, deleteDomain } = useData();
  const { isAdmin } = useAuth();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'cost'>('expiry');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainAsset | null>(null);
  const [renewalAsset, setRenewalAsset] = useState<{
    id: string;
    type: 'domain';
    name: string;
    currentExpiry: string;
    cost: number;
  } | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    domain_name: '',
    registrar: '',
    dns_provider: '',
    registration_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    renewal_cost: 15.0,
    currency: 'INR',
    billing_cycle: 'annual' as const,
    auto_renewal: false,
    notes: '',
  });

  const openAddModal = () => {
    setEditingDomain(null);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormData({
      domain_name: '',
      registrar: 'Cloudflare',
      dns_provider: 'Cloudflare DNS',
      registration_date: new Date().toISOString().split('T')[0],
      expiry_date: nextYear.toISOString().split('T')[0],
      renewal_cost: 15.0,
      currency: 'INR',
      billing_cycle: 'annual',
      auto_renewal: false,
      notes: '',
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (dom: DomainAsset) => {
    setEditingDomain(dom);
    setFormData({
      domain_name: dom.domain_name,
      registrar: dom.registrar,
      dns_provider: dom.dns_provider,
      registration_date: dom.registration_date,
      expiry_date: dom.expiry_date,
      renewal_cost: dom.renewal_cost,
      currency: dom.currency,
      billing_cycle: dom.billing_cycle,
      auto_renewal: dom.auto_renewal,
      notes: dom.notes || '',
    });
    setIsEditorOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveDomain({
      id: editingDomain ? editingDomain.id : undefined,
      domain_name: formData.domain_name,
      registrar: formData.registrar,
      dns_provider: formData.dns_provider,
      registration_date: formData.registration_date,
      expiry_date: formData.expiry_date,
      renewal_cost: Number(formData.renewal_cost),
      currency: formData.currency,
      billing_cycle: formData.billing_cycle,
      auto_renewal: formData.auto_renewal,
      status: 'active',
      notes: formData.notes,
    });
    setIsEditorOpen(false);
  };

  // Filtered & sorted domains
  const filteredDomains = domains
    .filter((d) => {
      const matchSearch =
        d.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.registrar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.dns_provider.toLowerCase().includes(searchTerm.toLowerCase());
      if (statusFilter === 'all') return matchSearch;
      if (statusFilter === 'active') return matchSearch && getStatusBadgeInfo(d.expiry_date).label === 'Active';
      if (statusFilter === 'expiring') return matchSearch && getStatusBadgeInfo(d.expiry_date).label.includes('Expiring');
      if (statusFilter === 'expired') return matchSearch && getStatusBadgeInfo(d.expiry_date).label.includes('Expired');
      return matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'expiry') {
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      }
      if (sortBy === 'name') {
        return a.domain_name.localeCompare(b.domain_name);
      }
      return b.renewal_cost - a.renewal_cost;
    });

  // Export CSV
  const exportCSV = () => {
    const headers = ['Domain Name,Registrar,DNS Provider,Registration Date,Expiry Date,Renewal Cost,Auto Renewal\n'];
    const rows = filteredDomains.map((d) =>
      `"${d.domain_name}","${d.registrar}","${d.dns_provider}","${d.registration_date}","${d.expiry_date}","${d.renewal_cost}","${d.auto_renewal}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renewly-domains-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Renewly - Domains Infrastructure Report', 14, 16);
    doc.setFontSize(9);
    doc.text(`Prepared by Renewly | Generated on ${new Date().toLocaleString()}`, 14, 22);

    const tableData = filteredDomains.map((d) => [
      d.domain_name,
      d.registrar,
      d.dns_provider,
      formatDate(d.registration_date),
      formatDate(d.expiry_date),
      formatCurrencyForPDF(d.renewal_cost),
      d.auto_renewal ? 'Yes' : 'No',
    ]);

    autoTable(doc, {
      head: [['Domain', 'Registrar', 'DNS Provider', 'Registered', 'Expires', 'Cost', 'Auto-Renew']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`renewly-domains-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Domains Management
          </h1>
          <p className="text-sm text-slate-500">
            Track and automate renewal schedules across domain registrars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            PDF
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search domains, registrar, DNS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
            >
              <option value="all">All Domains ({domains.length})</option>
              <option value="active">Active Only</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
            >
              <option value="expiry">Expiry Date</option>
              <option value="name">Domain Name</option>
              <option value="cost">Renewal Cost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Domain Name</th>
                <th className="py-3 px-4">Registrar &amp; DNS</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Renewal Cost</th>
                <th className="py-3 px-4">Auto Renew</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-700 dark:text-slate-300">
              {filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No domains found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDomains.map((dom) => {
                  const badge = getStatusBadgeInfo(dom.expiry_date, dom.status);
                  return (
                    <tr
                      key={dom.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{dom.domain_name}</span>
                          <a
                            href={`https://${dom.domain_name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-indigo-600 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {dom.notes && (
                          <div className="text-[11px] font-normal text-slate-400 truncate max-w-xs">
                            {dom.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{dom.registrar}</div>
                        <div className="text-[11px] text-slate-400">{dom.dns_provider}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{formatDate(dom.expiry_date)}</div>
                        <div className="text-[11px] text-slate-400">
                          Registered: {formatDate(dom.registration_date)}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(dom.renewal_cost, dom.currency)}
                        <span className="text-[10px] text-slate-400 block font-normal capitalize">
                          /{dom.billing_cycle}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {dom.auto_renewal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <RefreshCw className="w-3 h-3" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0 ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Renew Domain Now"
                            onClick={() =>
                              setRenewalAsset({
                                id: dom.id,
                                type: 'domain',
                                name: dom.domain_name,
                                currentExpiry: dom.expiry_date,
                                cost: dom.renewal_cost,
                              })
                            }
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Domain"
                            onClick={() => openEditModal(dom)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              title="Delete Domain"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${dom.domain_name}?`)) {
                                  deleteDomain(dom.id);
                                }
                              }}
                              className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <DraggableModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingDomain ? 'Edit Domain Asset' : 'Register New Domain Asset'}
        subtitle="Configure domain registration details and billing schedule"
        icon={<Globe className="w-4 h-4" />}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Domain Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. codeyogi.org"
                  value={formData.domain_name}
                  onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Registrar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloudflare, Namecheap"
                    value={formData.registrar}
                    onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    DNS Provider *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloudflare DNS, Route53"
                    value={formData.dns_provider}
                    onChange={(e) => setFormData({ ...formData, dns_provider: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.registration_date}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date *
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
                    <option value="annual">Annual</option>
                    <option value="monthly">Monthly</option>
                    <option value="multi_year">Multi-year</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="auto_renewal"
                  checked={formData.auto_renewal}
                  onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="auto_renewal" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Auto-renewal enabled on registrar portal
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, associated services, or renewal instructions..."
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
                  {editingDomain ? 'Save Changes' : 'Create Domain Asset'}
                </button>
              </div>
            </form>
      </DraggableModal>

      {/* Renewal Action Modal */}
      <RenewalModal
        isOpen={!!renewalAsset}
        onClose={() => setRenewalAsset(null)}
        asset={renewalAsset}
      />
    </div>
  );
};

