module.exports = {
    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    },

    generateNonce(max) {
        const alphabet = "012345689abdef";
        let nonce = '';
        for (let i = 0; i < max; i++) {
            nonce += alphabet[this.getRandomInt(alphabet.length)];
        }
        return nonce;
    }
};
