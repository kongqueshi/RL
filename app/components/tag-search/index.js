import React, { Component } from 'react'
import { Modal, Tag as AntdTag } from 'antd'
import dbconfig from '../../constants/dbconfig'
import Sqlite3 from '../../utils/sqlite3'
import getHomePath from '../../utils/home'


export default class TagSearchModal extends Component {
  constructor(props) {
      super(props)

      this.state = {
          selectedTags: [],
          unSelectedTags: []
      }

      this.db = new Sqlite3(`${getHomePath()}${dbconfig.NAME}`, null, () => {
          this.db.query('select * from tags order by count desc', [], null, (rows) => {
              const unSelectedTags = []
  
              if (rows && rows.length) {
                rows.forEach(row => unSelectedTags.push(row))
              }
  
              this.setState({
                unSelectedTags,
              })
          })
      })
  }

  componentWillUnmount() {
    if (this.db) {
      this.db.close()
    }
  }

  handleTagSelectStateChange = ( tag, isSelected ) => {
    const { selectedTags, unSelectedTags } = this.state

    const remove = (tag, source = []) => {
        const index = source.findIndex(it => it.id === tag.id)
        if (index >= 0) {
            source.splice(index, 1)
        }
    }

    if (isSelected) {
        remove(tag, unSelectedTags)
        selectedTags.push(tag)
    } else {
        remove(tag, selectedTags)
        unSelectedTags.push(tag)
    }

    this.setState({
        selectedTags,
        unSelectedTags
    })
  }

  renderTag = (tags = [], isSelected) => {
    const tagEles = []
    tags.forEach(tag => tagEles.push(
      <AntdTag
        key={tag.id}
        color={isSelected ? "#108ee9" : undefined}
        closable={isSelected}
        onClick={() => {!isSelected && this.handleTagSelectStateChange(tag, true)}}
        onClose={() => this.handleTagSelectStateChange(tag, false)}
      >
          {tag.name}
      </AntdTag>))
    return tagEles
  }

  render() {
      const { visible, onOk, onCancel } = this.props
      const { selectedTags, unSelectedTags } = this.state

      return (
            <Modal
                visible={visible}
                onOk={() => onOk(selectedTags)}
                onCancel={onCancel}
                okText="确定"
                cancelText="取消"       
            >
            <div>
                <span>已选择</span>
                <div>
                    {this.renderTag(selectedTags, true)}
                </div>
                
            </div>

            <div>
                <span>未选择</span>
                <div>
                    {this.renderTag(unSelectedTags, false)}
                </div>
                
            </div>
              
            </Modal>
    )
      
  }
}
