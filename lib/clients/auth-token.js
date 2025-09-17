const axios = require('axios');
const { DiezelError } = require('../errors');

const AUTH_BASE_URL = 'https://auth.deezer.com';
const DEFAULT_QUERY = { i: 'p', jo: 'p', rto: 'p' };

const naiveGetJwtContents = (encodedToken) => {
    const components = encodedToken.split('.');
    if (components.length !== 3) throw new SyntaxError('Malformed JWT token: missing one or more sections');
    return JSON.parse(Buffer.from(components[1], 'base64').toString('utf-8'));
}

class AuthTokenError extends DiezelError {
    constructor(message) {
        super(message);
        this.name = 'AuthClientError';
    }
}

class AuthToken {
    #jwtToken;
    refreshToken;
    #decodedToken;

    constructor(jwtToken, refreshToken) {
        this.jwtToken = jwtToken;
        this.refreshToken = refreshToken;
    }

    get jwtToken() {
        return this.#jwtToken;
    }

    set jwtToken(newToken) {
        this.#jwtToken = newToken;
        if (newToken) {
            this.#decodedToken = naiveGetJwtContents(this.#jwtToken);
        }
    }

    get decodedToken() {
        return this.#decodedToken;
    }

    static async getAnonymousToken() {
        const resp = await axios.get(`${AUTH_BASE_URL}/login/anonymous`, { params: DEFAULT_QUERY });
        return new this(resp.data.jwt, undefined);
    }

    static async getTokenFromArl(arl) {
        const resp = await axios.post(`${AUTH_BASE_URL}/login/arl`, { arl }, { params: DEFAULT_QUERY });
        return new this(resp.data.jwt, resp.data.refresh_token);
    }

    get needsRefresh() {
        return (this.#decodedToken.exp * 1000) <= new Date();
    }

    get userId() {
        return this.#decodedToken.userId;
    }

    async refresh() {
        if (!this.refreshToken) throw new AuthTokenError('No refresh token present');
        const resp = await axios.post(
            `${AUTH_BASE_URL}/login/renew`,
            { refresh_token: this.refreshToken },
            { params: DEFAULT_QUERY }
        );
        this.jwtToken = resp.data.jwt;
        this.refreshToken = resp.data.refresh_token;
    }

    async ensure() {
        if (this.needsRefresh) await this.refresh();
        return this.jwtToken;
    }

    async logout() {
        if (!this.jwtToken) throw new AuthTokenError('No token present');
        await axios.post(
            `${AUTH_BASE_URL}/logout`,
            { jwt: this.jwtToken, refresh_token: this.refreshToken },
            { params: DEFAULT_QUERY }
        );
        this.#jwtToken = undefined;
        this.refreshToken = undefined;
        this.#decodedToken = undefined;
    }
}

module.exports = { AuthTokenError, AuthToken };
