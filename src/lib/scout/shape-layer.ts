/**
 * landing: type-only mirror of the app's src/lib/scout/shape-layer.ts, which
 * draws box / lasso / ring shapes on the Mapbox canvas (mapbox-gl is not
 * installed here). The map controls rail reads only this type.
 */
export type DrawTool = "off" | "box" | "lasso" | "ring";
