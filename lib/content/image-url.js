const ImageFormat = require('./image-format');

const MAX_SIZE = Object.freeze({width: 1500, height: 1500});
const BASE_URL = 'https://e-cdns-images.dzcdn.net/images';

const defaults = {
    baseUrl: BASE_URL,
    type: 'misc',
    id: '',
    dimensions: {width: 100, height: 100},
    backgroundColor: '000000',
    quality: 80,
    format: ImageFormat.JPEG,
};

class ImageUrl {
    static get MAX_SIZE() {
        return MAX_SIZE;
    }

    static get BASE_URL() {
        return BASE_URL;
    }

    constructor(options = {}) {
        for (let [key, value] of Object.entries(defaults)) {
            if (key in options) {
                this[key] = options[key];
            } else {
                this[key] = value;
            }
        }
    }

    forObject(object) {
        switch (object.__TYPE__) {
            case 'artist':
                this.type = 'artist';
                this.id = object.ART_PICTURE;
                break;
            
            case 'album':
                this.type = 'cover';
                this.id = object.ALB_PICTURE;
                break;
            
            case 'playlist':
                this.type = object.PICTURE_TYPE || 'playlist';
                this.id = object.PLAYLIST_PICTURE;
                break;
            
            default:
                this.type = 'misc';
                this.id = '';
                break;
        }
        return this;
    }

    toString(options = {}) {
        Object.keys(defaults).forEach((i) => {  
            if (i in options) {
                this[i] = options[i];
            }
        });
        return [
            this.baseUrl,
            this.type,
            this.id,
            `${this.dimensions.width}x${this.dimensions.height}-${this.backgroundColor}-${this.quality}-0-0.${this.format}`
        ].join('/');
    }
}

module.exports = ImageUrl;
