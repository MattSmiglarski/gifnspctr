import React from 'react';
import { GrammarGuide } from './grammar';
import { rgba2colour, renderImage } from './lzw';

export class GraphicControlExtension extends React.Component {
    render() {
        return (
            <GeneralStructure caption="Graphic Control Extension" data={this.props.data}/>
        );
    }
}

class GraphicRenderingBlock extends React.Component {
    render() {
        if (this.props.data.tableBasedImage) {
            return (<TableBasedImage
                data={this.props.data.tableBasedImage}
                globalColorTable={this.props.globalColorTable}
                graphicControlExtension={this.props.graphicControlExtension}
            />);
        } else if (this.props.data.plainTextExtension) {
            return (<PlainTextExtension data={this.props.data.plainTextExtension}/>)
        } else {
            return (<UnknownFormat data={this.props.data}/>);
        }
    }
}

class TableBasedImage extends React.Component {
    render() {
        if (!this.props.data.imageDescriptor || !this.props.data.imageData) {
            return (<UnknownFormat data={this.props.data}/>);
        }

        let localColorTable = this.props.data.localColorTable?
            (<LocalColorTable data={this.props.data.localColorTable}/>) : '';
        let colorTable = this.props.data.localColorTable || this.props.globalColorTable;

        return (
            <div>
                {localColorTable}
                <ImageDescriptor data={this.props.data.imageDescriptor}/>
                <GifImageData data={this.props.data.imageData}
                              lzwMinimumCodeSize={this.props.data.lzwMinimumCodeSize}
                              imageDescriptor={this.props.data.imageDescriptor}
                              colorTable={colorTable}
                              graphicControlExtension={this.props.graphicControlExtension}
                />
            </div>
        );
    }
}

class UnknownFormat extends React.Component {
    componentDidMount() {
        console.log("Unexpected!", this.props);
    }

    render() {
        return (<span>Unknown format!</span>);
    }
}

export class Header extends React.Component {
    render() {
        if (this.props.data === 'GIF89a') {
            return (
                <div>
                    <GrammarGuide/>
                </div>
            );
        } else {
            return (<div>{this.props.data}</div>);
        }
    }
}

export class Trailer extends React.Component {
    render() {
        return (
            <div>
                Image Terminated: <span>{this.props.data}</span>
            </div>
        );
    }
}

class GeneralStructure extends React.Component {
    render() {
        if (this.props.data == null) {
            return (<span>{this.props.caption} - no data.</span>);
        }

        let rows = Object.keys(this.props.data).map((key, index) => {
            return (
                <tr key={index}>
                    <td>{key}</td>
                    <td>{this.props.data[key]}</td>
                </tr>
            );
        });
        return (
            <table className="output">
                <caption>{this.props.caption}</caption>
                <tbody>
                {rows}
                </tbody>
            </table>
        );
    }
}

export class LogicalScreenDescriptor extends React.Component {
    render() {
        return (
            <GeneralStructure caption="Logical Screen Descriptor" data={this.props.data} />
        );
    }
}

class ColorTable extends React.Component {
    componentDidMount() {
        window.requestAnimationFrame(
            ()=>this.paint(this.refs.canvas.getContext('2d'))
        );
    }

    componentDidUpdate() {
        window.requestAnimationFrame(
            ()=>this.paint(this.refs.canvas.getContext('2d'))
        );
    }

    paint(context) {
        let color;
        let gct = this.props.data;
        let zoom = this.props.zoom;
        let height = this.props.height;
        let width = this.props.width;

        for (let i=0; i<height; i++) {
            for (let j=0; j<width; j++) {
                color = gct[i*width + j];
                context.fillStyle = rgba2colour(color['r'], color['g'], color['b']);
                context.fillRect(j*zoom, i*zoom, zoom, zoom);
            }
        }
    }

    render() {
        let zoom = this.props.zoom;
        let width = zoom * this.props.width;
        let height = zoom * this.props.height;
        return (
            <div className="output" title="Color table">
                <canvas ref="canvas"
                        width={width}
                        height={height}
                        style={{
                            width: width + 'px',
                            height: height + 'px',
                        }}/>
            </div>
        );
    }
}

export class GlobalColorTable extends React.Component {
    render() {
        if (!this.props.data) {
            return (
                <div/>
            );
        }
        let gct = this.props.data;
        let sqrt = Math.sqrt(gct.length);
        let width = (Math.round(sqrt) == sqrt)?
            sqrt : Math.sqrt(gct.length << 1);
        let height = gct.length / width;

        return (<ColorTable
            zoom={10}
            width={width}
            height={height}
            data={this.props.data}
        />);
    }
}

export class ImageDescriptor extends React.Component {
    render() {
        return (<GeneralStructure caption="Image descriptor" data={this.props.data}/>);
    }
}

export class LocalColorTable extends React.Component {
    render() {
        return (<span>LocalColorTable</span>);
    }
}

export class ApplicationExtension extends React.Component {
    render() {
        return (<GeneralStructure caption="Application Extension" data={this.props.data}/>);
    }
}

export class CommentExtension extends React.Component {
    render() {
        return (<span>CommentExtension</span>);
    }
}

export class GifImageData extends React.Component {
    componentDidMount() {
        window.requestAnimationFrame(
            ()=>this.paint(this.refs.canvas.getContext('2d'))
        );
    }

    componentDidUpdate() {
        window.requestAnimationFrame(
            ()=>this.paint(this.refs.canvas.getContext('2d'))
        );
    }

    paint() {
        let interlaced = (this.props.imageDescriptor.packedFields & 64) === 64;
        let transparentcolorflag;
        if (this.props.graphicControlExtension) {
            transparentcolorflag = this.props.graphicControlExtension.packedFields & 1;
        }
        let transparentcolorindex = transparentcolorflag?
            this.props.graphicControlExtension.transparentColorIndex : null;

        let addData = renderImage(
            this.refs.canvas,
            this.props.colorTable,
            this.props.lzwMinimumCodeSize,
            this.props.imageDescriptor.imageWidth,
            this.props.imageDescriptor.imageHeight,
            interlaced,
            transparentcolorindex
        );
        window.setTimeout(() => {
            for (let subblock of this.props.data) {
                addData(subblock);
            }
        }, 100);
    }

    render() {
        let width = this.props.imageDescriptor.imageWidth,
            height = this.props.imageDescriptor.imageHeight;

        return (<div>
            <canvas ref="canvas"
                    className="imageframe"
                    width={width}
                    height={height}
                    style={{
                        width: width + 'px',
                        height: height + 'px'
                    }}
            />
        </div>);
    }
}