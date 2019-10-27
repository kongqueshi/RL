/* eslint-disable no-plusplus */
/* eslint-disable react/prop-types */
import React, { Component } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import './imageFlow.css'

export default class ImageFlow extends Component {
    constructor(props) {
        super(props)
        this.state = {
            imageDivs: [],
            curImages: [],
            datas: []
        }

        this.index = 0
        this.loading = false
    }

    componentDidMount() {
        this.loadImages(50)
    }

    loadImages = (addCount) => {
        const { imageDivs } = this.state
        const { images, onImageClick } = this.props
        let { index, loading } = this

        if(images && images.length && !loading) {
            this.loading = true
            let count = 0
            for (index; index < images.length; index++) {
                if (count > addCount)
                break

                const image = images[index]
                imageDivs.push(<div className='image-div' key={index} onClick={() => onImageClick(image)}><img alt="" src={image.url}/></div>)
                count++
            }

            this.index = index - 1
            
            this.setState({
                imageDivs
            }, () => { this.loading = false})
        }
    }

    render() {
        const { imageDivs } = this.state
       
        return (
            <div className='image-flow'>
                <InfiniteScroll
                    pageStart={0}
                    loadMore={() => this.loadImages(5)}
                    hasMore={true}
                    useWindow={false}
                >
                    <div className="tracks">
                        {imageDivs}
                    </div>
                </InfiniteScroll>
            </div>
        )
    }
}