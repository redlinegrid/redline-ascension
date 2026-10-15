export type RivalStyle = "tyre-specialist" | "qualifying-ace" | "reliability-leader" | "aggressive-racer" | "strategy-gambler" | "defensive-specialist" | "development-team" | "high-risk-attacker" | "consistency-expert" | "opportunist";

export const RIVAL_STYLE_INFO: Record<RivalStyle, { label: string; description: string }> = {
  "tyre-specialist": { label: "TYRE SPECIALIST", description: "Runs longer stints and protects tyre life." },
  "qualifying-ace": { label: "QUALIFYING ACE", description: "Carries extra baseline pace, but is harder on tyres." },
  "reliability-leader": { label: "RELIABILITY LEADER", description: "Protects component condition and avoids degradation." },
  "aggressive-racer": { label: "AGGRESSIVE RACER", description: "Attacks hard, spending more fuel and tyre life." },
  "strategy-gambler": { label: "STRATEGY GAMBLER", description: "Attempts an early pit stop to gain track position." },
  "defensive-specialist": { label: "DEFENSIVE SPECIALIST", description: "Finds extra pace in close traffic." },
  "development-team": { label: "DEVELOPMENT TEAM", description: "Starts modestly and improves deeper into a run." },
  "high-risk-attacker": { label: "HIGH-RISK ATTACKER", description: "Very quick, but wears components faster." },
  "consistency-expert": { label: "CONSISTENCY EXPERT", description: "Produces steadier lap times with fewer swings." },
  opportunist: { label: "OPPORTUNIST", description: "Makes the most of safety-car periods." },
};

export const RIVAL_STYLE_BY_TEAM: Record<string, RivalStyle> = {
  "Vortex Racing": "tyre-specialist", "Apex Motorsport": "qualifying-ace", "Northstar": "reliability-leader",
  "Velocity Works": "aggressive-racer", "Titan Autosport": "strategy-gambler", "Solaris Racing": "defensive-specialist",
  "Orion Motorsport": "development-team", "Ember GP": "high-risk-attacker", "Summit Racing": "consistency-expert",
  "Kestrel Performance": "opportunist",
};

export function rivalPaceFactor(style: RivalStyle | undefined, isPlayer: boolean, round: number, safetyCar: boolean, closeTraffic: boolean): number {
  if (isPlayer) return 1;
  if (style === "qualifying-ace") return 0.991;
  if (style === "aggressive-racer") return 0.986;
  if (style === "high-risk-attacker") return 0.981;
  if (style === "defensive-specialist" && closeTraffic) return 0.99;
  if (style === "development-team") return round >= 8 ? 0.988 : 1.006;
  if (style === "opportunist" && safetyCar) return 0.975;
  return 1;
}
export function rivalWearFactor(style: RivalStyle | undefined, isPlayer: boolean): number {
  if (isPlayer) return 1;
  if (style === "tyre-specialist") return 0.78;
  if (style === "aggressive-racer") return 1.22;
  if (style === "high-risk-attacker") return 1.32;
  return 1;
}
export function rivalConditionFactor(style: RivalStyle | undefined, isPlayer: boolean): number {
  if (isPlayer) return 1;
  if (style === "reliability-leader") return 0.48;
  if (style === "high-risk-attacker") return 1.7;
  return 1;
}