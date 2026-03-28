/**
 * Optimize Unsplash image URLs by adding WebP format and quality params.
 * Also adjusts width for proper sizing.
 */
export function optimizeImageUrl(url: string, width: number = 400): string {
  if (!url) return url;
  
  // Only optimize Unsplash URLs
  if (!url.includes('images.unsplash.com')) return url;
  
  // Remove existing w= param and add optimized params
  const base = url.replace(/[?&]w=\d+/, '');
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}w=${width}&fm=webp&q=80&fit=crop`;
}

/**
 * Generate srcSet for responsive Unsplash images
 */
export function generateSrcSet(url: string, widths: number[] = [230, 400, 600]): string {
  if (!url || !url.includes('images.unsplash.com')) return '';
  
  return widths
    .map((w) => `${optimizeImageUrl(url, w)} ${w}w`)
    .join(', ');
}
