import sqlite3 from 'sqlite3'

let s = sqlite3.verbose();

export default class Sqlite3 {
    constructor(dbPath, onError, onSuccess) {
        this.db = new s.Database(dbPath, err => this._handleErr(err, onError, onSuccess))
    }

    /**
     * 创建表
     *
     */
    createTable = (sql, ignoreTableExistError, onError, onSuccess) => {
        this.db.run(sql, [], err => this._handleErr(err, (err) => {
            if (err) {
                if (ignoreTableExistError && err.message.indexOf("already exists") >= 0) {
                    onSuccess && onSuccess()
                } else {
                    if (onError) onError(err)
                    else console.error(err.message)
                }
            }
        }, onSuccess))
    }

    insertSingle = (tableName, keys, values, onError, onSuccess) => {
        let keyString = keys.map((key) => key).join(',')
        let placeholders = keys.map(() => '?').join(',')
        let sql = `INSERT INTO ${tableName}(${keyString}) VALUES(${placeholders})`

        this.db.run(sql, values, (err) => this._handleErr(err, onError, onSuccess, this.lastID))
    }

    insertMutil = (tableName, keys, values, onError, onSuccess) => {
        let keyString = keys.map((key) => key).join(',')
        let placeholders = values.map(value => `(${value.map(v => '?').join(',')})`).join(',')
        let sql = `INSERT INTO ${tableName}(${keyString}) VALUES ${placeholders} `

        let finalValues = []
        values.forEach(value => value.forEach(v => finalValues.push(v)))

        this.db.run(sql, finalValues, (err) => this._handleErr(err, onError, onSuccess))
    }

    /**
     * 查询数据，返回查询到的所有数据
     */
    query = (sql, params, onError, onSuccess) => {
        this.db.all(sql, params || [], (err, rows) => this._handleErr(err, onError, onSuccess, rows))
    }

    /**
     * 查询第一条数据 如果有查询到数据则返回其第一行，没有则返回空
     */
    queryFirst = (sql, params, onError, onSuccess) => {
        this.db.get(sql, params || [], (err, row) => this._handleErr(err, onError, onSuccess, row))
    }

    /**
     * 查询数据，针对每条查询到的记录都会执行一次onSuccess的回调
     */
    queryEach = (sql, params, onError, onSuccess) => {
        this.db.each(sql, params || [], (err, row) => this._handleErr(err, onError, onSuccess, row))
    }

    run = (sql, params, onError, onSuccess) => {
        this.db.run(sql, [], err => this._handleErr(err, onError, onSuccess))
    }

    close = () => {
        if(this.db) 
            this.db.close(err => {
                if(err) console.error(err.message)
            })
    }

    _handleErr = (err, onError, onSuccess, result) => {
        if (err) {
            if (onError) { onError(err) }
            else console.error(err.message)
        } else {
            onSuccess && onSuccess(result)
        }
    }
}