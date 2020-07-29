const stream = require('stream');
const crypto = require('crypto');

const axios = require('axios');

const paddedLength = require('../utils/buffer').paddedLength;
const mk = require('../crypto/MasterKeyProvider');


const LegacyFormat = Object.freeze({
    // MP3 128k?
    MP3_MISC: 0,
    // MP3 128k
    MP3_128: 1,
    // MP3 320k
    MP3_320: 3,
    // MP3 256k
    MP3_256: 5,
    // AAC 64k, uncommon/deprecated
    AAC_64: 6,
    // MP3 192k, uncommon/deprecated
    MP3_192: 7,
    // AAC 96k, uncommon/deprecated
    AAC_96: 8,
    // FLAC
    FLAC: 9,
    // MP3 64k, uncommon/deprecated
    MP3_64: 10,
    // MP3 32k, uncommon/deprecated
    MP3_32: 11,
    // SBC, undocumented?
    SBC: 12,
    // Don't know what these are, maybe video?
    MP4_RA1: 13,
    MP4_RA2: 14,
    MP4_RA3: 15,
});

const BLOCK_SIZE = 2048;
const BUFFER_SIZE = BLOCK_SIZE;
const iv = Buffer.from(Array.from({length: 8}, (i, x) => x));

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
        return crypto.createDecipheriv('bf-cbc', this._trackKey, iv).setAutoPadding(false);
    }

    _transform(data, encoding, callback) {
        this._buf = Buffer.concat([this._buf, data]);

        while (this._buf.length >= BUFFER_SIZE) {
            this._processChunk(this._buf.slice(0, BUFFER_SIZE));
            this._buf = this._buf.slice(BUFFER_SIZE);
        }
        callback()
    }

    _processChunk(chunk) {
        if (this._totalChunkCount % 3 === 0) {
            const f = this._createDecipher();
            this.push(f.update(chunk));
            this.push(f.final());
        } else {
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

const dataSeparator = '¤';

/**
 * Represents a streamable song.
 */
class SongAsset {

    /**
     * Internal constructor. You should call forLegacyStream instead.
     * @param {Object} streamInfo 
     */
    constructor(streamInfo) {
        this.url = streamInfo.url;
        this.format = streamInfo.format;
        this.song = streamInfo.song;
    }

    /**
     * Creates an instance for the specified song and format.
     * @param {Object} song A song returned from a media endpoint.
     * @param {Number} format One of the {@link LegacyFormat} values.
     * @returns {SongAsset} A new instance.
     */
    static forLegacyStream(song, format) {
        const md5Origin = song.MD5_ORIGIN || song.PUID;
        const songId = song.SNG_ID;
        const mediaVersion = song.MEDIA_VERSION;
        
        const keys = mk.keys;
        // Concat params and generate an MD5 hash
        const params = [md5Origin, format, songId, mediaVersion].join(dataSeparator);
        const paramsHash = crypto.createHash('md5').update(params, 'ascii').digest('hex');
    
        // Make our message and pad it out
        const plainMessage = `${paramsHash}${dataSeparator}${params}${dataSeparator}`;
        const plainBuf = Buffer.alloc(paddedLength(plainMessage));
        plainBuf.write(plainMessage, 'ascii');
    
        // Encrypt the message with our URL key
        const cipher = crypto.createCipheriv('aes-128-ecb', keys.LEGACY_URL_KEY, null);
        const path = cipher.update(plainBuf, 'ascii').toString('hex');

        return new this({
            url: `https://e-cdns-proxy-${md5Origin[0]}.dzcdn.net/mobile/1/${path}`,
            song: song,
            format: format,
        });
    }

    /**
     * Creates a new stream decryption transformer for this SongAsset.
     * This is more suitable than `getDecryptedStream` if you want to have
     * access to the encrypted stream length.
     * @returns {stream.Transform} A stream transformer that decrypts the supplied stream.
     */
    createTransformer() {
        return new AssetDecryptorTransform(this.song.SNG_ID);
    }

    /**
     * Creates a decrypted stream for this SongAsset.
     * @returns {stream.Transform} A decrypted stream you can `pipe` to other things.
     */
    async getDecryptedStream() {
        const resp = await axios({
            method: 'get',
            url: this.url,
            responseType: 'stream'
        });
        return resp.data.pipe(this.createTransformer());
    }
}

module.exports = {SongAsset, LegacyFormat};
