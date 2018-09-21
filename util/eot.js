const Transform = require('stream').Transform;
const util = require('util');

class EOT extends Transform {
    constructor(cb) {
        if (!cb) throw new Error('callback required');

        super();

        this.cb = cb;
        this.eot = false;

        Transform.call(this);
    }

    _transform(chunk, env, done) {
        if (chunk.indexOf('\u0004') === chunk.length - 1) {
            this.eot = true;

            const str = String(chunk)
            chunk = new Buffer(str.slice(str.length - 1, 1));
        }

        this.push(chunk);

        return done();
    }

    _final(done) {
        if (!this.eot) return this.cb(new Error('Download Stream Terminated Abruptly - No EOT'));

        return done();
    }
}

module.exports = EOT;
