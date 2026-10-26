export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message  safe to show to people using the app
   * @param {Record<string, string>} [fieldErrors]
   */
  constructor(status, message, fieldErrors) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
