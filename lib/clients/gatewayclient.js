const axios = require('axios');

class GatewayError extends Error {
    #errors;

    constructor(message, gwErrors = {}) {
        super(message);
        this.#errors = gwErrors;
    }

    get errors() {
        return this.#errors;
    }
}

class GatewayClient {
    #baseUrl;

    constructor(baseUrl) {
        this.#baseUrl = baseUrl;
    }

    _setInstanceSearchParams(url, gatewayMethod, httpMethod) {
    }

    _getHeaders() {
    }

    async _callGatewayMethod(gatewayMethod, data = {}, httpMethod = 'post', extraSearchParams = {}) {
        // Build URL
        const url = new URL(this.#baseUrl);
        url.searchParams.set('method', gatewayMethod);
        this._setInstanceSearchParams(url, gatewayMethod, httpMethod);
        for (let [key, value] of Object.entries(extraSearchParams)) {
            url.searchParams.set(key, value);
        }

        // Make request
        const request = {
            method: httpMethod,
            url: url.toString(),
            headers: this._getHeaders()
        }
        if (httpMethod === 'post') {
            request.data = data;
        }

        const res = await axios(request);
        // GW-Light always returns 200...
        if (res.status !== 200) {
            throw new GatewayError(`GW returned non-success status code ${res.status}`);
        }

        const jsonResponse = res.data;
        // Will have errors if error property is an object
        if (jsonResponse.error && jsonResponse.error.constructor === Object) {
            let errorMessage = 'GW returned errors:';
            for (let [key, value] of Object.entries(jsonResponse.error)) {
                errorMessage += `\n\t${key}: ${value}`
            }
            throw new GatewayError(errorMessage, jsonResponse.error);
        } else {
            return jsonResponse.results;
        }
    }
}

module.exports = {GatewayClient, GatewayError};
