const axios = require('axios');
const en = require('../internal/enum');

const Cipher = en.stringEnum(["BF_CBC_STRIPE", "NONE"]);
const Format = en.stringEnum(["AAC_64", "AAC_96", "FLAC", "MP3_MISC", "MP3_32", "MP3_64", "MP3_128", "MP3_192", "MP3_256", "MP3_320", "SBC_256"]);

class MediaClientError extends Error {
    constructor(message, serviceErrors) {
        super(message);
        this.serviceErrors = serviceErrors;
        this.name = 'MediaClientError';
    }
}

class MediaClient {

    constructor(playerTokenInfo, mediaUrl, mediaApiVersion = 1) {
        this._playerTokenInfo = playerTokenInfo;
        this._baseUrl = mediaUrl;
        this._mediaApiVersion = mediaApiVersion;
    }

    async getMediaStreamInfo(song, format, cipher = Cipher.BF_CBC_STRIPE) {
        const body = {
            license_token: this._playerTokenInfo.token,
            track_tokens: [song.TRACK_TOKEN],
            media: {
                // Always want a full stream ;)
                type: "FULL",
                formats: [
                    {
                        cipher: cipher,
                        format: format
                    }
                ]
            }
        }
        return await this._callGetMediaUrl(body);
    }

    async _callGetMediaUrl(body) {
        const url = `${this._baseUrl}/v${this._mediaApiVersion}/get_url`;
        const res = await axios.post(url, body);

        // Media service is more restful, so we can check the status code instead
        if (res.status !== 200) {
            let message = `Media API returned non-success status code ${res.status}`
            if (res.data && res.data.errors) {
                message += ' with errors:'
                res.data.errors.forEach(i => message += `\n\t${i.code} ${i.message}`);
            }
            throw new MediaClientError(message, res.data || res.data.errors);
        }

        return res.data.data;
    }
}

module.exports = {MediaClient, MediaClientError, Cipher, Format};
