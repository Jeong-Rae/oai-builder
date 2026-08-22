import type { ConstellationLayout } from "./layout";

export interface RenderOptions {
  starUrl?: string;
  starSize?: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement<Tag extends keyof SVGElementTagNameMap>(
  tag: Tag,
  attributes: Record<string, string | number>,
): SVGElementTagNameMap[Tag] {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function setLineClass(line: SVGLineElement, lineClass: string | undefined): void {
  if (!lineClass) return;
  const existing = line.getAttribute("class");
  line.setAttribute("class", existing ? `${existing} ${lineClass}` : lineClass);
}

export function renderConstellationSvg(
  layout: ConstellationLayout,
  options: RenderOptions & { lineClass?: string },
): SVGSVGElement {
  const svg = svgElement("svg", {
    viewBox: `0 0 ${layout.width} ${layout.height}`,
  });
  for (const segment of layout.segments) {
    const line = svgElement("line", {
      x1: segment.x1,
      y1: segment.y1,
      x2: segment.x2,
      y2: segment.y2,
    });
    setLineClass(line, options.lineClass);
    svg.append(line);
  }
  const starSize = options.starSize ?? 0;
  if (options.starUrl && starSize > 0) {
    const half = starSize / 2;
    for (const point of layout.points) {
      svg.append(
        svgElement("image", {
          href: options.starUrl,
          x: point.x - half,
          y: point.y - half,
          width: starSize,
          height: starSize,
        }),
      );
    }
  }
  return svg;
}
