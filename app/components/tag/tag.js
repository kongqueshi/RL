/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
// @flow
import React, { Component } from 'react'
import { AutoComplete, Input, Tag as AntdTag } from 'antd'
import dbconfig from '../../constants/dbconfig'
import Sqlite3 from '../../utils/sqlite3'
import styles from './tag.css'


export default class Tag extends Component {
  constructor(props) {
    super(props)
    this.state = {
        allTags: {},
        selectedTags: [],
        unSelectedTags: []
    }

    this.db = new Sqlite3(dbconfig.PATH, null, () => {
        this.db.query('select * from tags', [], null, (rows) => {
            const allTags = {}
            const allTagNames = {}

            if (rows && rows.length) {
              rows.forEach(row => { allTags[row.id] = row; allTagNames[row.name] = row})
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
      const copiedAllTags = {...this.state.allTags}
      const selectedTags = []
      nextProps.selectedTagIds.forEach(id => {
        selectedTags.push(copiedAllTags[id])
        copiedAllTags.id = null
      })

      const unSelectedTags = Object.values(copiedAllTags)

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

  onSelect = (value) => {
    this.setState({
      selectedValue: value
    })
  }

  handleKeyDown = (e) => {
    if (e.key === 'Enter' && this.searchValue) {
      const { allTagNames, selectedTags, allTags } = this.state
      if (!allTagNames[this.searchValue]) {
        this.db.run(`insert into tags(name) values('${this.searchValue}')`)
        const newTag = {name:this.searchValue, id:1}
        selectedTags.push(newTag)
        allTags[newTag.id] = newTag
        allTagNames[this.searchValue] = newTag

        this.setState({
          selectedTags,
          allTagNames,
          allTags,
          selectedValue: null
        })
      }
      
      e.preventDefault()
    }
  }

  handleSearch = (value) => {
    this.searchValue = value
  }

  renderTags = (tags) => {
    const tagEles = []

    tags.forEach(tag => tagEles.push(<AntdTag key={tag.name}>{tag.name}</AntdTag>))

    return tagEles
  }

  render() {
    const { allTagNames, selectedValue, selectedTags, unSelectedTags } = this.state

    return (
      <div className={styles.tag}>
        <AutoComplete
            dataSource={Object.keys(allTagNames || {})}
            style={{ width: 200 }}
            onChange={(value) => this.setState({selectedValue: value})}
            onSelect={this.onSelect}
            onSearch={this.handleSearch}
            placeholder="查找或者新增标签"
            value={selectedValue}
          >
            <Input onKeyDown={(e) => this.handleKeyDown(e)} />
          </AutoComplete>
        <div className="selected">
          {this.renderTags(selectedTags)}
        </div>
        <div className="un-selected">
          {this.renderTags(unSelectedTags)}
        </div>
      </div>
    );
  }
}
