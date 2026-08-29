// Remote card photography lives here, not in constants/images.ts —
// that file is for bundled require() assets, this is for network images.
// One helper keeps the Unsplash query params (width, quality,
// auto-format, crop) in a single place so every card stays consistent.
export const unsplash = (id: string, width = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
