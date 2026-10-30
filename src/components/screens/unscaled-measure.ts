/**
 * Layout reads for libraries that size themselves from `getBoundingClientRect`
 * inside the scaled screen canvas. That rect is post-transform, so a library
 * measuring its container there draws at the canvas's scale twice over. Under
 * an element marked `data-unscaled-measure` the rect is divided back to the
 * canvas's own pixels, the same mapping `toCanvas` does for the demo cursor.
 * Installed once; everything outside a marked subtree reads the browser's rect.
 */
let installed = false;

export function installUnscaledMeasure() {
  if (installed || typeof Element === "undefined") return;
  installed = true;
  const native = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const rect = native.call(this);
    if (!this.closest("[data-unscaled-measure]")) return rect;
    const canvas = this.closest<HTMLElement>("[data-screen-canvas]");
    if (!canvas || !canvas.offsetWidth) return rect;
    const scale = native.call(canvas).width / canvas.offsetWidth;
    if (!scale || scale === 1) return rect;
    return new DOMRect(rect.x / scale, rect.y / scale, rect.width / scale, rect.height / scale);
  };
}
