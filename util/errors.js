'use strict';
/**
 * Class to create errors that include HTTP status code
 *
 * @class HTTPError
 * @extends {Error}
 */
class HTTPError extends Error {
    /**
     *Creates an instance of HTTPError.
     * @param {string} message The error message.
     * @param {Object} response The response object, which includes the statusCode property.
     * @memberof HTTPError
     */
    constructor(message, response) {
        super(message);
        this.name = 'HTTPError';
        this.status = response ? response.statusCode : null;
    }
}

module.exports = { HTTPError };
