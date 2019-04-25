/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
// @flow
import React, { Component } from 'react'
import { notification, Icon } from 'antd'
import fs from 'fs'
import Crawer from '../plugins/crowers/crawer'
import Sqlite3 from '../utils/sqlite3'
import { hash } from '../utils/hash'
import dbconfig from '../constants/dbconfig'
import './HomePage.css'

const localElectron = require('electron')

const electron = localElectron.remote.require('electron')
const { Menu, BrowserWindow } = electron

const BASE_PATH = 'f:/huaban/'

export default class HomePage extends Component {
  constructor() {
    super()
    this.state = {
      path: '20170815b07.jpg',
      showControl: false
    }

    const [ browserWindow ] = BrowserWindow.getAllWindows()
    this.browserWindow = browserWindow

    let config = {}
    try {
      const configString = fs.readFileSync('./config.json', 'utf-8')
      config = JSON.parse(configString) || {}
    } catch { console.log("") }
    
    this.playMode = config.playMode || 'random'
    this.playSpeed = config.playSpeed || 1500
    this.pause = config.pause || false
    this.onTop = config.onTop || false
    this.opacity = config.opacity || 1
    this.state.pause = config.pause || false
    
    this.history = []
    this.historyIndex = 0

    window.onbeforeunload = () => {
      if (this.configSaved) {
        return true
      } 

      config = {
        playMode: this.playMode,
        playSpeed: this.playSpeed,
        pause: this.pause,
        onTop: this.onTop,
        opacity: this.opacity
      }

      fs.writeFile('./config.json', JSON.stringify(config), 'utf8', (e) => {
        if(e) {
          console.log(e)
          throw(e)
        } else {
          this.configSaved = true
          this.browserWindow.destroy()
        }
      })

      return false
    }
    

    this.db = new Sqlite3(dbconfig.PATH)
  }

  componentDidMount() {
    this.app.addEventListener('mousemove', () => {
      this.resetControlTimer()
      this.setState({showControl: true})
    })

    fs.readdir(BASE_PATH, null, (err, files) => {
      this.files = files.filter(file => file.indexOf('.')  !== 0)
      // this.files.forEach(file => {
      //   hash(BASE_PATH + file).then(
      //     (hash) => this.db.insertSingle('images', ['name', 'path', 'hash'], [file, BASE_PATH, hash], (err) => { console.error(err.message, file) }, (id) => console.log(id))
      //   ).catch(error => { console.error(error) })
      // })
      this.timer = setInterval(this.nextImage, this.playSpeed)
    })

    const template = [
      {
        label: '播放控制',
        submenu: [
          { label: '随机播放', click: () => { this.playMode = 'random' }},
          { label: '顺序播放', click: () => { this.playMode = 'normal' }},
          { label: '加快播放', click: () => this.changePlaySpeed(-200), accelerator: 'Up'},
          { label: '减速播放', click: () => this.changePlaySpeed(200), accelerator: 'Down'},
          { label: '下一个', click: () => this.nextImage(true), accelerator: 'Right'},
          { label: '上一个', click: () => this.preImage(), accelerator: 'Left'},
          { label: '暂停/开始 播放', click: () => { this.pause = !this.pause }, accelerator: 'Space' },
          { label: '删除', click: () => this.delete(), accelerator: 'Delete' },
          { label: '全屏', click: () => this.browserWindow.setFullScreen(true), accelerator: 'Enter' },
          { label: '退出全屏', click: () => this.browserWindow.setFullScreen(false), accelerator: 'Esc' },
          { label: '置顶', click: () => { this.onTop = !this.onTop;this.browserWindow.setAlwaysOnTop(this.onTop) }, accelerator: 'ctrl+T' },
          { label: '增加透明度', click: () => { this.opacity = this.opacity + 0.1 > 1 ? 1 : this.opacity + 0.1;this.browserWindow.setOpacity(this.opacity) }, accelerator: 'ctrl+Up' },
          { label: '减小透明度', click: () => { this.opacity = this.opacity - 0.1 < 0 ? 0 : this.opacity - 0.1;this.browserWindow.setOpacity(this.opacity) }, accelerator: 'ctrl+Down' }
      ]},
      {
        label: '爬虫',
        submenu: [
          { label: '花瓣', click: () => this.showCrawerModal('huaban')}
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }

  changePlaySpeed = (step) => {
    let playSpeed = this.playSpeed + step
    playSpeed = playSpeed < 200 ? 200 : playSpeed

    this.resetTimer(playSpeed)
    this.showNotification(`当前播放速度${playSpeed}毫秒`)
  }

  resetControlTimer = () => {
    clearTimeout(this.hideControlTimer)
    this.hideControlTimer = setTimeout(() => this.setState({showControl: false}), 1000)
  }

  resetTimer = (playSpeed) => {
    clearTimeout(this.timer)

    this.playSpeed = playSpeed || this.playSpeed
    this.timer = setInterval(this.nextImage,this.playSpeed)
  }

  nextImage = (force) => {
    const { length } = this.files
    if (this.files && length && (!this.pause || force)) {
      if (force) this.resetTimer()

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

      this.setState({
        path: this.files[nextIndex]
      })
    } 
  }

  preImage = () => {
    let historyIndex = this.historyIndex - 1
    if(historyIndex > this.history.length - 1) historyIndex = this.history.length - 2

    if (historyIndex >= 0) {
      this.index = this.history[historyIndex]
      this.historyIndex = historyIndex
      this.resetTimer(this.playSpeed)

      if (!this.files[this.index]) {
        this.preImage()
      } else {
        this.setState({
          path: this.files[this.index]
        })
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

  render() {
    const { path, pause, showControl, crawerModalVisible, crawerType } = this.state

    return (
      <div className="App" ref={(app) => {this.app = app}}>
        {showControl && 
          <div className='control'>
            <div className='pre' onClick={() => {this.preImage();this.resetControlTimer()}}>
              <Icon type="double-left"/>
            </div>
            
            <div className='next' onClick={() => {this.nextImage();this.resetControlTimer()}}>
              <Icon type="double-right"/>
            </div>

            <div className='play-switch' onClick={() => {this.pause = !this.pause; this.setState({pause: this.pause});this.resetControlTimer()}}>
              <Icon type={pause ? 'play-circle' : "pause-circle"} />
            </div>
          </div>
        }

        {path && <img alt="" src={`file://${BASE_PATH}${path}`}/>}

        {crawerModalVisible && <Crawer type={crawerType} pathToSave={BASE_PATH} close={() => this.setState({crawerModalVisible: false})} 
          onFinish={(sucessCount, failCount) => this.showNotification('爬取完成', `成功 ${sucessCount}，失败 ${failCount}`)}/>}
      </div>
    );
  }
}
