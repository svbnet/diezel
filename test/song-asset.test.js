const path = require('path');
const fs = require('fs');

const credentials = require('./credentials');
const common = require('./common');
const { MobileClient } = require('../lib/diezel').clients;

describe('SongAsset', function() {
    this.timeout(30000);
    const client = new MobileClient();
    let song;

    before(async function() {
        await client.signInWithEmail(credentials.mail, credentials.password);
        song = await client.getSong(common.testSong.id);
    });

    describe('#getDecryptedStream', function() {
        it('downloads and decrypts a media URL', function(done) {
            // NOTE: you will have to open the downloaded file and hash it manually (or check it plays properly).
            
            client.mediaClient.getSongStreams([song], ['MP3_128']).then((resp) => {
                const streamingAsset = resp[song.SNG_ID];

                const filePath = path.join(__dirname, 'temp', 'decrypted_stream.mp3');
                const fsStream = fs.createWriteStream(filePath, {emitClose: true});
                streamingAsset.getDecryptedStream().then((assetStream) => {
                    assetStream.on('finish', () => {
                        done();
                    });
                    assetStream.on('error', (err) => { done(err) });
                    assetStream.pipe(fsStream);
                }).catch((err) => { done(err); });
            }).catch((err) => { done(err); });
        });
    });
});