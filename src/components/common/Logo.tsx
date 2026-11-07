import React from 'react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({ size = 'md', className = '' }) => {
  const iconDims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : size === 'xl' ? 'w-16 h-16' : 'w-10 h-10';
  const textSizes = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/sidebar-icon.jpg"
        alt="Renewly Icon"
        className={`${iconDims} rounded-xl object-cover shadow-xs shrink-0`}
      />
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${textSizes} leading-none`}>
          Renewly<span className="text-indigo-600">.</span>
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
          CodeYogi
        </span>
      </div>
    </div>
  );
};

