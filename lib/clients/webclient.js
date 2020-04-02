const {GatewayClient} = require('./gatewayclient');

const DEFAULT_URLS = Object.freeze({
    'gwLightUrl': 'https://www.deezer.com/ajax/gw-light.php',
});

/**
 * The main class for interacting with Deezer.
 */
class WebClient extends GatewayClient {

    constructor(urls = DEFAULT_URLS) {
        super(urls.gwLightUrl);
        this._mediaUrl = null;
        this._csrfToken = null;
        this._playerLicenseToken = null;
    }

    _setInstanceSearchParams(url) {
        url.searchParams.set('input', '3');
        url.searchParams.set('api_version', '1.0');
        url.searchParams.set('api_token', this.csrfToken ? this.csrfToken : '');
        url.searchParams.set('cid', rand.getRandomInt().toString());
    }

    async getUserData() {
        const userData = await this._callGwLight('deezer.getUserData', {});
        this._csrfToken = userData.checkForm;
        this._playerLicenseToken = userData.USER.OPTIONS.license_token;
        this._mediaUrl = userData.URL_MEDIA;
        return userData;
    }


}

module.exports = {WebClient, WebClientError};
