// The Observatory (80 %) and the classic view (90 %) render their interface smaller on desktop screens (app.html / classic.html set
// `html { zoom }`); the 3D canvas and the maps are drawn at full scale (`--unzoom`) so picking stays exact.
// Mouse positions (clientX/Y) are screen pixels: divide by this before using them as CSS lengths.
export const uiZoom = (): number => {
  const z = parseFloat(getComputedStyle(document.documentElement).zoom || "1");
  return Number.isFinite(z) && z > 0 ? z : 1;
};
