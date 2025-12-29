/**
 * API Endpoints - Centralized endpoint definitions
 * Aligns with backend/src/RouteAPI.js
 */

// Base API URL
// Uses VITE_API_URL from environment if available (for production/Vercel)
// Fallback to '/api' for local development (using Vite proxy)
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// ==================== Authentication ====================
export const AUTH_ENDPOINTS = {
  CSRF_TOKEN: `${API_BASE}/csrf-token`,
  LOGIN: `${API_BASE}/users/login`,
  LOGOUT: `${API_BASE}/logout`,
  ME: `${API_BASE}/me`,
};

// ==================== Locations ====================
export const LOCATIONS_ENDPOINTS = {
  LIST: `${API_BASE}/locations`,
  GET: (id) => `${API_BASE}/locations/${id}`,
  CREATE: `${API_BASE}/locations`,
  UPDATE: (id) => `${API_BASE}/locations/${id}`,
  DELETE: (id) => `${API_BASE}/locations/${id}`,
  LOGS: (id) => `${API_BASE}/locations/${id}/logs`,
  UPLOAD_IMAGE: (id) => `${API_BASE}/locations/${id}/uploadImage`,
  UPLOAD_CSV: (id) => `${API_BASE}/locations/${id}/uploadCsv`,
  LAB_UPLOAD: (id) => `${API_BASE}/locations/${id}/labupload`,
  LAB_HISTORY: (id) => `${API_BASE}/locations/${id}/labhistory`,
};

// ==================== Issues ====================
export const ISSUES_ENDPOINTS = {
  LIST: (locationId) => `${API_BASE}/locations/${locationId}/issues`,
  CREATE: (locationId) => `${API_BASE}/locations/${locationId}/issues`,
  DELETE: (locationId, issueKey) => `${API_BASE}/locations/${locationId}/issues/${issueKey}`,
  TOTAL: `${API_BASE}/issues/total`,
};

// ==================== Users (Admin) ====================
export const USERS_ENDPOINTS = {
  LIST: `${API_BASE}/users`,
  CREATE: `${API_BASE}/users`,
  UPDATE: (id) => `${API_BASE}/users/${id}`,
  DELETE: (id) => `${API_BASE}/users/${id}`,
  LOGS: `${API_BASE}/userlogs`,
};

// ==================== Devices ====================
export const DEVICES_ENDPOINTS = {
  UNLINKED: `${API_BASE}/devices/unlinked`,
  UNLINK: `${API_BASE}/device/unlink`,
};

// ==================== Logs ====================
export const LOGS_ENDPOINTS = {
  ALL: `${API_BASE}/logs`,
};
