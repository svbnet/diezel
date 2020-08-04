
module.exports = {
    get MediaClient() { 
        return require('./media-client');
    },

    get MobileClient() { 
        return require('./mobile-client');
    },
    
    get WebClient() { 
        return require('./web-client');
    },
};
