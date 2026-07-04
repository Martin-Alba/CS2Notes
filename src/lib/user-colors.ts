export const CS2_COLORS = [
  { name: "green", bg: "bg-black/40 bg-gradient-to-br from-green-500/5 to-green-400/10 backdrop-blur-lg", border: "border-green-500/15", text: "text-green-300", dot: "bg-green-400", glow: "rgba(34,197,94,0.08)" },
  { name: "blue", bg: "bg-black/40 bg-gradient-to-br from-blue-500/5 to-blue-400/10 backdrop-blur-lg", border: "border-blue-500/15", text: "text-blue-300", dot: "bg-blue-400", glow: "rgba(59,130,246,0.08)" },
  { name: "yellow", bg: "bg-black/40 bg-gradient-to-br from-yellow-500/5 to-yellow-400/10 backdrop-blur-lg", border: "border-yellow-500/15", text: "text-yellow-300", dot: "bg-yellow-400", glow: "rgba(234,179,8,0.06)" },
  { name: "orange", bg: "bg-black/40 bg-gradient-to-br from-orange-500/5 to-orange-400/10 backdrop-blur-lg", border: "border-orange-500/15", text: "text-orange-300", dot: "bg-orange-400", glow: "rgba(249,115,22,0.08)" },
  { name: "violet", bg: "bg-black/40 bg-gradient-to-br from-violet-500/5 to-violet-400/10 backdrop-blur-lg", border: "border-violet-500/15", text: "text-violet-300", dot: "bg-violet-400", glow: "rgba(139,92,246,0.08)" },
] as const;

export type UserColor = typeof CS2_COLORS[number];

function hashUserId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getUserColor(userId: string): UserColor {
  return CS2_COLORS[hashUserId(userId) % CS2_COLORS.length];
}
