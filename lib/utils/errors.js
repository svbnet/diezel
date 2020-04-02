
class StateError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StateError';
    }
}

module.exports = {StateError};
