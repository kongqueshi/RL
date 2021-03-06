/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/mouse-events-have-key-events */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
// @flow
import React, { Component } from 'react'
import { notification, Icon, Modal, Tag as AntdTag } from 'antd'
import fs from 'fs'
import Crawer from '../plugins/crowers/crawer'
import Sqlite3 from '../utils/sqlite3'
import { hash } from '../utils/hash'
import filteFile from '../utils/filefilter'
import dbconfig from '../constants/dbconfig'
import filetypies from '../constants/filetypies'
import Tag from '../components/tag/tag'
import './HomePage.css'
import getHomePath from '../utils/home'
import ImageFlow from '../components/imageflow/imageFlow'
import ImageView from '../components/image-view'
import TagSearchModal from '../components/tag-search'
import commandline from 'node-cmd'

const localElectron = require('electron')

const electron = localElectron.remote.require('electron')
const { Menu, BrowserWindow } = electron

const BASE_PATH = 'f:/huaban/'

export default class HomePage extends Component {
  constructor() {
    super()
    this.state = {
      url: 'file://f:/huaban/20170815b07.jpg',
      imageWidth: '100%',
      imageHeight: 'auto',
      showControl: false,
      tagIds: [],
      tagPanelWidth: 20,
      tagPanelOpacity: 0
    }

    const homePath = getHomePath()
    const [browserWindow] = BrowserWindow.getAllWindows()
    this.browserWindow = browserWindow

    let config = {}
    try {
      const configString = fs.readFileSync(`${homePath}config.json`, 'utf-8')
      config = JSON.parse(configString) || {}
    } catch (e) { console.log(e) }

    this.playMode = config.playMode || 'random'
    this.playSpeed = config.playSpeed || 1500
    this.onTop = config.onTop || false
    this.opacity = config.opacity || 1
    this.state.pause = config.pause || false

    this.history = []
    this.historyIndex = 0

    // browserWindow.webContents.openDevTools()

    window.onbeforeunload = () => {
      if (this.configSaved) {
        return true
      }

      config = {
        playMode: this.playMode,
        playSpeed: this.playSpeed,
        pause: this.state.pause,
        onTop: this.onTop,
        opacity: this.opacity
      }

      fs.writeFile(`${homePath}config.json`, JSON.stringify(config), 'utf8', (e) => {
        if (e) {
          console.error(e)
        } else {
          this.configSaved = true
          this.browserWindow.destroy()
        }
      })

      return false
    }

    this.db = new Sqlite3(`${homePath}${dbconfig.NAME}`)
  }

