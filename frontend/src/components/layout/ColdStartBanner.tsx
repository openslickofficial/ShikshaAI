import React, { useState } from 'react';
import { Server, Loader2, X } from 'lucide-react';

interface ColdStartBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

export const ColdStartBanner: React.FC<ColdStartBannerProps> = ({
  isVisible,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!isVisible || dismissed) {
    return null;
  }

  const handleClose = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/25 px-4 py-2.5 transition-all animate-fadeIn">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs font-semibold text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 font-extrabold text-[11px]">
            <Server className="w-3.5 h-3.5" />
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Server Cold-Start</span>
          </div>
          <span>
            Waking up the Shiksha AI server — this can take up to a minute on first load.
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
          title="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
