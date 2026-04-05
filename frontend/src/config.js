/**
 * Kortex Frontend Configuration
 * Handles dynamic API routing for local vs production environments.
 */

const getApiBaseUrl = () => {
  // If we're in production (deployed on Vercel), use the Render backend URL.
  // Otherwise, fallback to the local proxy (localhost:8000).
  if (process.env.NODE_ENV === 'production') {
    // Replace this with your actual Render URL after deployment
    return process.env.REACT_APP_API_URL || 'https://kortex-backend.onrender.com';
  }
  return ''; // In development, the 'proxy' in package.json handles this.
};

export const API_BASE_URL = getApiBaseUrl();

export const getEndpoint = (path) => {
    // If path starts with /, remove it to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};
