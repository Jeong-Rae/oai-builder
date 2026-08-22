function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => image.decode().then(resolve, () => resolve());
    image.onerror = () => resolve();
    image.src = url;
  });
}

export function preloadAssets(urls: readonly string[]): Promise<void> {
  return Promise.all(urls.map(preloadImage)).then(() => undefined);
}
