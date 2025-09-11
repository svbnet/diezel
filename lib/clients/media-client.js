const axios = require('axios');

const SongAsset = require('../content/song-asset');
const { MediaClientError } = require('../errors');

class MediaClient {

    constructor(licenseToken, mediaUrl) {
        this._licenseToken = licenseToken;
        this._baseUrl = mediaUrl;
    }

    /**
     * Gets one or more @see SongAsset streams, according to the requested formats.
     * 
     * @param {object[]} songs An array or song objects with at least the SNG_ID and TRACK_TOKEN property.
     * @param {string[]} formats One or more requested format for the asset stream, one of "AAC_64", "AAC_96", "FLAC",
     *                           "MP3_MISC", "MP3_32", "MP3_64", "MP3_128", "MP3_192", "MP3_256", "MP3_320", "SBC_256".
     *                           Note that if no formats can be found, an error will be returned.
     * @param {object} options Additional options:
     *  `type`: Either "FULL" or "PREVIEW" (default: "FULL"). If "PREVIEW", then `cipher` must be "NONE".
     *  `cipher`: Either "BF_CBC_STRIPE" or "NONE" (default: "BF_CBC_STRIPE").
     *  `firstUrlOnly`: `boolean` (default: `true`). If true, then each returned song ID corresponds to an array of URLs.
     * @return {object} An `object` with the keys as each given song ID and the values as the retrieved `SongAsset`.
     */
    async getSongStreams(songs, formats, options = undefined) {
        if (songs.length === 0) throw new RangeError('Must have at least one song.');
        if (formats.length === 0) throw new RangeError('Must have at least one format.');
        const currentOptions = {
            type: 'FULL',
            cipher: 'BF_CBC_STRIPE',
            firstUrlOnly: true,
            ...options,
        };
        const body = {
            license_token: this._licenseToken,
            track_tokens: songs.map((s) => (s.TRACK_TOKEN)),
            media: [{
                type: currentOptions.type,
                formats: formats.map((f) => ({ cipher: currentOptions.cipher, format: f }))
            }]
        };
        const resp = await this.getUrl(body);

        const assets = {};
        resp.map((obj) => obj.media[0]).forEach((mediaResp, index) => {
            if (mediaResp.sources.length === 0) return;

            const origSong = songs[index];
            const baseData = {
                isFull: mediaResp.media_type === 'FULL',
                isProtected: mediaResp.cipher.type !== 'NONE',
                song: origSong,
                format: mediaResp.format,
                notBefore: new Date(mediaResp.nbf * 1000),
                expiry: new Date(mediaResp.exp * 1000),
            }
            if (currentOptions.firstUrlOnly) {
                assets[origSong.SNG_ID] = new SongAsset({ url: mediaResp.sources[0].url, ...baseData });
            } else {
                assets[origSong.SNG_ID] = mediaResp.sources.map((src) => (new SongAsset({ url: src.url, ...baseData })));
            }
        });
        return assets;
    }

    async getUrl(body) {
        const url = `${this._baseUrl}/v1/get_url`;
        const res = await axios({ method: 'post', url, data: body, validateStatus: () => (true), });

        // Media service is more restful, so we can check the status code instead
        if (res.status !== 200) {
            let message = `Media API returned non-success status code ${res.status}`
            if (res.data && res.data.errors) {
                message += ' with errors:'
                res.data.errors.forEach(i => message += `\n\t${i.code}: ${i.message}`);
            }
            throw new MediaClientError(message, res.data || res.data.errors);
        }

        return res.data.data;
    }
}

module.exports = MediaClient;
