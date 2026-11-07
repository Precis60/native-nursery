export type GatePhase = "checking" | "unavailable" | "signed-out" | "denied" | "ready";

export function gatePhase(input: {
  configured: boolean;
  pending: boolean;
  signedIn: boolean;
  owner: boolean | null;
}): GatePhase {
  if (!input.configured) return "unavailable";
  if (input.pending) return "checking";
  if (!input.signedIn) return "signed-out";
  if (input.owner !== true) return "denied";
  return "ready";
}
