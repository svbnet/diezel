const stream = require('stream');
const crypto = require('crypto');

const axios = require('axios');

const { paddedLength } = require('../utils');
const keys = require('../key-store').keys;
const AssetDecryptorTransform = require("../crypto/asset-decryptor-transform");

const DATA_SEPARATOR = '¤';

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
     * @param {Object} song A song-like object returned from a media endpoint.
     * @param {Number} format One of the {@link SongLegacyFormat} values.
     * @returns {SongAsset} A new instance.
     */
    static forLegacyStream(song, format) {
        const md5Origin = song.MD5_ORIGIN || song.PUID;
        const songId = song.SNG_ID;
        const mediaVersion = song.MEDIA_VERSION;
        
        // Concat params and generate an MD5 hash
        const params = [md5Origin, format, songId, mediaVersion].join(DATA_SEPARATOR);
        const paramsHash = crypto.createHash('md5').update(params, 'ascii').digest('hex');
    
        // Make our message and pad it out
        const plainMessage = `${paramsHash}${DATA_SEPARATOR}${params}${DATA_SEPARATOR}`;
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

module.exports = SongAsset;
