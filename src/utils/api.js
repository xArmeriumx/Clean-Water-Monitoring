/**
 * API Fetch Wrapper
 * Reusable utilities for making API calls with credentials and error handling
 */

import {
  AUTH_ENDPOINTS,
  LOCATIONS_ENDPOINTS,
  ISSUES_ENDPOINTS,
  USERS_ENDPOINTS,
  DEVICES_ENDPOINTS,
} from './apiEndpoints';

/**
 * Base fetch wrapper with credentials and error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(url, options = {}) {
  const defaultOptions = {
    credentials: 'include', // Important: send HttpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Remove Content-Type header if body is FormData
  if (options.body instanceof FormData) {
    delete mergedOptions.headers['Content-Type'];
  }

  return fetch(url, mergedOptions);
}

/**
 * GET request
 * @param {string} url - API endpoint URL
 * @returns {Promise<Response>} Fetch response
 */
export async function apiGet(url) {
  return apiFetch(url, { method: 'GET' });
}

/**
 * POST request with JSON body
 * @param {string} url - API endpoint URL
 * @param {object|FormData} body - Request body
 * @returns {Promise<Response>} Fetch response
 */
export async function apiPost(url, body) {
  const options = { method: 'POST' };
  
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  
  return apiFetch(url, options);
}

/**
 * PUT request with JSON body
 * @param {string} url - API endpoint URL
 * @param {object|FormData} body - Request body
 * @returns {Promise<Response>} Fetch response
 */
export async function apiPut(url, body) {
  const options = { method: 'PUT' };
  
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  
  return apiFetch(url, options);
}

/**
 * DELETE request
 * @param {string} url - API endpoint URL
 * @returns {Promise<Response>} Fetch response
 */
export async function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' });
}

/**
 * Fetch CSRF token
 * @returns {Promise<string>} CSRF token
 */
export async function getCsrfToken() {
  const res = await apiGet(AUTH_ENDPOINTS.CSRF_TOKEN);
  if (res.ok) {
    const data = await res.json();
    return data.csrfToken;
  }
  throw new Error('Failed to fetch CSRF token');
}

/**
 * POST request with CSRF token
 * @param {string} url - API endpoint URL
 * @param {object} body - Request body
 * @returns {Promise<Response>} Fetch response
 */
export async function apiPostWithCsrf(url, body) {
  const csrfToken = await getCsrfToken();
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'x-csrf-token': csrfToken,
    },
  });
}

// ==================== Domain-Specific API Services ====================

/**
 * Authentication API
 */
export const authApi = {
  getCsrfToken,
  
  async login(username, password) {
    return apiPostWithCsrf(AUTH_ENDPOINTS.LOGIN, { username, password });
  },
  
  async logout() {
    return apiPost(AUTH_ENDPOINTS.LOGOUT);
  },
  
  async getMe() {
    return apiGet(AUTH_ENDPOINTS.ME);
  },
  
  async updateMe(data) {
    return apiPost(AUTH_ENDPOINTS.ME, data);
  },
};

/**
 * Locations API
 */
export const locationsApi = {
  async getAll(detail = null) {
    const url = detail ? `${LOCATIONS_ENDPOINTS.LIST}?detail=${detail}` : LOCATIONS_ENDPOINTS.LIST;
    return apiGet(url);
  },
  
  async getById(id) {
    return apiGet(LOCATIONS_ENDPOINTS.GET(id));
  },
  
  async create(data) {
    return apiPost(LOCATIONS_ENDPOINTS.CREATE, data);
  },
  
  async update(id, data) {
    return apiPut(LOCATIONS_ENDPOINTS.UPDATE(id), data);
  },
  
  async delete(id) {
    return apiDelete(LOCATIONS_ENDPOINTS.DELETE(id));
  },
  
  async getLogs(id) {
    return apiGet(LOCATIONS_ENDPOINTS.LOGS(id));
  },
  
  async uploadImage(id, formData) {
    return apiPost(LOCATIONS_ENDPOINTS.UPLOAD_IMAGE(id), formData);
  },
  
  async uploadCsv(id, formData) {
    return apiPost(LOCATIONS_ENDPOINTS.UPLOAD_CSV(id), formData);
  },
  
  async uploadLab(id, formData) {
    return apiPost(LOCATIONS_ENDPOINTS.LAB_UPLOAD(id), formData);
  },
  
  async getLabHistory(id) {
    return apiGet(LOCATIONS_ENDPOINTS.LAB_HISTORY(id));
  },
};

/**
 * Issues API
 */
export const issuesApi = {
  async getByLocation(locationId) {
    return apiGet(ISSUES_ENDPOINTS.LIST(locationId));
  },
  
  async create(locationId, formData) {
    return apiPost(ISSUES_ENDPOINTS.CREATE(locationId), formData);
  },
  
  async delete(locationId, issueKey) {
    return apiDelete(ISSUES_ENDPOINTS.DELETE(locationId, issueKey));
  },
  
  async getTotal() {
    return apiGet(ISSUES_ENDPOINTS.TOTAL);
  },
};

/**
 * Users API (Admin only)
 */
export const usersApi = {
  async getAll() {
    return apiGet(USERS_ENDPOINTS.LIST);
  },
  
  async create(data) {
    return apiPost(USERS_ENDPOINTS.CREATE, data);
  },
  
  async update(id, data) {
    return apiPut(USERS_ENDPOINTS.UPDATE(id), data);
  },
  
  async delete(id) {
    return apiDelete(USERS_ENDPOINTS.DELETE(id));
  },
  
  async getLogs() {
    return apiGet(USERS_ENDPOINTS.LOGS);
  },
  
  async createLog(data) {
    return apiPost(USERS_ENDPOINTS.LOGS, data);
  },
};

/**
 * Devices API
 */
export const devicesApi = {
  async getUnlinked() {
    return apiGet(DEVICES_ENDPOINTS.UNLINKED);
  },
  
  async unlink(data) {
    return apiPost(DEVICES_ENDPOINTS.UNLINK, data);
  },
};
