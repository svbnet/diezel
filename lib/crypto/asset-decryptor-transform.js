const stream = require('stream');
const crypto = require('crypto');

let Blowfish;
import('egoroof-blowfish').then((mod) => { Blowfish = mod.Blowfish; });

const { getKey } = require('../key-store');

const BLOCK_SIZE = 2048;
const BUFFER_SIZE = BLOCK_SIZE;
const IV = Buffer.from(Array.from({ length: 8 }, (i, x) => x));

const blowfishDecryptChunk = (key, iv, data) => {
    if (!Blowfish) throw new Error('Blowfish did not load in time');
    const bf = new Blowfish(key, Blowfish.MODE.CBC, Blowfish.PADDING.NULL);
    bf.setIv(iv);
    return Buffer.from(bf.decode(data, Blowfish.TYPE.UINT8_ARRAY));
};

class AssetDecryptorTransform extends stream.Transform {
    constructor(songId, options) {
        const trackXorKey = getKey('TRACK_XOR_KEY');
        options = options || {};
        options.objectMode = true;
        super(options);
        this._buf = Buffer.alloc(0);
        this._totalChunkCount = 0;

        const songIdHash = crypto.createHash('md5').update(songId, 'ascii').digest('hex');
        this._trackKey = Buffer.alloc(16);
        for (let i = 0; i < 16; i++) {
            this._trackKey.writeInt8(songIdHash[i].charCodeAt(0) ^ songIdHash[i + 16].charCodeAt(0) ^ trackXorKey[i].charCodeAt(0), i);
        }
    }

    _transform(data, encoding, callback) {
        this._buf = Buffer.concat([this._buf, data]);

        while (this._buf.length >= BUFFER_SIZE) {
            this._processChunk(this._buf.subarray(0, BUFFER_SIZE));
            this._buf = this._buf.subarray(BUFFER_SIZE);
        }

        callback();
    }

    _processChunk(chunk) {
        if (this._totalChunkCount % 3 === 0) {
            this.push(blowfishDecryptChunk(this._trackKey, IV, chunk));
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
