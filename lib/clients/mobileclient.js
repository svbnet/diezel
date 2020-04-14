const crypto = require('crypto');

const {GatewayClient, GatewayError} = require('./gatewayclient');
const {MediaClient} = require('./mediaclient');

const mk = require('../crypto/MasterKeyProvider');
const {paddedLength, xorBytes, stripPadding} = require('../utils/buffer');

const random = require('../utils/random');
const {StateError} = require('../utils/errors');

const DEFAULTS = Object.freeze({
    baseUrl: 'https://api.deezer.com/1.0/gateway.php',
    userAgent: 'Deezer/6.1.22.49 (Android; 9; Tablet; us) innotek GmbH VirtualBox',
    lang: 'en',
    deviceInfo: {
        os: 'Android',
        name: 'VirtualBox',
        type: 'tablet',
        model: 'VirtualBox',
        platform: 'innotek GmbH_x86_64_9',
        serial: ''
    }
})

function createDecipher(key) {
    return crypto.createDecipheriv('aes-128-ecb', key, null).setAutoPadding(false);
}

function createCipher(key) {
    return crypto.createCipheriv('aes-128-ecb', key, null).setAutoPadding(false);
}

class KeyBag {
    #token;
    #tokenKey;
    #userKey;
    #streamKey;

    constructor(encrypted) {
        const keys = mk.keys;
        const decrypted = createDecipher(keys.MOBILE_GW_KEY).update(encrypted, 'hex').toString();
        this.#token = decrypted.substring(0, 64);
        this.#tokenKey = decrypted.substring(64, 80);
        this.#userKey = decrypted.substring(80, 96);
        this.#streamKey = decrypted.substring(96);
    }

