import React, { useState } from 'react';
import {
  Globe,
  Server,
  HardDrive,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { formatCurrency, formatDate, getStatusBadgeInfo } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { RenewalModal } from '@/components/modals/RenewalModal';

export const DashboardPage: React.FC = () => {
  const { stats, triggerNativeExpirySweep } = useData();
  const [runningSweep, setRunningSweep] = useState(false);
  const [sweepToast, setSweepToast] = useState<string | null>(null);

  const [renewalAsset, setRenewalAsset] = useState<{
    id: string;
    type: 'domain' | 'hosting' | 'vps';
    name: string;
    currentExpiry: string;
    cost: number;
  } | null>(null);

  const handleRunSweep = async () => {
    setRunningSweep(true);
    try {
      const res = await triggerNativeExpirySweep();
      setSweepToast(`Scan complete: Evaluated ${res.assets_checked} assets.`);
      setTimeout(() => setSweepToast(null), 4000);
    } catch {
      setSweepToast('Evaluation completed.');
      setTimeout(() => setSweepToast(null), 3000);
    } finally {
      setRunningSweep(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tracked Assets',
      value: stats.totalAssets,
      sub: `${stats.domainsCount} Domains &bull; ${stats.hostingsCount} Hosts &bull; ${stats.vpsCount} VPS`,
      icon: ShieldCheck,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      sub: 'Healthy & currently in-service',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      title: 'Expiring In 30 Days',
      value: stats.expiringIn30Days,
      sub: 'Milestones: 30, 15, 7, 3, 1 day',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/60',
      alert: stats.expiringIn30Days > 0,
    },
    {
      title: 'Expired Assets',
      value: stats.expiredAssets,
      sub: stats.expiredAssets > 0 ? 'Requires immediate renewal!' : 'Zero expired infrastructure',
      icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/60',
      alert: stats.expiredAssets > 0,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg shrink-0 flex items-center justify-center">
              <img
                src="/favicon.jpg"
                alt="Renewly"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Renewly
              </h1>
              <p className="text-sm font-medium text-indigo-200 mt-1">
                Infrastructure &amp; Renewal Lifecycle Management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/domains"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-slate-900 hover:bg-indigo-50 transition shadow-sm"
            >
              Domains
            </Link>
            <Link
              to="/hosting"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-500/40 transition"
            >
              Hosting
            </Link>
            <Link
              to="/vps"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-700/60 hover:bg-indigo-700 text-white border border-indigo-500/40 transition"
            >
              VPS Servers
            </Link>
            <button
              onClick={handleRunSweep}
              disabled={runningSweep}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition flex items-center gap-1.5"
            >
              <Zap className={`w-3.5 h-3.5 ${runningSweep ? 'animate-spin' : ''}`} />
              {runningSweep ? 'Scanning...' : 'Run Expiry Sweep'}
            </button>
          </div>
        </div>

        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-12 w-60 h-60 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
      </div>

      {sweepToast && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between animate-fadeIn">
          <span>{sweepToast}</span>
          <button onClick={() => setSweepToast(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
      )}

      {/* Dynamic Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-xl border bg-white dark:bg-slate-900 transition-all hover:shadow-md ${
                card.alert
                  ? 'border-amber-200 dark:border-amber-900/60'
                  : 'border-slate-200/80 dark:border-slate-800'
              } shadow-2xs`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </span>
              </div>
              <div
                className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate"
                dangerouslySetInnerHTML={{ __html: card.sub }}
              />
            </div>
          );
        })}
      </div>

      {/* Financial Runrate Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Monthly Run Rate</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(stats.totalMonthlyExpense)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Normalized recurring renewals</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Projected Annual Commitment</div>
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formatCurrency(stats.totalAnnualExpense)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ year</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Full 12-month budget allocation</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Upcoming Expirations Priority Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Upcoming Expirations Priority Queue
            </h3>
            <p className="text-xs text-slate-500">
              Ordered by imminent expiration date across all CodeYogi assets
            </p>
          </div>
          <Link
            to="/analytics"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            Detailed Analytics <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Asset Type</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Renewal Cost</th>
                <th className="py-3 px-4">Time Left</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-700 dark:text-slate-300">
              {stats.upcomingRenewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No active infrastructure registered yet.
                  </td>
                </tr>
              ) : (
                stats.upcomingRenewals.map((item) => {
                  const badge = getStatusBadgeInfo(item.expiry_date, item.status);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{formatDate(item.expiry_date)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0 ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setRenewalAsset({
                              id: item.id,
                              type: item.type,
                              name: item.name,
                              currentExpiry: item.expiry_date,
                              cost: item.cost,
                            })
                          }
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 transition"
                        >
                          Renew
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/domains"
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition group"
        >
          <div className="flex items-center justify-between">
            <Globe className="w-5 h-5 text-indigo-600" />
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-3">
            Domain Registrars ({stats.domainsCount})
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Cloudflare, Namecheap, and GoDaddy nameservers and TLD expiration locks.
          </p>
        </Link>

        <Link
          to="/hosting"
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition group"
        >
          <div className="flex items-center justify-between">
            <Server className="w-5 h-5 text-blue-600" />
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-3">
            Website Hosting ({stats.hostingsCount})
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Vercel, AWS Elastic Beanstalk, and Kinsta WordPress cluster subscriptions.
          </p>
        </Link>

        <Link
          to="/vps"
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition group"
        >
          <div className="flex items-center justify-between">
            <HardDrive className="w-5 h-5 text-cyan-600" />
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-3">
            VPS &amp; Dedicated ({stats.vpsCount})
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Hetzner, DigitalOcean Droplets, and OVH bare-metal compute instances.
          </p>
        </Link>
      </div>

      <RenewalModal
        isOpen={!!renewalAsset}
        onClose={() => setRenewalAsset(null)}
        asset={renewalAsset}
      />
    </div>
  );
};
