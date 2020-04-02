const MasterKeyProvider = require('./lib/crypto/MasterKeyProvider');
// Try setting the keys from a keys.json file
try {
    MasterKeyProvider.setKeys(require('./keys.json'));
} catch (e) { }

const {MobileClient} = require('./lib/clients/mobileclient');
const {SongAsset, LegacyFormat} = require('./lib/content/SongAsset');
const {ImageUrl, ImageFormat} = require('./lib/content/ImageUrl');

module.exports = {
    clients: {
        MobileClient,
    },
    content: {
        SongAsset,
        LegacyFormat,
        ImageUrl,
        ImageFormat,
    },
    setKeys: MasterKeyProvider.setKeys,
};
