import { ShoppingBag } from "lucide-react";

type CorrectionStartViewProps = {
  startSession: () => void;
  isStarting: boolean;
};

export default function CorrectionStartView({ startSession, isStarting }: CorrectionStartViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
      <div className="bg-purple-50 p-6 rounded-full mb-6 border-4 border-purple-100">
        <ShoppingBag className="w-16 h-16 text-purple-600" />
      </div>
      <h2 className="text-3xl font-black text-purple-900 mb-2">Atomic Correction Portal</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Type missing entries here natively. When you click Submit, the system will instantly wipe the selected date's corrupted records and replace them automatically with yours.
      </p>
      <button
        onClick={startSession}
        disabled={isStarting}
        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-bold shadow-md transition-colors disabled:opacity-50"
      >
        {isStarting ? "Initializing..." : "Start Atomic Session"}
      </button>
    </div>
  );
}
