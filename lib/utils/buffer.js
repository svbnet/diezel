module.exports = {
    paddedLength(data, multiple = 16) {
        const rem = data.length % multiple;
        if (rem > 0) { // If data isn't a multiple pad it out
            return data.length + (multiple - rem);
        } else { // Otherwise just return a buffer around the data
            return data.length;
        }
    }
};
