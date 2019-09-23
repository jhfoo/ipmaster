const fs = require('fs'),
    restify = require('restify'),
    api = restify.createServer(),
    static = restify.createServer(),
    {
        ConfigReader
    } = require('foobelt')

const Config = ConfigReader('./conf/config.js', process.env.NODE_ENV)
let isClosing = false

api.get('/service/stop', (req, res, next) => {
    if (!isClosing) {
        isClosing = true
        static.close(()=> {
            console.log('Static service closed')
        })
        api.close(()=> {
            console.log('API service closed')
        })
    }

    res.header('Connection','close')
    res.send(503, 'OK')
    next(false)
})

api.listen(Config.api.port, function () {
    console.log('API service %s listening at %s', api.name, api.url);
})

// static service
static.get('/*', restify.plugins.serveStatic({
    directory: Config.static.directory,
    default: Config.static.default
}))
static.listen(Config.static.port, function () {
    console.log('Static service %s listening at %s', static.name, static.url);
})