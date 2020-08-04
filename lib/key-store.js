
module.exports = {
    get keys() {
        throw new Error("Please set the keys before continuing. See the README for more details.");
    },

    setKeys(value) {
        Object.defineProperty(this, 'keys', {
            value: Object.freeze(value),
        });
    }
};
