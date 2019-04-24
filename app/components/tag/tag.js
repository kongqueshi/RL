// @flow
import React, { Component } from 'react'
import { Select } from 'antd'
import dbconfig from '../../constants/dbconfig'
import Sqlite3 from '../../utils/sqlite3'
import styles from './tag.css'

const Option = Select.Option

type Props = {}

export default class Tag extends Component {
  constructor(props) {
    super(props)
    this.state = {
        allTags: []
    }

    this.db = new Sqlite3(dbconfig.PATH, null, () => {
        this.db.query('select * from tags', [], null, (rows) => {
            this.setState({
                allTags: rows
            })
        })
    })
  }

  componentWillReceiveProps(nextProps) {
  }

  componentWillMount() {
    if (this.db) {
      this.db.close()
    }
  }

  renderSelectChildren = (values) => {
    let children = []
    values.forEach(value => {
        children.push(<Option key={value.name}>{value.name}</Option>)
    })
    return children
  }

  render() {
    const { allTags } = this.state

    return (
      <div className={styles.tag}>
        <div className={styles.selected}>
        <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Tags Mode"
            // onChange={handleChange}
        >
            {this.renderSelectChildren(allTags)}
        </Select>
        </div>
        <div className={styles.unSelected}>

        </div>
      </div>
    );
  }
}
