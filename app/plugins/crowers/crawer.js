import React, { Component } from 'react'
import { Progress, Modal, Input } from 'antd'
import { downloadImage } from './huaban'

import './crawer.css'


export default class Crawer extends Component {
    constructor() {
      super()
      this.state = {
        modalVisible: true
      }
    }
    

    startCrawe = () => {
        let { pathToSave, type } = this.props
        let url = this.refs.urlInput.state.value
        switch(type) {
          case 'huaban':
            downloadImage(url, pathToSave, (percent) => {this.setState({percent})}, (sucessCount, failCount) => this.onFinish(sucessCount, failCount))
            break
          default:
            return
        }

        this.setState(
            {
                modalVisible: false,
                isDownloading: true
            }
        )
      }

    onFinish = (sucessCount, failCount) => {
        this.setState({
            isDownloading: false
        })

        let { close, onFinish } = this.props

        onFinish && onFinish(sucessCount, failCount)
        close && close()
    }

    render() {
        let { close } = this.props
        let { percent, modalVisible, isDownloading } = this.state

        return (
            <div>
                 <Modal
                    title="爬虫"
                    visible={modalVisible}
                    onOk={() => this.startCrawe()}
                    onCancel={() => close()}
                >
                    <Input ref='urlInput' defaultValue='https://huaban.com/boards/50144470/' addonBefore="地址" placeholder="请输入url" />
                </Modal>

                {isDownloading &&
                    <Progress className='progress' strokeColor={{
                                from: '#108ee9',
                                to: '#87d068',
                            }}
                            strokeLinecap="square"
                            status="active" 
                            percent={percent}/>
                }
            </div>
        )
    }
    
}