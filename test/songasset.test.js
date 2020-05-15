const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const credentials = require('./temp/credentials');
const {SongAsset} = require('../index').content;

const song = credentials.testTrack.song;
const format = credentials.testTrack.format;
const fileSha256 = credentials.testTrack.sha256;

describe('SongAsset', function() {
    describe('::forLegacyUrl', function() {
        it('generates a media URL for a song and version', function() {
            const streamingAsset = SongAsset.forLegacyStream(song, format);
            assert.strictEqual(streamingAsset.url, credentials.testTrack.expectedUrl);
        });
    });

    describe('#getDecryptedStream', function() {
        it('downloads and decrypts a media URL', function(done) {
            // NOTE: you will have to open the downloaded file and hash it manually (or check it plays properly).
            this.timeout(0);
            const streamingAsset = SongAsset.forLegacyStream(song, format);
            const filePath = path.join(__dirname, 'temp', 'decrypted_stream.mp3');
            const fsStream = fs.createWriteStream(filePath, {emitClose: true});
            streamingAsset.getDecryptedStream().then((assetStream) => {
                assetStream.on('finish', () => {
                    done();
                });
                assetStream.pipe(fsStream);
            });
        });
    });
});