export const PRODUCT_PLACEHOLDER = '/placeholder-product.svg';
export const AVATAR_PLACEHOLDER = '/placeholder-avatar.svg';

/**
 * Resolves the first usable image URL for a product-shaped object.
 * Accepts the `image_urls` array, `image_url`, or `image` variants the
 * API has used across revisions, and always returns a real, servable path.
 */
export const resolveProductImage = (item) => {
  if (!item) return PRODUCT_PLACEHOLDER;

  const urls = item.image_urls;
  if (Array.isArray(urls)) {
    const first = urls.find((url) => typeof url === 'string' && url.trim());
    if (first) return first;
  }

  const single = [item.image_url, item.image, item.thumbnail_url].find(
    (url) => typeof url === 'string' && url.trim()
  );
  return single || PRODUCT_PLACEHOLDER;
};

/**
 * Builds an onError handler that falls back to the placeholder exactly once.
 * Clearing the handler first prevents an infinite loop if the placeholder
 * asset itself ever fails to load.
 *
 * This is a plain factory, not a hook: it uses no React state, so it must not
 * be named with a `use` prefix (that would make it look hook-callable).
 */
export const imageFallback = (fallback = PRODUCT_PLACEHOLDER) => (event) => {
  const img = event?.target;
  if (!img || img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.onerror = null;
  img.src = fallback;
};

export default resolveProductImage;
