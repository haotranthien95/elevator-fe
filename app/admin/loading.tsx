import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 rounded-full border-4 border-surface-low border-t-primary animate-[spin_1.5s_linear_infinite]" />
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
      <div className="flex z-10 flex-col items-center">
        <p className="text-[1.5rem] font-semibold text-on-surface animate-pulse">Loading Workspace</p>
        <p className="text-[0.875rem] font-medium text-on-surface-variant/80 tracking-wide mt-1">
          Establishing secure connection...
        </p>
      </div>
    </div>
  );
}
