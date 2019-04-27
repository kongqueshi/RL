/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
// @flow
import React, { Component } from 'react'
import { AutoComplete, Tag as AntdTag } from 'antd'
import dbconfig from '../../constants/dbconfig'
import Sqlite3 from '../../utils/sqlite3'
import './tag.css'
import getHomePath from '../../utils/home';


export default class Tag extends Component {
  constructor(props) {
    super(props)
    this.state = {
        allTags: {},
        allTagNames: {},
        selectedTags: [],
        unSelectedTags: []
    }

    this.db = new Sqlite3(`${getHomePath()}${dbconfig.NAME}`, null, () => {
        this.db.query('select * from tags order by count desc', [], null, (rows) => {
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

  componentDidMount() {
    const { input } = this
    input.addEventListener('keydown', (e) => this.handleKeyDown(e), true)
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
    const copiedAllTags = {...this.state.allTags}
    const selectedTags = []
    selectedTagIds.forEach(id => {
      selectedTags.push(copiedAllTags[id])
      copiedAllTags[id] = null
    })

    const unSelectedTags = Object.values(copiedAllTags).filter(tag => !!tag)

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
      this.onTagChange(selectedTag)
    }

    this.searchValue = null
    this.setState({
      selectedValue: null,
      searchOpen: false
    })
  }

  handleKeyDown = (e) => {
    if (e.key === 'Enter' && this.searchValue) {
      this.setState({
        selectedValue: null,
        searchOpen: false
      })

      const value = this.searchValue
      this.searchValue = null

      const { allTagNames, allTags } = this.state
      if (!allTagNames[value]) {
        this.db.insertSingle('tags', ['name'], [value], undefined, (id) => {
          const newTag = {name: value, id}
          this.onTagChange(newTag)

          allTags[newTag.id] = newTag
          allTagNames[value] = newTag
  
          this.setState({
            allTagNames,
            allTags
          })
        })
      } else {
        this.onTagChange(allTagNames[value])
      }
      
      e.preventDefault()
      e.stopPropagation()
    }
  }

  handleSearch = (value) => {
    this.searchValue = value

    this.setState({
      searchOpen: true
    })
  }

  handleSelectTag = (tagId) => {
    const { allTags } = this.state
    this.onTagChange(allTags[tagId])
  }

  handleUnSelectTag = (tagId) => {
    const { allTags } = this.state
    this.onTagChange(allTags[tagId], true)
  }

  /**
   * 选择或者取消选择一个tag
   * 
   * @param {boolean} flag true 取消选择tag false 选择tag
   */
  onTagChange = (tag, flag) => {
    const { selectedTags, unSelectedTags } = this.state
    let removeFrom
    
    if (flag) {
      unSelectedTags.push(tag)
      removeFrom = selectedTags
    } else {
      selectedTags.push(tag)
      removeFrom = unSelectedTags
    }
    
    let tagToRemove
    for(let i = 0;i < removeFrom.length; i++) {
      tagToRemove = removeFrom[i]
      if (tagToRemove.id === tag.id) {
        removeFrom.splice(i, 1)
        break
      }
    }

    this.db.update(`update tags set count= count ${flag ? '-' : '+'} 1 where name='${tag.name}'`)

    this.setState({
      selectedTags,
      unSelectedTags
    })

    const { onChange } = this.props

    onChange && onChange(selectedTags)
  }

  renderTags = (tags, isSelected) => {
    const tagEles = []
    tags.forEach(tag => tagEles.push(
      <AntdTag
        key={tag.id}
        color={isSelected ? "#108ee9" : undefined}
        closable={isSelected}
        onClick={() => {!isSelected && this.handleSelectTag(tag.id)}}
        onClose={() => this.handleUnSelectTag(tag.id)}
      >
          {tag.name}
      </AntdTag>))
    return tagEles
  }

  render() {
    const { allTagNames, selectedValue, selectedTags, unSelectedTags, searchOpen } = this.state

    return (
      <div className='tag' {...this.props} ref={(input) => {this.input = input}}>
        <AutoComplete
            className='search-new-input'
            dataSource={Object.keys(allTagNames || {})}
            onBlur={() => this.setState({searchOpen: false})}
            onChange={(value) => this.setState({selectedValue: value})}
            onSelect={this.onSelect}
            onSearch={this.handleSearch}
            placeholder="查找或者新增标签"
            value={selectedValue}
            open={searchOpen}
          />
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
