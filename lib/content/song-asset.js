const stream = require('stream');

const axios = require('axios');

const AssetDecryptorTransform = require("../crypto/asset-decryptor-transform");
const {StateError} = require('../errors');

/**
 * Represents a streamable song.
 */
class SongAsset {
    isFull;
    isProtected;
    url;
    format;
    song;
    notBefore;
    expiry;

    constructor(streamInfo) {
        this.isFull = streamInfo.isFull;
        this.isProtected = streamInfo.isProtected;
        this.url = streamInfo.url;
        this.format = streamInfo.format;
        this.song = streamInfo.song;
        this.notBefore = streamInfo.notBefore;
        this.expiry = streamInfo.expiry;
    }

    /**
     * Creates a new stream decryption transformer for this SongAsset.
     * This is more suitable than `getDecryptedStream` if you want to have
     * access to the encrypted stream length.
     * @returns {stream.Transform} A stream transformer that decrypts the supplied stream.
     */
    createTransformer() {
        if (!this.isProtected) throw new StateError('Cannot create a decryptor transformer for this unprotected asset.');
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
        if (this.isProtected) {
            return resp.data.pipe(this.createTransformer());
        } else {
            return resp.data;
        }
    }
}

module.exports = SongAsset;
