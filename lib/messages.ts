export const messages: Record<string, string> = {
  "insufficient-credits": "Insufficient credits.",
  "market-closed": "This market is closed.",
  "market-resolved": "Market resolved successfully.",
  "market-cancelled": "Market cancelled and refunded successfully.",
  "already-resolved": "This market has already been resolved.",
  "already-cancelled": "This market has already been cancelled.",
  "invalid-invite": "Invalid invite code.",
  "expired-invite": "Expired invite code.",
  "cancelled-invite": "Invite code has been cancelled.",
  "used-invite": "Invite code has no remaining uses.",
  "admin-only": "Admin-only page.",
  "prediction-placed": "Prediction placed successfully.",
  "balance-updated": "Credit balance updated.",
  "invite-created": "Invite code created.",
  "invite-cancelled": "Invite code cancelled.",
  "market-created": "Market created.",
  "market-updated": "Market updated.",
  "market-manually-closed": "Market closed.",
  "player-created": "Player created.",
  "player-deactivated": "Player removed from active players.",
  "player-reactivated": "Player reactivated.",
  "account-inactive": "This account is inactive. Ask an admin to reactivate it."
};

export function getMessage(code?: string | string[] | null) {
  if (!code || Array.isArray(code)) return null;
  return messages[code] ?? code;
}
