module.exports = {
    setKeys(value) {
        Object.defineProperty(this, 'keys', {
            value: Object.freeze(value),
        });
    }
};
