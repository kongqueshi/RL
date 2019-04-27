/* eslint-disable no-unused-expressions */
/* eslint-disable func-names */
import sqlite3 from 'sqlite3'

const s = sqlite3.verbose()

export default class Sqlite3 {
    constructor(dbPath, onError, onSuccess) {
        this.db = new s.Database(dbPath, err => this.handleErr(err, onError, onSuccess))
    }

    /**
     * 创建表
     *
     */
    createTable = (sql, ignoreTableExistError, onError, onSuccess) => {
        this.db.run(sql, [], err => this.handleErr(err, () => {
            if (err) {
                if (ignoreTableExistError && err.message.indexOf("already exists") >= 0) {
                    onSuccess && onSuccess()
                } else if (onError) onError(err)
                    else console.error(err.message)
            }
        }, onSuccess))
    }

    insertSingle = (tableName, keys, values, onError, onSuccess) => {
        const keyString = keys.map((key) => key).join(',')
        const placeholders = keys.map(() => '?').join(',')
        const sql = `INSERT INTO ${tableName}(${keyString}) VALUES(${placeholders})`
        const self = this
        this.db.run(sql, values, function(err) { self.handleErr(err, onError, onSuccess, this.lastID) })
    }

    update = (sql, onError, onSuccess) => {
        this.db.run(sql, [], (err) => this.handleErr(err, onError, onSuccess))
    }

    insertMutil = (tableName, keys, values, onError, onSuccess) => {
        const keyString = keys.map((key) => key).join(',')
        const placeholders = values.map(value => `(${value.map(() => '?').join(',')})`).join(',')
        const sql = `INSERT INTO ${tableName}(${keyString}) VALUES ${placeholders} `

        const finalValues = []
        values.forEach(value => value.forEach(v => finalValues.push(v)))

        this.db.run(sql, finalValues, (err) => this.handleErr(err, onError, onSuccess))
    }

    /**
     * 查询数据，返回查询到的所有数据
     */
    query = (sql, params, onError, onSuccess) => {
        this.db.all(sql, params || [], (err, rows) => this.handleErr(err, onError, onSuccess, rows))
    }

    /**
     * 查询第一条数据 如果有查询到数据则返回其第一行，没有则返回空
     */
    queryFirst = (sql, params, onError, onSuccess) => {
        this.db.get(sql, params || [], (err, row) => this.handleErr(err, onError, onSuccess, row))
    }

    /**
     * 查询数据，针对每条查询到的记录都会执行一次onSuccess的回调
     */
    queryEach = (sql, params, onError, onSuccess) => {
        this.db.each(sql, params || [], (err, row) => this.handleErr(err, onError, onSuccess, row))
    }

    run = (sql, params, onError, onSuccess) => {
        this.db.run(sql, params, err => this.handleErr(err, onError, onSuccess))
    }

    close = () => {
        if(this.db) 
            this.db.close(err => {
                if(err) console.error(err.message)
            })
    }

    handleErr = (err, onError, onSuccess, result) => {
        if (err) {
            if (onError) { onError(err) }
            else console.error(err.message)
        } else {
            onSuccess && onSuccess(result)
        }
    }
}