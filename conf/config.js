module.exports = {
    api: {
        port: 8008
    },
    static: {
        port: 8000,
        directory: './public/dist',
        default: 'index.html'
    },
    consul: {
        BaseUrl: 'http://192.168.0.101:8500',
        SweepIntervalSec: 10 * 1000
    },
    addresses: {
        home: {
            start: '192.168.0.100',
            end: '192.168.0.120'
        },
        default: {
            start: '192.168.50.100',
            end: '192.168.50.150'
        }
    }
}