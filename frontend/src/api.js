/**
 * API Helper for Kortex
 * Automatically selects the correct backend URL based on the environment.
 */

const getApiBaseUrl = () => {
  // If defined in environment (Vercel/Production), use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default to localhost for development if not specified
  // Note: When deploying to Vercel, if the backend is on a different domain (Render),
  // this MUST be set in Vercel environment variables.
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
