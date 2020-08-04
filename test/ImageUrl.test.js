const { ImageFormat, ImageUrl } = require('../lib/diezel').content;
const assert = require('assert');

const multiObject = {
    ART_PICTURE: 'artPicture',
    ALB_PICTURE: 'albPicture',
    PLAYLIST_PICTURE: 'playlistPicture',
};

describe('ImageUrl', function() {
    describe('#toString', function() {
        it('generates a URL string from defaults', function() {
            const instance = new ImageUrl();
            assert.strictEqual(instance.toString(), 'https://e-cdns-images.dzcdn.net/images/misc//100x100-000000-80-0-0.jpg');
        });

        it('generates a URL string with constructor and toString options', function() {
            const instance = new ImageUrl({format: ImageFormat.PNG, dimensions: {width: 500, height: 500}});
            assert.strictEqual(instance.toString({type: 'a', id: 'b'}), 'https://e-cdns-images.dzcdn.net/images/a/b/500x500-000000-80-0-0.png');
        })
    });

    describe('#forObject', function() {
        const tests = [
            {obj: Object.assign({__TYPE__: 'artist'}, multiObject), expected: 'https://e-cdns-images.dzcdn.net/images/artist/artPicture/100x100-000000-80-0-0.jpg'},
            {obj: Object.assign({__TYPE__: 'album'}, multiObject), expected: 'https://e-cdns-images.dzcdn.net/images/cover/albPicture/100x100-000000-80-0-0.jpg'},
            {obj: Object.assign({__TYPE__: 'playlist'}, multiObject), expected: 'https://e-cdns-images.dzcdn.net/images/playlist/playlistPicture/100x100-000000-80-0-0.jpg'},
            {obj: Object.assign({__TYPE__: 'playlist', PICTURE_TYPE: 'custom'}, multiObject), expected: 'https://e-cdns-images.dzcdn.net/images/custom/playlistPicture/100x100-000000-80-0-0.jpg'},
        ];
        tests.forEach((t) => {
            it(`generates a URL string for a ${t.obj.PICTURE_TYPE || 'normal'} ${t.obj.__TYPE__}`, function() {
                const instance = new ImageUrl().forObject(t.obj);
                assert.strictEqual(instance.toString(), t.expected);
            });
        });
    });
});