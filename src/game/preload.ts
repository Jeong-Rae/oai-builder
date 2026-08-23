function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => image.decode().then(resolve, () => resolve());
    image.onerror = () => resolve();
    image.src = url;
  });
}

export type PreloadAsset = string | (() => PromiseLike<unknown>);

function preloadAsset(asset: PreloadAsset): Promise<void> {
  if (typeof asset === "string") return preloadImage(asset);
  return Promise.resolve(asset()).then(
    () => undefined,
    () => undefined,
  );
}

export async function preloadAssets(
  groups: readonly (readonly PreloadAsset[])[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  let loaded = 0;
  const seen = new Set<string>();
  const uniqueGroups = groups.map((group) =>
    group.filter((asset) => {
      if (typeof asset !== "string") return true;
      if (seen.has(asset)) return false;
      seen.add(asset);
      return true;
    }),
  );
  const total = uniqueGroups.reduce((count, group) => count + group.length, 0);
  onProgress?.(loaded, total);
  for (const group of uniqueGroups) {
    await Promise.all(
      group.map(async (asset) => {
        await preloadAsset(asset);
        onProgress?.(++loaded, total);
      }),
    );
  }
}
