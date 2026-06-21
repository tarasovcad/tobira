import DOMPurify from "isomorphic-dompurify";

export function sanitizeSvgBuffer(bytes: Buffer) {
  const sanitizedSvg = DOMPurify.sanitize(bytes.toString("utf-8"), {
    USE_PROFILES: {svg: true, svgFilters: true, html: true},
    ADD_TAGS: ["foreignObject"],
    HTML_INTEGRATION_POINTS: {foreignobject: true},
  });

  return Buffer.from(sanitizedSvg, "utf-8");
}