  componentDidMount() {
    this.app.addEventListener('mousemove', () => {
      this.resetControlTimer()
      this.setState({ showControl: true })
    })

    this.loadFiles()

    const template = [
      {
        label: '文件',
        submenu: [
          { label: '打开当前图片', click: () => commandline.run(this.state.image.path) }
        ]
      },
      {
        label: '播放控制',
        submenu: [
          { label: '随机播放', click: () => { this.playMode = 'random' } },
          { label: '顺序播放', click: () => { this.playMode = 'normal' } },
          { label: '按标签播放', click: () => { this.setState({ searchByTagModalVisible: true }) } },
          { label: '按文件夹显示', click: this.loadFiles },
          { label: '加快播放', click: () => this.changePlaySpeed(-200), accelerator: 'Up' },
          { label: '减速播放', click: () => this.changePlaySpeed(200), accelerator: 'Down' },
          { label: '下一个', click: () => this.nextImage(true), accelerator: 'Right' },
          { label: '上一个', click: () => this.preImage(true), accelerator: 'Left' },
          { label: '暂停/开始 播放', click: () => { this.setState({ pause: !this.state.pause }) }, accelerator: 'Space' },
          { label: '删除', click: () => this.delete(), accelerator: 'Delete' },
          { label: '全屏', click: () => this.browserWindow.setFullScreen(true), accelerator: 'Enter' },
          { label: '退出全屏', click: () => this.browserWindow.setFullScreen(false), accelerator: 'Esc' },
          { label: '置顶', click: () => { this.onTop = !this.onTop; this.browserWindow.setAlwaysOnTop(this.onTop) }, accelerator: 'ctrl+T' },
          { label: '增加透明度', click: () => { this.opacity = this.opacity + 0.1 > 1 ? 1 : this.opacity + 0.1; this.browserWindow.setOpacity(this.opacity) }, accelerator: 'ctrl+Up' },
          { label: '减小透明度', click: () => { this.opacity = this.opacity - 0.1 < 0 ? 0 : this.opacity - 0.1; this.browserWindow.setOpacity(this.opacity) }, accelerator: 'ctrl+Down' }
        ]
      },
      {
        label: '视图',
        submenu: [
          {
            label: '浏览模式', submenu: [
              {
                label: '幻灯片',
                click: () => this.setState({ viewMode: 'single' })
              },
              {
                label: '瀑布流',
                click: () => this.setState({ viewMode: 'list', pause: true })
              }
            ]
          }
        ]
      },
      {
        label: '爬虫',
        submenu: [
          { label: '花瓣', click: () => this.showCrawerModal('huaban') }
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  loadFiles = () => {
    filteFile(BASE_PATH, filetypies.TYPIES.IMAGE, (err, files) => {
      if (err) {
        console.error(err)
      } else {
        this.files = files.map(file => { return { name: file, url: `file://${BASE_PATH}${file}`, path: `${BASE_PATH}${file}` } })
        this.setState({ files: this.files })
        this.timer = setInterval(this.nextImage, this.playSpeed)
      }
    })
  }

  searchByTags = (tags) => {
    const tagIds = tags.map(tag => tag.id).join(',')
    this.db.query(`SELECT * FROM tag_images WHERE tag_id in (${tagIds})`, [], null, rows => {
      let imageIds = []
      rows && rows.forEach(row => {
        const { image_ids } = row
        imageIds = imageIds.concat(image_ids.split(','))
      })

      imageIds = [...new Set(imageIds)]
      const finalImageIds = imageIds.join(',')
      this.db.query(`SELECT * FROM images WHERE id in (${finalImageIds})`, [], null, rows => {
        this.files = rows.map(row => { return { name: row.name, url: `file://${BASE_PATH}${row.name}`, path: `${BASE_PATH}${row.name}` } })
        this.setState({ files: this.files, searchByTagModalVisible: false }, () => this.nextImage(true))
      })
    })
  }
 
  changePlaySpeed = (step) => {
    let playSpeed = this.playSpeed + step
    playSpeed = playSpeed < 200 ? 200 : playSpeed

    this.resetTimer(playSpeed)
    this.showNotification(`当前播放速度${playSpeed / 1000}秒`)
  }

  resetControlTimer = () => {
    clearTimeout(this.hideControlTimer)
    this.hideControlTimer = setTimeout(() => this.setState({ showControl: false }), 3000)
  }

  resetTimer = (playSpeed) => {
    clearTimeout(this.timer)

    this.playSpeed = playSpeed || this.playSpeed
    this.timer = setInterval(this.nextImage, this.playSpeed)
  }

  nextImage = (force) => {
    if (!force && this.state.tagPanelVisible) return

    const { length } = this.files
    if (this.files && length && (!this.state.pause || force)) {
      let nextIndex

      if (this.history.length > 0 && this.historyIndex < this.history.length) {
        nextIndex = this.history[this.historyIndex + 1]
      } else {
        if (this.playMode === 'normal') {
          nextIndex = (this.index || 0) + 1
          if (nextIndex >= length) nextIndex = 0
        } else {
          nextIndex = parseInt(Math.random() * length, 10)
        }

        this.history.push(nextIndex)
      }

      this.index = nextIndex
      this.historyIndex += 1

      if (!this.files[nextIndex]) {
        this.nextImage(true)
        return
      }

      this.updateImageState(this.files[nextIndex], force)
    }
  }

  preImage = (force) => {
    if (!force && this.state.tagPanelVisible) return

    let historyIndex = this.historyIndex - 1
    if (historyIndex > this.history.length - 1) historyIndex = this.history.length - 2

    if (historyIndex >= 0) {
      this.index = this.history[historyIndex]
      this.historyIndex = historyIndex
      this.resetTimer(this.playSpeed)

      if (!this.files[this.index]) {
        this.preImage()
      } else {
        this.updateImageState(this.files[this.index])
      }
    }
  }

  delete = () => {
    const { index } = this.index
    const file = this.files[index]

    fs.unlink(BASE_PATH + file, (err) => {
      if (err) throw err
      this.files[index] = undefined
      this.nextImage(true)
    })
  }

  showCrawerModal = (type) => {
    this.setState({
      crawerModalVisible: true,
      crawerType: type
    })
  }

  showNotification = (message, description) => {
    notification.open({
      message,
      description
    })
  }

  setTagPanelVisible = (visible) => {
    this.setState({
      tagPanelWidth: visible ? 200 : 20,
      tagPanelOpacity: visible ? 1 : 0,
      tagPanelVisible: visible
    })
  }

  /**
   * @param {boolean} flag true 取消选择tag false 选择tag
   */
  onTagChange = (selectedTags, flag, tag) => {
    if (selectedTags) {
      const { image: { name } } = this.state
      const tagIds = selectedTags.map(tag => tag.id).join(',')
      this.db.update(`UPDATE images SET tagIds='${tagIds}' WHERE name='${name}'`)

      this.db.queryFirst(`SELECT * FROM images WHERE name='${name}'`, [], null, row => {
        if (row) {
          const { id } = row

          this.db.queryFirst(`SELECT * FROM tag_images WHERE tag_id=${tag.id}`, [], null, r => {
            if (r) {
              let { image_ids } = r

              if (!flag) {
                if (image_ids) {
                  image_ids += ',' + id
                } else {
                  image_ids = id
                }
              } else {
                const ids = (image_ids || '').split(',')
                const index = ids.findIndex(it => parseInt(it) === id)
                if (index >= 0) {
                  ids.splice(index, 1)
                }
                image_ids = ids.join(',')
              }

              this.db.update(`UPDATE tag_images SET image_ids='${image_ids}' WHERE tag_id='${tag.id}'`)
            } else {
              if (!flag) {
                this.db.insertSingle('tag_images', ['tag_id', 'image_ids'], [tag.id, id])
              }
            }
          })
        }
      })
    }
  }

  updateImageState = (file, force) => {
    const {name, url} = file
    this.db.queryFirst(`select * from images where name='${name}'`, [], null, (row) => {
      let tagIds

      if (row) {
        tagIds = row.tagIds ? row.tagIds.split(',').map(tag => Number(tag)) : []
      } else {
        hash(BASE_PATH + name).then(
          (value) => this.db.insertSingle('images', ['name', 'hash', 'path'], [name, value, BASE_PATH])
        ).catch(reason => console.error(reason))

        tagIds = []
      }

      const img = new Image()

      img.onload = () => {
        const { app } = this
        const { width, height } = img
        const { clientWidth, clientHeight } = app

        if (parseFloat(width) / clientWidth < parseFloat(height) / clientHeight) {
          this.setState({
            imageWidth: 'auto',
            imageHeight: '100%'
          })
        } else {
          this.setState({
            imageWidth: '100%',
            imageHeight: 'auto'
          })
        }

        this.setState({
          image: file,
          url,
          tagIds
        })

        if (force) { this.resetTimer() }
      }

      img.src = url
    })
  }

  handleImageClick = img => {
    this.setState({
      url: img.url,
      visible: true
    })
  }

  handleImageClose = () => {
    this.setState({
      visible: false
    })
  }

  render() {
    const { viewMode, url, pause, showControl, crawerModalVisible, crawerType, tagIds, tagPanelWidth, tagPanelOpacity, imageWidth, imageHeight, files, visible, searchByTagModalVisible  } = this.state

    return (
      <div style={{ backgroundImage: `url(${url})` }} className="App" ref={(app) => { this.app = app }}>
        {viewMode === 'list' ?
          (files && files.length && <ImageFlow images={files} onImageClick={(img) => this.handleImageClick(img)} />)
          :
          <React.Fragment>
            {showControl &&
              <div className='control'>
                <div className='pre' onClick={() => { this.preImage(true); this.resetControlTimer() }}>
                  <Icon type="double-left" />
                </div>

                <div className='play-switch' onClick={() => { this.setState({ pause: !pause }); this.resetControlTimer() }}>
                  <Icon type={pause ? 'play-circle' : "pause-circle"} />
                </div>

                <div className='next' onClick={() => { this.nextImage(true); this.resetControlTimer() }}>
                  <Icon type="double-right" />
                </div>
              </div>
            }

            {url && <img ref={(image) => { this.image = image }}
              style={{ width: imageWidth, height: imageHeight }}
              alt="" src={url}
              onClick={() => this.nextImage(true)}
            />
            }

            <Tag
              style={{ width: tagPanelWidth, opacity: tagPanelOpacity }}
              selectedTagIds={tagIds}
              onChange={(selectedTags, flag, tag) => this.onTagChange(selectedTags, flag, tag)}
              onMouseOver={() => this.setTagPanelVisible(true)}
              onMouseOut={() => this.setTagPanelVisible(false)}
            />
          </React.Fragment>
        }

        {crawerModalVisible && <Crawer type={crawerType} pathToSave={BASE_PATH} close={() => this.setState({ crawerModalVisible: false })}
          onFinish={(sucessCount, failCount) => this.showNotification('爬取完成', `成功 ${sucessCount}，失败 ${failCount}`)} />}
        {visible && <ImageView url={url} onClose={this.handleImageClose} />}
        {searchByTagModalVisible && <TagSearchModal visible={searchByTagModalVisible} onOk={this.searchByTags} onCancel={() => this.setState({ searchByTagModalVisible: false })}/>}
      </div>
    )
  }
}
