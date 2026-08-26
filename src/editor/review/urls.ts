export function resolveSiblingUrl(port: number): string {
  const { protocol, hostname } = window.location;
  const match = hostname.match(/^(.+)-(\d+)(\.[a-z0-9.-]+)$/i);
  if (match) {
    return `${protocol}//${match[1]}-${port}${match[3]}`;
  }
  const host = hostname === "0.0.0.0" ? "localhost" : hostname;
  return `http://${host}:${port}`;
}
