import React from 'react';

interface CriticalBannerProps {
  message: string;
  detail?: string;
}

export default function CriticalBanner({
  message,
  detail,
}: CriticalBannerProps): React.ReactElement {
  return (
    <div className="w-full bg-danger dark:bg-danger-dark text-white px-4 py-2 text-sm flex items-center gap-2 flex-shrink-0">
      <span className="font-semibold">⚠ {message}</span>
      {detail && (
        <span className="opacity-80">— {detail}</span>
      )}
    </div>
  );
}
