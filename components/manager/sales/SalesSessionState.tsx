import { History, RefreshCw, ShoppingBag, WifiOff } from "lucide-react";

type SalesSessionStateProps = {
  sessionId: string | null;
  orphanedSession: any;
  isRecovering: boolean;
  isStarting: boolean;
  isOnline: boolean;
  startSession: () => void;
  restoreOrphanedSession: () => void;
  closeOrphanedSession: () => void;
};

export default function SalesSessionState({
  sessionId,
  orphanedSession,
  isRecovering,
  isStarting,
  isOnline,
  startSession,
  restoreOrphanedSession,
  closeOrphanedSession
}: SalesSessionStateProps) {
  if (sessionId) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
      {orphanedSession ? (
        <div className="relative group max-w-md w-full animate-in fade-in zoom-in slide-in-from-bottom-8 duration-700 ease-out">
          {/* Background dynamic glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[4rem] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000" />
          
          <div className="relative bg-white dark:bg-[#1C1C1E]/80 backdrop-blur-2xl p-10 lg:p-12 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-slate-950/5 overflow-hidden">
            {/* Decorative corner accent */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl" />
            
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-600/20 rounded-3xl blur-xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <History className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase">
                Unfinished Session <br />
                <span className="text-blue-600 dark:text-blue-400">Detected</span>
              </h2>
              
              <p className="text-slate-500 dark:text-gray-400 mb-10 text-base lg:text-lg leading-relaxed font-medium">
                We found an open session from <span className="text-slate-900 dark:text-white font-bold underline decoration-blue-500/30 whitespace-nowrap">{new Date(orphanedSession.started_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>. 
                Ready to pick up where you left off?
              </p>

              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={restoreOrphanedSession}
                  disabled={isRecovering}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group/btn"
                >
                  {isRecovering ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                  )}
                  <span>Continue Session</span>
                </button>
                
                <button
                  onClick={closeOrphanedSession}
                  disabled={isRecovering}
                  className="w-full bg-slate-50 dark:bg-[#252528] hover:bg-slate-100 dark:bg-[#2C2C2E] text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 border border-slate-200 dark:border-[#2C2C2E]/50"
                >
                  Start Fresh
                </button>
              </div>
              
              <p className="mt-8 text-[10px] uppercase tracking-[0.2em] font-black text-slate-300">
                Secure Cloud Sync v2.0
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-full mb-6">
            <ShoppingBag className="w-16 h-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Ready for Sales</h2>
          <p className="text-slate-500 dark:text-gray-400 max-w-md mb-8">
            Start a new session to begin recording sales, applying prices, and automatically updating stock in real-time.
          </p>
          <button
            onClick={startSession}
            disabled={isStarting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isStarting ? "Initializing..." : "Start Sales Session"}
          </button>
          
          {!isOnline && (
            <div className="mt-8 flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-full text-sm font-medium">
              <WifiOff className="w-4 h-4" />
              Offline Mode — Changes will sync on reconnect
            </div>
          )}
        </div>
      )}
    </div>
  );
}
