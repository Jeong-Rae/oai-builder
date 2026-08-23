function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => image.decode().then(resolve, () => resolve());
    image.onerror = () => resolve();
    image.src = url;
  });
}

export async function preloadAssets(
  urls: readonly string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  let loaded = 0;
  onProgress?.(loaded, urls.length);
  await Promise.all(
    urls.map(async (url) => {
      await preloadImage(url);
      onProgress?.(++loaded, urls.length);
    }),
  );
}
