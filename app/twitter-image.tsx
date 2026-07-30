// One design, two routes. Twitter's card and the OG card are the same plate at
// the same 1200x630 — re-exporting is what keeps that structural rather than
// two files kept in agreement by hand.
export { default, alt, size, contentType } from "./opengraph-image";
