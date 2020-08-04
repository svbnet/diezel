
module.exports = {
    get ImageFormat() {
        return require('./image-format');
    },

    get ImageUrl() {
        return require('./image-url');
    },

    get SongAsset() {
        return require('./song-asset');
    },

    get SongLegacyFormat() {
        return require('./song-legacy-format');
    },
};
