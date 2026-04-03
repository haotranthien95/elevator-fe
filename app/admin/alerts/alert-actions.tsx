"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AlertActionButtonsProps = {
  alertType: string;
  resourceType: string;
  resourceId: string;
  resourceLabel?: string | null;
  mode?: "default" | "restore";
};

export function AlertActionButtons({
  alertType,
  resourceType,
  resourceId,
  resourceLabel,
  mode = "default",
}: AlertActionButtonsProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function acknowledge(snoozeHours?: number) {
    try {
      setBusyAction(snoozeHours ? `snooze-${snoozeHours}` : "acknowledge");
      setError(null);

      const response = await fetch("/api/admin/alerts/acknowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertType,
          resourceType,
          resourceId,
          resourceLabel,
          snoozeHours,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Failed to update alert");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update alert");
    } finally {
      setBusyAction(null);
    }
  }

  async function restore() {
    try {
      setBusyAction("restore");
      setError(null);

      const params = new URLSearchParams({ alertType, resourceId });
      const response = await fetch(`/api/admin/alerts/acknowledge?${params.toString()}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Failed to restore alert");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to restore alert");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {mode === "restore" ? (
          <button
            type="button"
            onClick={restore}
            disabled={busyAction !== null}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "restore" ? "Restoring..." : "Restore"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => acknowledge()}
              disabled={busyAction !== null}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "acknowledge" ? "Saving..." : "Acknowledge"}
            </button>
            <button
              type="button"
              onClick={() => acknowledge(24)}
              disabled={busyAction !== null}
              className="rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "snooze-24" ? "Saving..." : "Snooze 24h"}
            </button>
          </>
        )}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
