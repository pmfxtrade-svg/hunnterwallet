import React from 'react';
import { Status, Network } from '../types';

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const isExcellent = status === Status.EXCELLENT;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isExcellent 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-blue-50 text-blue-700 border-blue-200'
    }`}>
      {status}
    </span>
  );
};

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