    get gatewayToken() {
        return createCipher(this.#tokenKey).update(this.#token).toString('hex');
    }

    encryptParam(data) {
        const buf = Buffer.alloc(paddedLength(data));
        buf.write(data);
        return createCipher(this.#userKey).update(buf).toString('hex');
    }

}

function decryptLicense(encryptedLicense, description, serial) {
    const hDesc = crypto.createHash('md5').update(description, 'ascii').digest('hex');
    const hSerial = crypto.createHash('md5').update(serial, 'ascii').digest('hex');

    const textEncoder = new TextEncoder();
    const xorKey = textEncoder.encode(hDesc.substring(0, 16));
    const xorData = [
        textEncoder.encode(hDesc.substring(16, 32)),
        textEncoder.encode(hSerial.substring(0, 16)),
        textEncoder.encode(hSerial.substring(16, 32)),
    ];
    const decryptionKey = Uint8Array.from(xorBytes(xorKey, xorData, 16));
    const buf = stripPadding(createDecipher(decryptionKey).update(encryptedLicense, 'hex')).toString();
    return JSON.parse(buf);
}

/**
 * Implementation of a mobile client.
 */
class MobileClient extends GatewayClient {
    #keys;
    #sid;
    #userInfo;
    #userAgent;
    #lang;
    #deviceInfo;
    #license;
    #mediaClient;

    /**
     * Creates a new instance, optionally with saved user info and setup options.
     * @param {Object} userInfo An object containing at least an ARL and ID. 
     * @param {Object} setup An object containing setup data like the base URL and user agent. If you are passing a `userInfo` object this should be the same as when it was first passed.
     */
    constructor(userInfo = {}, setup = DEFAULTS) {
        super(setup.baseUrl);
        this.#keys = null;
        this.#sid = null;
        this.#userInfo = userInfo;
        this.#userAgent = setup.userAgent;
        this.#lang = setup.lang;
        this.#deviceInfo = setup.deviceInfo;
    }

    _getHeaders() {
        return {
            'User-Agent': this.#userAgent
        };
    }

    _setInstanceSearchParams(url, gatewayMethod, httpMethod) {
        url.searchParams.set('api_key', mk.keys.MOBILE_API_KEY);
        url.searchParams.set('output', '3');
        if (httpMethod === 'post') {
            url.searchParams.set('input', '3');
        }
        if (this.#sid) {
            url.searchParams.set('sid', this.#sid);
        }
    }

    _mergeDeviceParams(originalBody) {
        return Object.assign(originalBody, {            
            device_serial: this.#deviceInfo.serial,
            platform: this.#deviceInfo.platform,
            custo_version_id: '',
            custo_partner: '',
            model: this.#deviceInfo.model,
            device_name: this.#deviceInfo.name,
            device_os: this.#deviceInfo.os,
            device_type: this.#deviceInfo.type,
            google_play_services_availability: '1',
            consent_string: ''
        });
    }

    _updateUserInfo(result) {
        this.#userInfo = {
            arl: result.ARL,
            id: result.USER_ID,
            username: result.BLOG_NAME,
            email: result.EMAIL,
        };
        this.#license = decryptLicense(result.PREMIUM.RANDOM, result.DESCRIPTION, this.#deviceInfo.serial);
    }

    /**
     * Initializes the `keys` property. You shouldn't need to call this normally.
     */
    async initializeKeys() {
        // Get the token
        const uniqId = random.generateNonce(32);
        const mobileAuthResponse = await this._callGatewayMethod('mobile_auth', {}, 'get', {
            uniq_id: uniqId,
        });

        // Decrypt keys
        this.#keys = new KeyBag(mobileAuthResponse.TOKEN);

        // Get the SID
        const checkTokenResponse = await this._callGatewayMethod('api_checkToken', {}, 'get', {
            auth_token: this.#keys.gatewayToken,
        });
        this.#sid = checkTokenResponse;
    }

    async _ensureSid() {
        if (!this.sid) {
            await this.initializeKeys();
        }
    }

    async _callGatewaySidMethod(...args) {
        await this._ensureSid();
        return await this._callGatewayMethod.apply(this, args);
    }

    /**
     * Whether the user is signed in, either from constructing an instance with a `userInfo` structure or calling the `signInWithEmail` method.
     */
    get signedIn() {
        return this.#userInfo && this.#userInfo.id && this.#userInfo.arl;
    }

    /**
     * Gets the current user info.
     */
    get userInfo() {
        return this.#userInfo;
    }

    /**
     * Gets the current SID.
     */
    get sid() {
        return this.#sid;
    }

    get mediaClient() {
        if (!this.#mediaClient) {
            this.#mediaClient = new MediaClient(this.#license.LICENCE.OPTIONS.license_token, 'https://media.deezer.com');
        }
        return this.#mediaClient;
    }

    /**
     * Signs in with an email and password.
     * @param {String} email The user's email.
     * @param {String} password The user's password.
     * @returns {Boolean} True if sign in was successful, false if incorrect credentials were given.
     */
    async signInWithEmail(email, password) {
        await this._ensureSid();
        const encryptedPassword = this.#keys.encryptParam(password);
        const body = this._mergeDeviceParams({
            mail: email,
            password: encryptedPassword,
        });
        try {
            const userAuthResponse = await this._callGatewayMethod('mobile_userAuth', body);
            this._updateUserInfo(userAuthResponse);
            return true;
        } catch (e) {
            if (e instanceof GatewayError && 'USER_AUTH_ERROR' in e.errors) {
                return false;
            }
            throw e;
        }
    }

    /**
     * Restores a signed-in session.
     */
    async restoreSession() {
        if (!this.signedIn) {
            throw new StateError('Not signed in!');
        }
        const body = this._mergeDeviceParams({
            ARL: this.#userInfo.arl,
            ACCOUNT_ID: this.#userInfo.id,
        });
        const autoLogResponse = await this._callGatewaySidMethod('mobile_userAutoLog', body);
        this._updateUserInfo(autoLogResponse);
    }

    /**
     * Gets a song by ID.
     * @param {Number} id The song ID
     */
    async getSong(id) {
        return await this._callGatewaySidMethod('song_getData', {
            SNG_ID: id.toString(),
        });
    }

    /**
     * Gets a song's lyrics by song ID.
     * @param {Number} id The song ID
     */
    async getSongLyrics(id) {
        return await this._callGatewaySidMethod('song.getLyrics', {
            SNG_ID: id.toString(),
        });
    }

    /**
     * Gets an album and songs by ID.
     * @param {Number} id The album ID
     */
    async getAlbum(id) {
        return await this._callGatewaySidMethod('mobile.pageAlbum', {
            alb_id: id.toString(),
            user_id: this.#userInfo,
            lang: this.#lang,
            header: true,
            tab: 0,
        });
    }

    /**
     * Gets an artist's sections (info, top tracks, highlight track, discography, similar artists, playlists, featured in) by ID.
     * Available sections:
     *  MASTHEAD - bio_url (boolean), smartradio (boolean)
     *  TOP_TRACKS - count (number)
     *  HIGHLIGHT - to include, provide an empty array
     *  DISCOGRAPHY - count (number), mode (string enum: official | non_official)
     *  SIMILAR_ARTISTS - count (number)
     *  PLAYLISTS - count (number)
     *  FEATURED_IN - count (number)
     * @param {Number} id The artist ID
     * @param {Object} sections The sections you want
     */
    async getArtistSections(id, sections) {
        return await this._callGatewaySidMethod('mobile.pageArtistSections', {
            ART_ID: id.toString(),
            sections: sections,
        });
    }

    /**
     * Gets a playlist by ID.
     * @param {Number} id The playlist ID
     */
    async getPlaylistInfo(id) {
        return await this._callGatewaySidMethod('mobile.pagePlaylist', {
            playlist_id: id.toString(),
        });
    }

    /**
     * Gets the songs of a playlist by ID.
     * @param {Number} id The playlist ID
     * @param {Number} start The start position. Default: 0
     * @param {Number} count The amount of items to return. Default: 0
     */
    async getPlaylistSongs(id, start = 0, count = 500) {
        // Rationale: iOS app does it like this, so **shrug**
        return await this._callGatewaySidMethod('playlist.getSongs', {
            playlist_id: id.toString(),
            start: start.toString(),
            nb: count.toString(),
        });
    }

    /**
     * Gets search suggestions filtered by one or more types.
     * @param {String} query The search query
     * @param {Array} types One or more of ALBUM, ARTIST, TRACK, PLAYLIST, RADIO, SHOW, USER, LIVESTREAM, CHANNEL, EPISODE
     * @param {Number} count How many results to return
     */
    async getSearchSuggestions(query, types = [], count = 3) {
        return await this._callGatewaySidMethod('mobile_suggest', {
            NB: count.toString(),
            TYPES: types,
            QUERY: query,
        });
    }

    /**
     * Gets search results for one type.
     * @param {String} query The search query
     * @param {String} type The type to filter by
     * @param {Number} start Start position. Default: 0
     * @param {Number} count The number of items to return. Default: 50
     */
    async getSearchResults(query, type, start = 0, count = 50) {
        return await this._callGatewaySidMethod('search_music', {
            FILTER: type,
            NB: count.toString(),
            START: start,
            QUERY: query,
            OUTPUT: type,
        });
    }

    /**
     * Gets a user's favorited albums.
     * @param {Number} userId The user's ID
     * @param {Number} count The number of items to return. Default: 1000
     */
    async getFavoriteAlbums(userId, count = 1000) {
        return await this._callGatewaySidMethod('album.getFavorites', {
            user_id: userId.toString(),
            NB: count.toString(),
        });
    }

    /**
     * Gets a user's favorited artists.
     * @param {Number} userId The user's ID
     * @param {Number} count The number of items to return. Default: 1000
     */
    async getFavoriteArtists(userId, count = 1000) {
        return await this._callGatewaySidMethod('artist.getFavorites', {
            user_id: userId.toString(),
            NB: count.toString(),
        });
    }

    /**
     * Gets a user's favourited playlists.
     * @param {Number} userId The user's ID
     * @param {Number} count The number of items to return. Default: 1000
     */
    async getFavoritePlaylists(userId, count = 1000) {
        const arrayDefault = ["PLAYLIST_ID", "TITLE", "PICTURE_TYPE", "PARENT_USERNAME", "PARENT_USER_ID", "PARENT_USER_PICTURE", "PLAYLIST_PICTURE", "DATE_ADD", "DATE_MOD", "DATE_CREATE", "DATE_FAVORITE", "UNSEEN_TRACK_COUNT", "TYPE", "NB_SONG", "PLAYLIST_LINKED_ARTIST", "HAS_ARTIST_LINKED"];
        return await this._callGatewaySidMethod('playlist.getFavorites', {
            user_id: userId.toString(),
            nb: count.toString(),
            ARRAY_DEFAULT: arrayDefault,
        });
    }

    /**
     * Gets all playlists created by a user. This method will also return the 
     * "favorite tracks" playlist if you provide the current user's ID. To get 
     * the favorite tracks playlist, find the playlist where property TYPE === 4.
     * @param {Number} userId The user's ID
     * @param {Number} count The number of items to return. Default: 1000
     */
    async getUserPlaylists(userId, count = 1000) {
        const arrayDefault = ["PLAYLIST_ID", "TITLE", "PICTURE_TYPE", "PLAYLIST_PICTURE", "STATUS", "TYPE", "DATE_CREATE", "DATE_ADD", "DATE_MOD", "NB_SONG"];
        return await this._callGatewaySidMethod('playlist.getList', {
            user_id: userId.toString(),
            nb: count.toString(),
            ARRAY_DEFAULT: arrayDefault,
        });
    }

}

module.exports = {MobileClient};
