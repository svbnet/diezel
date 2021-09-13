const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const credentials = require('./credentials');
const common = require('./common');
const { SongAsset, SongLegacyFormat } = require('../lib/diezel').content;
const { MobileClient } = require('../lib/diezel').clients;

describe('SongAsset', function() {
    const client = new MobileClient();
    let song;

    before(async function() {
        await client.signInWithEmail(credentials.mail, credentials.password);
        song = await client.getSong(common.testSong.id);
    });

    describe('#getDecryptedStream', function() {
        it('downloads and decrypts a media URL', function(done) {
            // NOTE: you will have to open the downloaded file and hash it manually (or check it plays properly).
            this.timeout(0);
            const streamingAsset = SongAsset.forLegacyStream(song, SongLegacyFormat.MP3_128);
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