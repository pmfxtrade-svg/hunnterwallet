
import React from 'react';
import { Network, Status } from '../types';

export const NetworkBadge: React.FC<{ network: Network }> = ({ network }) => {
  const colors: Record<string, string> = {
    [Network.SOLANA]: 'bg-purple-50 text-purple-700 border-purple-200',
    [Network.ETHEREUM]: 'bg-slate-100 text-slate-700 border-slate-300',
    [Network.BASE]: 'bg-blue-50 text-blue-700 border-blue-200',
    [Network.BSC]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    [Network.OTHER]: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[network] || colors[Network.OTHER]}`}>
      {network}
    </span>
  );
};

export const StatusBadge: React.FC<{ status?: Status }> = ({ status }) => {
  if (!status) return null;
  const colors = {
    [Status.GOOD]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [Status.EXCELLENT]: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-100',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[status]}`}>
      {status}
    </span>
  );
};
