import React, { Component } from 'react'
import { AutoComplete } from 'antd'
import './imageFlow.css'

export default class ImageFlow extends Component {
    render() {
        const { images } = this.props

        console.log(images)

        let i = 0
        return (
            <div className='image-flow'>
                {images && images.length &&
                    images.map(image => <div><img key={image.key || i++} alt="" src={image.url}/></div> )
                }
            </div>
        )
    }
}