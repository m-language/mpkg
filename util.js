module.exports = {
    timeDuration: fn => {
        let start = Date.now()
        fn();
        return Date.now() - start;
    }
};