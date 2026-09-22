export const MUSK_CLUSTER = [
  "elon-musk",
  "tesla-inc",
  "spacex",
  "twitter",
  "starship-rocket",
  "neuralink",
  "the-boring-company",
] as const;

export const MCGREGOR_CLUSTER = [
  "conor-mcgregor",
  "ufc",
  "dana-white",
  "floyd-mayweather-jr",
  "khabib-nurmagomedov",
  "nate-diaz",
] as const;

export const CLUSTER_HUBS = {
  musk: "elon-musk",
  mcgregor: "conor-mcgregor",
} as const;

export function clusterForSlug(slug: string): "musk" | "mcgregor" | null {
  if ((MUSK_CLUSTER as readonly string[]).includes(slug)) return "musk";
  if ((MCGREGOR_CLUSTER as readonly string[]).includes(slug)) return "mcgregor";
  return null;
}

export function isHubSlug(slug: string): boolean {
  return slug === CLUSTER_HUBS.musk || slug === CLUSTER_HUBS.mcgregor;
}
