const util = {
    paddedLength(data, multiple = 16) {
        const rem = data.length % multiple;
        if (rem > 0) { // If data isn't a multiple pad it out
            return data.length + (multiple - rem);
        } else { // Otherwise just return a buffer around the data
            return data.length;
        }
    },

    xorBytes(key, data, length) {
        const result = [];
        for (let i = 0; i < length; i++) {
            let c = key[i];
            for (let j = 0; j < data.length; j++) {
                c ^= data[j][i];
            }
            result.push(c);
        }
        return result;
    },

    stripPadding(data) {
        let startIndex = -1;
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i] !== 0) {
                startIndex = i;
                break;
            }
        }
        return data.slice(0, startIndex + 1);
    },

    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    },

    generateNonce(max) {
        const alphabet = "012345689abdef";
        let nonce = '';
        for (let i = 0; i < max; i++) {
            nonce += alphabet[util.getRandomInt(alphabet.length)];
        }
        return nonce;
    }
};

module.exports = util;
