import { getMessage } from "@/lib/messages";

export function Flash({ success, error }: { success?: string | string[]; error?: string | string[] }) {
  const successText = getMessage(success);
  const errorText = getMessage(error);

  if (!successText && !errorText) return null;

  return (
    <div className="mb-4 space-y-2">
      {successText ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {successText}
        </div>
      ) : null}
      {errorText ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {errorText}
        </div>
      ) : null}
    </div>
  );
}
