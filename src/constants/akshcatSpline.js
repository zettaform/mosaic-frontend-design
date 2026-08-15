/** Spline scene + viewer script (pinned version for stable embeds). */
export const SPLINE_SCRIPT_SRC =
  'https://unpkg.com/@splinetool/viewer@1.12.76/build/spline-viewer.js';

export const SPLINE_SCENE_URL =
  'https://prod.spline.design/vBU9W2ReGCZ6MiAZ/scene.splinecode';

/** Path used as iframe src for Behance and other embedders (no app chrome). */
export const AKSHCAT_EMBED_PATH = '/akshcat/embed';

/**
 * @param {string} origin - e.g. window.location.origin or https://mymailgram.com
 */
export function buildAkshcatIframeEmbed(origin) {
  const base = String(origin || '').replace(/\/$/, '');
  const src = `${base}${AKSHCAT_EMBED_PATH}`;
  return `<iframe src="${src}" title="akshcat" width="100%" height="560" style="border:0;border-radius:8px;display:block;max-width:100%" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
