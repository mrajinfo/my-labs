const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status  0 when the server couldn't be reached
   * @param {Record<string, string>} [fieldErrors]
   */
  constructor(message, status, fieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError("Can't reach the server. Check your connection and that the API is running.", 0);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback =
      response.status >= 500 ? 'The server ran into a problem. Try again in a moment.' : 'That request was rejected.';
    throw new ApiError(data?.message || fallback, response.status, data?.fieldErrors);
  }
  return data;
}

/**
 * @typedef {object} Member
 * @property {string} id
 * @property {string} name
 * @property {string} relation
 * @property {{ ad: string, bs: string }} dob   "YYYY-MM-DD" in each calendar
 * @property {'BS' | 'AD'} enteredIn
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @typedef {{ name: string, relation: string, calendar: 'BS' | 'AD', dob: string }} MemberInput */

export const membersApi = {
  /** @returns {Promise<Member[]>} */
  list: ({ signal } = {}) => request('/members', { signal }).then((data) => data.members),
  /** @param {MemberInput} input @returns {Promise<Member>} */
  create: (input) => request('/members', { method: 'POST', body: input }).then((data) => data.member),
  /** @param {{ id: string, input: MemberInput }} args @returns {Promise<Member>} */
  update: ({ id, input }) =>
    request(`/members/${encodeURIComponent(id)}`, { method: 'PUT', body: input }).then((data) => data.member),
  /** @param {string} id */
  remove: (id) => request(`/members/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
