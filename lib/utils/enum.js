
module.exports = {
    stringEnum: function(values) {
        let o = {}
        values.forEach(i => o[i] = i);
        return Object.freeze(o);
    }
}