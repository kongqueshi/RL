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
        allTagNames: {},
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
            }, () => this.buildTags(props.selectedTagIds))
        })
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedTagIds !== this.props.selectedTagIds) {
      this.buildTags(nextProps.selectedTagIds)
    }
  }

  componentWillUnmount() {
    if (this.db) {
      this.db.close()
    }
  }

  buildTags = (selectedTagIds) => {
    const copiedAllTags = Object.assign(this.state.allTags)
    const selectedTags = []
    selectedTagIds.forEach(id => {
      selectedTags.push(copiedAllTags[id])
      copiedAllTags.id = null
    })

    const unSelectedTags = Object.values(copiedAllTags)

    this.setState({
      selectedTags,
      unSelectedTags
    })
  }

  onSelect = (value) => {
    const { allTagNames, selectedTags } = this.state
    const selectedTag = allTagNames[value]

    let hasSelected = false
    selectedTags.forEach(tag => {if (tag.id === selectedTag.id) hasSelected = true;})

    if (!hasSelected) {
      this.selectTag(selectedTag)
    }

    this.setState({
      selectedValue: null
    })
  }

  handleKeyDown = (e) => {
    if (e.key === 'Enter' && this.searchValue) {
      const { allTagNames, selectedTags, allTags } = this.state
      if (!allTagNames[this.searchValue]) {
        this.db.insertSingle('tags', ['name'], [this.searchValue], undefined, (id) => {
          console.log(id)
          const newTag = {name:this.searchValue, id:id}
          selectedTags.push(newTag)
          allTags[newTag.id] = newTag
          allTagNames[this.searchValue] = newTag
  
          this.setState({
            selectedTags,
            allTagNames,
            allTags,
            selectedValue: null
          })
        })
      }
      
      e.preventDefault()
    }
  }

  handleSearch = (value) => {
    this.searchValue = value
  }

  handleTagClick = (tagId) => {
    const { allTags } = this.state
    this.selectTag(allTags[tagId])
  }

  selectTag = (tag) => {
    const { selectedTags, unSelectedTags } = this.state

    selectedTags.push(tag)
    
    let unSelectedTag
    for(let i = 0;i < unSelectedTags.length; i++) {
      unSelectedTag = unSelectedTags[i]
      if (unSelectedTag.id === tag.id) {
        unSelectedTags.splice(i, 1)
        break
      }
    }

    this.setState({
      selectedTags,
      unSelectedTags
    })
  }

  renderTags = (tags, isSelected) => {
    const tagEles = []
    const antdTag = 
    tags.forEach(tag => tagEles.push(
      <AntdTag
        key={tag.id}
        color={isSelected ? "#108ee9" : undefined}
        onClick={() => {!isSelected && this.handleTagClick(tag.id)}}
      >
          {tag.name}
      </AntdTag>))
    return tagEles
  }

  render() {
    const { allTagNames, selectedValue, selectedTags, unSelectedTags } = this.state

    return (
      <div className='tag'>
        <AutoComplete
            className='search-new-input'
            dataSource={Object.keys(allTagNames || {})}
            onChange={(value) => this.setState({selectedValue: value})}
            onSelect={this.onSelect}
            onSearch={this.handleSearch}
            placeholder="查找或者新增标签"
            value={selectedValue}
          >
            <Input onKeyDown={(e) => this.handleKeyDown(e)} />
          </AutoComplete>
        <div className="tag-div selected">
          <p>已选择标签</p>
          <div className='tag-content'>
            {this.renderTags(selectedTags, true)}
          </div>
        </div>
        <div className="tag-div un-selected">
          <p>未选择标签</p>
          <div className='tag-content'>
            {this.renderTags(unSelectedTags)}
          </div>
        </div>
      </div>
    );
  }
}
