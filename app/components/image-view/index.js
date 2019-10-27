import React from 'react'
import { Icon } from 'antd'
import './index.css'

export default class ImageView extends React.Component {
    constructor(props){
        super(props)
        this.state = {}
    }

    componentWillReceiveProps(nextProps) {
        const { url } = nextProps
        const img = new Image()

        img.onload = () => {
            const { width, height } = img
            const { clientWidth, clientHeight} = this.view
    
            if ( parseFloat(width) / clientWidth < parseFloat(height) / clientHeight) {
            this.setState({
                imageWidth: 'auto',
                imageHeight: '100%',
                url
            })
            } else {
            this.setState({
                imageWidth: '100%',
                imageHeight: 'auto',
                url
            })
            }
        }
        
        img.src = url
    }


    render() {
        const { url, imageWidth, imageHeight } = this.state
        const { onClose } = this.props
        return (
            <div className="image-view" ref={view => this.view = view}>
                <Icon type="close-circle" className="icon-close" onClick={onClose}/>
                {url && <img style={{width: imageWidth, height: imageHeight}} alt="" src={url}/>}
            </div>
        )
    }
}