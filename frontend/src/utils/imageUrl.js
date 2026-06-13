const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Resolve an image field to a renderable URL.
 * - Cloudinary (or any absolute) URL → returned as-is.
 * - Legacy local path ("/uploads/...") → prefixed with the API base so old
 *   records keep working during the migration.
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}/${String(path).replace(/^\/+/, '')}`;
};

export default getImageUrl;
