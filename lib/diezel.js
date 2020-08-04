/**
 * Entry point for library
 */

const keyStore = require('./key-store');

// Try setting the keys from a keys.json file
try {
    keyStore.setKeys(require('./keys.json'));
} catch (e) { }

module.exports = {
    version: require('../package.json').version,
    setKeys(keys) {
        keyStore.setKeys(keys);
    },

    clients: require('./clients'),
    content: require('./content'),
    errors: require('./errors'),
};
