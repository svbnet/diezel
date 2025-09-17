
class DiezelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DiezelError';
    }
}

class MediaClientError extends DiezelError {
    constructor(message, serviceErrors) {
        super(message);
        this.serviceErrors = serviceErrors;
        this.name = 'MediaClientError';
    }
}

class StateError extends DiezelError {
    constructor(message) {
        super(message);
        this.name = 'StateError';
    }
}

class GatewayError extends DiezelError {
    #errors;

    constructor(message, gwErrors = {}) {
        super(message);
        this.name = 'GatewayErrors';
        this.#errors = Object.freeze(gwErrors);
    }

    get errors() {
        return this.#errors;
    }
}

module.exports = {DiezelError, StateError, MediaClientError, GatewayError};
