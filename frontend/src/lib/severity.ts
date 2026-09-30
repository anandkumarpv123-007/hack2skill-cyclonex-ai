export type SeverityLevel = "EXTREME" | "HIGH" | "MODERATE" | "LOW";

export function getCviSeverity(score: number): SeverityLevel {
  if (score >= 0.70) return "EXTREME";
  if (score >= 0.50) return "HIGH";
  if (score >= 0.30) return "MODERATE";
  return "LOW";
}

export function pluralize(count: number, singular: string, plural: string = singular + "s"): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
