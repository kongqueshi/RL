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
        allTags: {}
    }

    this.db = new Sqlite3(dbconfig.PATH, null, () => {
        this.db.query('select * from tags', [], null, (rows) => {
            let allTags = {}
            let allTagNames = []

            if (rows && rows.length) {
              rows.forEach(row => { allTags[row.id] = row; allTagNames.push(row)})
            }

            this.setState({
              allTags,
              allTagNames
            })
        })
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedTagIds !== this.props.selectedTagIds) {
      let copiedAllTags = {...this.state.allTags}
      let selectedTags = []
      nextProps.selectedTagIds.forEach(id => {
        selectedTags.push(copiedAllTags.id)
        copiedAllTags.id = null
      })

      let unSelectedTags = Object.values(copiedAllTags)

      this.setState({
        selectedTags,
        unSelectedTags
      })
    }
  }

  componentWillUnmount() {
    if (this.db) {
      this.db.close()
    }
  }

  handleChange = (value) => {
    const { onChange } = this.props
    const { allTagNames } = this.state

    if (allTagNames.indexOf(value) < 0) {
      console.log(value)
      this.db.run(`insert into tags(name) values('${value}')`, [])
    }
  }

  handlekeyDown = (e) => {
    console.log(e)
  }

  renderSelectChildren = (values) => {
    let children = []
    values.forEach(value => {
        children.push(<Option key={value.name}>{value.name}</Option>)
    })
    return children
  }

  renderTags = (tags) => {

  }

  render() {
    const { allTags } = this.state

    return (
      <div className={styles.tag}>
        <Select
              showSearch
              style={{ width: 200 }}
              placeholder="输入标签以搜索及添加"
              optionFilterProp="children"
              onChange={this.handleChange}
              onPressEnter={this.handlekeyDown}
          >
              {this.renderSelectChildren(Object.values(allTags))}
        </Select>
        <div className={styles.selected}>
        
        </div>
        <div className={styles.unSelected}>
          
        </div>
      </div>
    );
  }
}
