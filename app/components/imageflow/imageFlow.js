/* eslint-disable no-plusplus */
/* eslint-disable react/prop-types */
import React, { Component } from 'react'
import StackGrid from "react-stack-grid"
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

    onScroll = (e) => {
        const { imageFlow } = this
        if ( imageFlow.scrollHeight - (imageFlow.scrollTop + imageFlow.clientHeight) <= 50 ) {
            this.loadImages(5)
        }
    }

    loadImages = (addCount) => {
        const { imageDivs } = this.state
        const { images } = this.props
        let { index, loading } = this

        if(images && images.length && !loading) {
            this.loading = true
            let count = 0
            for (index; index < images.length; index++) {
                if (count > addCount)
                break

                const image = images[index]
                imageDivs.push(<div className='image-div' key={index}><img alt="" src={image.url}/></div>)
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
            <div onScroll={(e) => this.onScroll(e)} ref={imageFlow => this.imageFlow = imageFlow}>
            <div className='image-flow'  >
                <button style={{position: 'absolute'}} onClick={() => this.loadImages(5)}>sdsdd</button>
                
                <StackGrid
                    columnWidth={300}
                    monitorImagesLoaded={false}
                    duration={400}
                    gridRef={grid => this.grid = grid}
                >
                    {imageDivs}
                </StackGrid>
            </div>
            </div>
            
            // <div className='image-flow' ref={imageFlow => { this.imageFlow = imageFlow }} onScroll={(e) => this.onScroll(e)}>
            //     {imageDivs}
            // </div>
        )
    }
}