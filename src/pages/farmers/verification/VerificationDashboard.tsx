import React from 'react';
import { ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';

interface VerificationDashboardProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export const VerificationDashboard: React.FC<VerificationDashboardProps> = ({
  total,
  pending,
  approved,
  rejected
      }) => {
  const cards = [
    {
      title: 'Total Verifications',
      value: total,
      icon: <ShieldCheck className="w-8 h-8 text-blue-400" />,
      color: 'from-blue-900/40 to-slate-900',
      border: 'border-blue-500/20'
      },
    {
      title: 'Pending Review',
      value: pending,
      icon: <Clock className="w-8 h-8 text-amber-400" />,
      color: 'from-amber-900/40 to-slate-900',
      border: 'border-amber-500/20'
      },
    {
      title: 'Approved',
      value: approved,
      icon: <CheckCircle className="w-8 h-8 text-emerald-400" />,
      color: 'from-emerald-900/40 to-slate-900',
      border: 'border-emerald-500/20'
      },
    {
      title: 'Rejected',
      value: rejected,
      icon: <XCircle className="w-8 h-8 text-red-400" />,
      color: 'from-red-900/40 to-slate-900',
      border: 'border-red-500/20'
      },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{card.value}</h3>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 shadow-inner">
              {card.icon}
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        </div>
      ))}
    </div>
  );
};
