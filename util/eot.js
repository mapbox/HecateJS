'use strict';

const Transform = require('stream').Transform;

/**
 * Transform stream to passthrough linedelimited GeoJSON
 * and upon termination of the stream, ensure EOT
 * character was present to ensure all data was obtained
 *
 * @class
 */
class EOT extends Transform {
    /**
     * Construct a new EOT Instance
     *
     * @param {function} cb (err, res) style callback
     */
    constructor(cb) {
        if (!cb) throw new Error('callback required');

        super();

        this.cb = cb;
        this.eot = false;

        Transform.call(this);
    }

    /**
     * Internal transform function to passthrough data
     * and look for EOT character
     *
     * @param {Buffer} chunk chunk to passthrough
     * @param {string} encoding The encoding of the chunk
     * @param {function} done completion callback
     *
     * @returns {function} callback function
     */
    _transform(chunk, encoding, done) {
        if (chunk.indexOf('\u0004') === chunk.length - 1) {
            this.eot = true;

            const str = String(chunk);
            chunk = new Buffer.from(str.slice(0, str.length - 1));
        }

        this.push(chunk);

        return done();
    }

    /**
     * Ensure the stream completeled successfully, checking for the EOT character
     *
     * @param {function} done completion callback
     *
     * @returns {function} (err, res) style callback
     */
    _final(done) {
        if (!this.eot) return this.cb(new Error('Download Stream Terminated Abruptly - No EOT'));

        return done();
    }
}

module.exports = EOT;
