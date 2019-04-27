// @flow
import * as React from 'react'
import dbconfig from '../constants/dbconfig'
import Sqlite3 from '../utils/sqlite3'
import HomePage from './HomePage'
import getHomePath from '../utils/home'
import fs from 'fs'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isDBOk: false
    }

    this.db
    this.initDb()
  }

  initDb = () => {
    const dbPath = `${getHomePath()}${dbconfig.NAME}`

    const updateDB = (version) => {
      const { CURRENT_VERSION, DB_UPDATE_SQLS } = dbconfig

      let needUpdate = false
      
      if (version < CURRENT_VERSION) {
        const { length } = DB_UPDATE_SQLS

        for (let i = 0; i < length; i++) {
          if (DB_UPDATE_SQLS[i].ID > version) {
            needUpdate = true
            const fun = (index) => {
              const sql = DB_UPDATE_SQLS[index].SQL
              this.db.run(sql, [], undefined, () => {
                index += 1
                if (index < length) {
                  fun(index)
                } else {
                  this.db.run(`update version set version=${CURRENT_VERSION}`, [], undefined, () => this.initDbFinish())
                }
              })
            }

            fun(i)

            break
          }
        }
      }

      if (!needUpdate) this.initDbFinish()
    }

    if (fs.existsSync(dbPath)) {
      this.db = new Sqlite3(dbPath)

      this.db.queryFirst('select version from version', [], 
        (err) => {
          if(err.message.indexOf(' no such table: version') >= 0) {
            updateDB(1)
          }
        }, (row) => {
          updateDB(row.version)}
        )
    } else {
      this.db = new Sqlite3(dbPath)
      updateDB(0)
    }
  }

  initDbFinish = () => {
    this.setState({
      isDBOk: true
    })
    this.db.close()
  }

  render() {
    const { isDBOk } = this.state
    return <React.Fragment>{isDBOk && <HomePage/>}</React.Fragment>
  }
}
