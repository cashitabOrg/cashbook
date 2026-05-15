import { WifiOff } from "lucide-react";

type SalesTopBannerProps = {
  isOnline: boolean;
  isStale: boolean;
};

export default function SalesTopBanner({ isOnline, isStale }: SalesTopBannerProps) {
  return (
    <>
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 text-amber-700 bg-amber-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter shadow-sm shrink-0 lg:rounded-b-xl lg:-mt-6 lg:mb-4">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode — changes will sync automatically on reconnect
        </div>
      )}

      {isStale && (
        <div className="flex items-center justify-center gap-2 text-rose-700 bg-rose-50 border-b border-rose-100 px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-widest shadow-sm shrink-0 lg:rounded-b-xl lg:-mt-6 lg:mb-4">
          <div className="animate-pulse bg-rose-500 w-2 h-2 rounded-full" />
          This session was started on a previous day. We recommend ending it and starting a new one for accurate reporting.
        </div>
      )}
    </>
  );
}
