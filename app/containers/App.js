// @flow
import * as React from 'react'
import dbconfig from '../constants/dbconfig'
import Sqlite3 from '../utils/sqlite3'
import HomePage from './HomePage'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.initDb()
  }

  initDb = () => {
    let db = new Sqlite3(dbconfig.PATH)
    dbconfig.CREATE_TABLE_SQLS.forEach(sql => db.createTable(sql, true))
    dbconfig.CREATE_INDEX_SQLS.forEach(sql => db.run(sql))
    db.close()
  }

  render() {
    return <React.Fragment><HomePage/></React.Fragment>
  }
}
