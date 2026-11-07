import React, { useState } from 'react';
import {
  HardDrive,
  Plus,
  Search,
  Cpu,
  Edit2,
  Trash2,
  CreditCard,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { VPSAsset } from '@/types';
import { formatCurrency, formatCurrencyForPDF, formatDate, getStatusBadgeInfo } from '@/lib/utils';
import { RenewalModal } from '@/components/modals/RenewalModal';
import { DraggableModal } from '@/components/common/DraggableModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const VPSPage: React.FC = () => {
  const { vps, saveVPS, deleteVPS } = useData();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVPS, setEditingVPS] = useState<VPSAsset | null>(null);
  const [renewalAsset, setRenewalAsset] = useState<{
    id: string;
    type: 'vps';
    name: string;
    currentExpiry: string;
    cost: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    server_name: '',
    provider: 'Hetzner Cloud',
    ip_address: '',
    ipv6_address: '',
    operating_system: 'Ubuntu 24.04 LTS',
    cpu_cores: 4,
    ram_gb: 8,
    storage_gb: 160,
    storage_type: 'NVMe SSD',
    datacenter_region: 'Nuremberg (nbg1)',
    subscription_start: new Date().toISOString().split('T')[0],
    expiry_date: '',
    renewal_cost: 32.0,
    currency: 'INR',
    billing_cycle: 'monthly' as const,
    auto_renewal: true,
    ssh_port: 22,
    notes: '',
  });

  const openAddModal = () => {
    setEditingVPS(null);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFormData({
      server_name: '',
      provider: 'Hetzner Cloud',
      ip_address: '138.199.12.80',
      ipv6_address: '',
      operating_system: 'Ubuntu 24.04 LTS',
      cpu_cores: 4,
      ram_gb: 16,
      storage_gb: 160,
      storage_type: 'NVMe SSD',
      datacenter_region: 'Falkenstein (fsn1)',
      subscription_start: new Date().toISOString().split('T')[0],
      expiry_date: nextMonth.toISOString().split('T')[0],
      renewal_cost: 38.0,
      currency: 'INR',
      billing_cycle: 'monthly',
      auto_renewal: true,
      ssh_port: 22,
      notes: '',
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (v: VPSAsset) => {
    setEditingVPS(v);
    setFormData({
      server_name: v.server_name,
      provider: v.provider,
      ip_address: v.ip_address,
      ipv6_address: v.ipv6_address || '',
      operating_system: v.operating_system,
      cpu_cores: v.cpu_cores,
      ram_gb: v.ram_gb,
      storage_gb: v.storage_gb,
      storage_type: v.storage_type,
      datacenter_region: v.datacenter_region || '',
      subscription_start: v.subscription_start,
      expiry_date: v.expiry_date,
      renewal_cost: v.renewal_cost,
      currency: v.currency,
      billing_cycle: v.billing_cycle,
      auto_renewal: v.auto_renewal,
      ssh_port: v.ssh_port,
      notes: v.notes || '',
    });
    setIsEditorOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveVPS({
      id: editingVPS ? editingVPS.id : undefined,
      server_name: formData.server_name,
      provider: formData.provider,
      ip_address: formData.ip_address,
      ipv6_address: formData.ipv6_address,
      operating_system: formData.operating_system,
      cpu_cores: Number(formData.cpu_cores),
      ram_gb: Number(formData.ram_gb),
      storage_gb: Number(formData.storage_gb),
      storage_type: formData.storage_type,
      datacenter_region: formData.datacenter_region,
      subscription_start: formData.subscription_start,
      expiry_date: formData.expiry_date,
      renewal_cost: Number(formData.renewal_cost),
      currency: formData.currency,
      billing_cycle: formData.billing_cycle,
      auto_renewal: formData.auto_renewal,
      ssh_port: Number(formData.ssh_port),
      status: 'active',
      notes: formData.notes,
    });
    setIsEditorOpen(false);
  };

  const filteredVPS = vps.filter((v) => {
    const matchSearch =
      v.server_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.operating_system.toLowerCase().includes(searchTerm.toLowerCase());
    if (providerFilter === 'all') return matchSearch;
    return matchSearch && v.provider.toLowerCase().includes(providerFilter.toLowerCase());
  });

  const exportCSV = () => {
    const headers = ['Server Name,Provider,IP Address,OS,Cores,RAM (GB),Storage (GB),Expiry Date,Cost,Billing\n'];
    const rows = filteredVPS.map((v) =>
      `"${v.server_name}","${v.provider}","${v.ip_address}","${v.operating_system}","${v.cpu_cores}","${v.ram_gb}","${v.storage_gb}","${v.expiry_date}","${v.renewal_cost}","${v.billing_cycle}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renewly-vps-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Renewly - VPS & Dedicated Infrastructure Report', 14, 16);
    doc.setFontSize(9);
    doc.text(`Prepared by Renewly | Generated on ${new Date().toLocaleString()}`, 14, 22);

    const tableData = filteredVPS.map((v) => [
      v.server_name,
      v.provider,
      v.ip_address,
      `${v.cpu_cores} vCPU / ${v.ram_gb}GB`,
      formatDate(v.expiry_date),
      formatCurrencyForPDF(v.renewal_cost),
      v.billing_cycle,
    ]);

    autoTable(doc, {
      head: [['Server Name', 'Provider', 'IP Address', 'Specs', 'Expiry Date', 'Cost', 'Billing']],
      body: tableData,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`renewly-vps-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            VPS &amp; Cloud Servers
          </h1>
          <p className="text-sm text-slate-500">
            Monitor compute instances, specs, IP addresses, OS distributions, and monthly renewals.
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
            Add Server
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search server name, IP address, OS..."
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
              <option value="hetzner">Hetzner</option>
              <option value="digitalocean">DigitalOcean</option>
              <option value="ovh">OVHcloud</option>
              <option value="aws">AWS EC2</option>
            </select>
          </div>
        </div>
      </div>

      {/* VPS List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Server &amp; Provider</th>
                <th className="py-3 px-4">IP &amp; Region</th>
                <th className="py-3 px-4">Hardware Specs</th>
                <th className="py-3 px-4">OS Distro</th>
                <th className="py-3 px-4">Renewal Expiry</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-700 dark:text-slate-300">
              {filteredVPS.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No VPS instances found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredVPS.map((srv) => {
                  const badge = getStatusBadgeInfo(srv.expiry_date, srv.status);
                  return (
                    <tr
                      key={srv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {srv.server_name}
                        </div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                          {srv.provider}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit">
                          {srv.ip_address}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {srv.datacenter_region || 'Standard DC'} (Port {srv.ssh_port})
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <Cpu className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {srv.cpu_cores} vCPU &bull; {srv.ram_gb} GB RAM
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {srv.storage_gb} GB {srv.storage_type}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 dark:text-slate-200">{srv.operating_system}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(srv.expiry_date)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Started: {formatDate(srv.subscription_start)}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(srv.renewal_cost, srv.currency)}
                        <span className="text-[10px] text-slate-400 block font-normal capitalize">
                          /{srv.billing_cycle}
                        </span>
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
                            title="Renew Server Now"
                            onClick={() =>
                              setRenewalAsset({
                                id: srv.id,
                                type: 'vps',
                                name: `${srv.server_name} (${srv.ip_address})`,
                                currentExpiry: srv.expiry_date,
                                cost: srv.renewal_cost,
                              })
                            }
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit VPS"
                            onClick={() => openEditModal(srv)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              title="Delete VPS"
                              onClick={() => {
                                if (confirm(`Delete VPS server ${srv.server_name}?`)) {
                                  deleteVPS(srv.id);
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

      {/* VPS Editor Modal */}
      <DraggableModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingVPS ? 'Edit VPS Instance' : 'Provision / Register VPS Server'}
        subtitle="Manage cloud compute instances, IP addresses, OS distributions and renewal costs"
        icon={<HardDrive className="w-4 h-4" />}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Server Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. prod-api-cluster-01"
                    value={formData.server_name}
                    onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Provider *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hetzner, DigitalOcean"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Primary IPv4 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 159.69.88.14"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Datacenter Region
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Falkenstein (fsn1)"
                    value={formData.datacenter_region}
                    onChange={(e) => setFormData({ ...formData, datacenter_region: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    CPU Cores
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.cpu_cores}
                    onChange={(e) => setFormData({ ...formData, cpu_cores: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    RAM (GB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.ram_gb}
                    onChange={(e) => setFormData({ ...formData, ram_gb: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Storage (GB)
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={formData.storage_gb}
                    onChange={(e) => setFormData({ ...formData, storage_gb: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Operating System *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ubuntu 24.04 LTS"
                    value={formData.operating_system}
                    onChange={(e) => setFormData({ ...formData, operating_system: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expiry / Next Bill Date *
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
                    Cost (₹ INR) *
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

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="vps_auto_renew"
                  checked={formData.auto_renewal}
                  onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="vps_auto_renew" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Auto-Renewal Enabled on Cloud Provider
                </label>
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
                  {editingVPS ? 'Save Changes' : 'Provision Server Record'}
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

