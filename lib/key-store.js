const KEY_STORE_KEYS = ['LEGACY_URL_KEY', 'TRACK_XOR_KEY', 'MOBILE_GW_KEY', 'MOBILE_API_KEY'];

const keyStoreObject = {};

KEY_STORE_KEYS.forEach((i) => {
    Object.defineProperty(keyStoreObject, i, {
        get() {
            throw new Error("Please set the keys before continuing. See the README for more details.");
        }
    })
});


module.exports = {
    get keys() {
        return keyStoreObject;
    },

    setKeys(value) {
        Object.assign(keyStoreObject, value);
    },
};
