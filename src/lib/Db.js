const fs = require('fs'),
    path = require('path'),
    sqlite3 = require('sqlite3').verbose()

module.exports = {
    initDatabase: initDatabase,
    getSingleton: getSingleton
}

// singleton
var _singleton = null
var _db = null

function getSingleton() {
    if (!_db) {
        throw new Error('Databasse not initialised: call initDatabase() first')
    }
    return _db
}

function initDatabase(fname) {
    let FullFname = path.resolve(process.cwd(), fname)
    return new Promise((resolve, reject) => {
        if (fs.existsSync(FullFname)) {
            console.log('Opening database...')
            let db = new sqlite3.Database(FullFname, sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error(err)
                    reject(err)
                } else {
                    _db = db
                    resolve(db)
                }
            })
        } else {
            console.log('Creating database...')
            let db = new sqlite3.Database(FullFname, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    reject(err)
                } else {
                    _db = db
                    resolve(db)
                }
            })
        }
    })
}
