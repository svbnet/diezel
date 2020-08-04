const stream = require('stream');
const crypto = require('crypto');
const mk = require('../key-store');

const BLOCK_SIZE = 2048;
const BUFFER_SIZE = BLOCK_SIZE;
const IV = Buffer.from(Array.from({length: 8}, (i, x) => x));

class AssetDecryptorTransform extends stream.Transform {

    constructor(songId, options) {
        options = options || {};
        options.objectMode = true;
        super(options);
        this._buf = Buffer.alloc(0);
        this._totalChunkCount = 0;

        const keys = mk.keys;
        const songIdHash = crypto.createHash('md5').update(songId, 'ascii').digest('hex');
        this._trackKey = Buffer.alloc(16);
        for (let i = 0; i < 16; i++) {
            this._trackKey.writeInt8(songIdHash[i].charCodeAt(0) ^ songIdHash[i + 16].charCodeAt(0) ^ keys.TRACK_XOR_KEY[i].charCodeAt(0), i);
        }
    }

    _createDecipher() {
        return crypto.createDecipheriv('bf-cbc', this._trackKey, IV).setAutoPadding(false);
    }

    _transform(data, encoding, callback) {
        this._buf = Buffer.concat([this._buf, data]);

        while (this._buf.length >= BUFFER_SIZE) {
            this._processChunk(this._buf.slice(0, BUFFER_SIZE));
            this._buf = this._buf.slice(BUFFER_SIZE);
        }
        callback();
    }

    _processChunk(chunk) {
        if (this._totalChunkCount % 3 === 0) {
            const f = this._createDecipher();
            this.push(f.update(chunk));
            this.push(f.final());
        }
        else {
            this.push(chunk);
        }
        this._totalChunkCount++;
    }

    _flush(callback) {
        if (this._buf) {
            this.push(this._buf);
        }
        callback();
    }
}

module.exports = AssetDecryptorTransform;
