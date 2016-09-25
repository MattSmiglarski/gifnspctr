import React from 'react';
import { navigateGif } from './navigator';
import { rgba2colour, renderImage } from './lzw';

function error() {
    document.getElementById('error').style.display = 'inline-block';
}

export class Next extends React.Component {
    constructor() {
        super();
        this.state = {
            header: null,
            logicalScreen: {
                logicalScreenDescriptor: null
            },
            data: [],
            trailer: null
        };
    }

    componentDidMount() {
        var req = new XMLHttpRequest();
        req.open("GET", gifurl + '?x' + Math.random(), true);
        req.responseType = "arraybuffer";
        let gifVisitor = this;
        let colorHint = this.refs.colorHint;
        req.onload = function (evt) {
            if (req.status == 200) {
                navigateGif(new DataView(req.response), gifVisitor);
            } else {
                error();
            }

            let canvii = document.querySelectorAll('canvas');
            for (var i = 0; i < canvii.length; i++) {

                canvii.item(i).onclick = function(evt) {
                    var rgba = this.getContext('2d').getImageData(
                        evt.pageX - this.offsetLeft,
                        evt.pageY - this.offsetTop,
                        1, 1).data;
                    var hex = rgba2colour(rgba[0], rgba[1], rgba[2]);
                    colorHint.style.display = 'block';
                    colorHint.innerHTML = hex;
                    colorHint.style.backgroundColor = hex;
                };
            }

        };
        req.send(null);
    }

    /**
     * The addition to the state of data items is delayed until all the information is in.
     * In other words, each data item will call this exactly once.
     * The GIF spec allows this simplification as there are no trailing optional elements in a data item.
     */
    completesData() {
        this.setState({
            data: this.state.data.concat([this.currentData])
        });
        this.currentData = null;
    }

    /**
     * Since this is a top-level token, the state is updated immediately.
     * @param header Usually "gif89a".
     */
    header(header) {
        this.setState({
            header: header
        });
    }

    spacer() {
        // no-op
    }

    /**
     * TODO: Camel-case.
     * Top-level item.
     * @param logicalScreenDescriptor
     */
    lsd(logicalScreenDescriptor) {
        let logicalScreen = this.state.logicalScreen;
        logicalScreen.logicalScreenDescriptor = logicalScreenDescriptor;
        this.setState({
            logicalScreen: logicalScreen
        });
    }

    /**
     * TODO: Camel-case.
     * Optional, top-level item.
     * @param globalColorTable
     */
    gct(globalColorTable) {
        let logicalScreen = this.state.logicalScreen;
        logicalScreen.globalColorTable = globalColorTable;
        this.setState({
            logicalScreen: logicalScreen
        });
    }

    /**
     * TODO: Rename to 'trailer'.
     * Here we append the previous GraphicBlock, ApplicationExtension or CommentExtension to the state.
     * (The corner case where no data blocks are present is not handled.)
     */
    terminator(trailer) {
        this.setState({
            trailer: trailer
        });
    }

    /**
     * TODO: Rename plainTextExtension
     * May have an existing graphicControlExtension; completes data item.
     * @param plainTextExtension
     */
    pte(plainTextExtension) {
        this.possiblyIntroducesData();
        let graphicControlExtension;
        if (this.currentData.graphicBlock) {
            // TODO: plain text extensions should be nested in the standard style. See TableBasedImage.
            // Ensure the graphicControlExtension is passed over in a similar way.
            console.log("warning! incomplete algorithm");
        }

        this.currentData = {
            plainTextExtension: plainTextExtension
        };
        this.completesData();
    }

    /**
     * TODO: Rename to 'graphicControlExtension'.
     * Associated with the graphic-rendering block following.
     * Introduces a new data item; optional; does not complete data item.
     * @param graphicControlExtension
     */
    gce(graphicControlExtension) {
        this.introducesData();
        this.currentData.graphicBlock = {
            graphicControlExtension: graphicControlExtension
        };
    }

    /**
     * May have an existing graphicControlExtension; completes data item.
     * @param commentExtension
     */
    commentExtension(commentExtension) {
        this.introducesData();
        this.currentData.commentExtension = commentExtension;
        this.completesData();
    }

    /**
     * TODO: Rename application extension
     * May have an existing graphicControlExtension; completes data item.
     * @param applicationExtension
     */
    ape(applicationExtension) {
        this.introducesData();
        this.currentData.specialPurposeBlock = {
            applicationExtension: applicationExtension
        };
        this.completesData();
    }
    // End of extensions

    /**
     * TODO: Camel-case.
     * May have an associated graphicControlExtension; mandatory; does not complete data item.
     * @param imagedescriptor
     */
    imagedescriptor(imagedescriptor) {
        this.possiblyIntroducesData();

        let graphicControlExtension;
        if (this.currentData.graphicBlock) {
            graphicControlExtension = this.currentData.graphicBlock.graphicControlExtension;
        }

        this.currentData = {
            graphicBlock: {
                graphicControlExtension: graphicControlExtension,
                graphicRenderingBlock: {
                    tableBasedImage: {
                        imageDescriptor: imagedescriptor
                    }
                }
            }
        };
    }

    /**
     * TODO: Rename localColorTable
     * Adds to existing data item; optional; does not complete data item.
     */
    lct(localColorTable) {
        this.currentData.graphicBlock.graphicRenderingBlock.tableBasedImage.localColorTable = localColorTable;
    }

    /**
     * TODO: Camel-case.
     * Adds to existing data item; mandatory; completes graphicBlock::data item.
     * Large object.
     * The lzwminimumcodesize is a single byte introduced before the image data.
     */
    imagedata(imageData, lzwminimumcodesize) {
        let tableBasedImage = this.currentData.graphicBlock.graphicRenderingBlock.tableBasedImage;
        tableBasedImage.imageData = imageData;
        tableBasedImage.lzwminimumcodesize = lzwminimumcodesize;
        this.completesData();
    }

    imageCanvas(imagedescriptor) {
        var width = imagedescriptor.imageWidth,
            height = imagedescriptor.imageHeight,
            canvas = document.createElement("canvas"),
            zoom = 1;

        canvas.className = 'imageframe';
        canvas.width = width * zoom;
        canvas.height = height * zoom;
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";
        return canvas;
    }

    possiblyIntroducesData() {
        if (!this.currentData) this.currentData = {};
    }

    introducesData() {
        if (this.currentData) {
            /*
            This has been seen before.
            The GIF found at http://i.imgur.com/EDqGIpG.gif has a GraphicControlExtension followed by
            an ApplicationExtension.
             */
            console.log("Incorrect GIF syntax!");
        }
        this.currentData = {};
    }

    render() {
        return (
            <div>
                <GifDataStream data={this.state} />
                <div className="color-hint" ref="colorHint"/>
            </div>
        );
    }
}

export default class GifDataStream extends React.Component {
    render() {
        var data = this.props.data.data.map((x, index) => (
            <Data key={index}
                  data={x}
                  globalColorTable={this.props.data.logicalScreen.globalColorTable}
            />
        ));
        let logicalScreen = (this.props.data.logicalScreen?
            <LogicalScreen data={this.props.data.logicalScreen}/> : '');

        return (
            <div>
                <Header data={this.props.data.header}/>
                {logicalScreen}
                {data}
                <Trailer data={this.props.data.trailer}/>
            </div>
        );
    }
}

class LogicalScreen extends React.Component {
    render() {
        let globalColorTable = (this.props.data.globalColorTable?
            (<GlobalColorTable data={this.props.data.globalColorTable}/>) : '');

        return (
            <div>
                <LogicalScreenDescriptor data={this.props.data.logicalScreenDescriptor}/>
                {globalColorTable}
            </div>
        );
    }
}

class Data extends React.Component {
    render() {
        let body;
        if (!this.props.data) {
            body = (<span>No data</span>);
        } else if (this.props.data.graphicBlock) {
            body = (<GraphicBlock
                data={this.props.data.graphicBlock}
                globalColorTable={this.props.globalColorTable}
            />);
        } else if (this.props.data.specialPurposeBlock) {
            body = (<SpecialPurposeBlock data={this.props.data.specialPurposeBlock}/>);
        } else {
            body = (<UnknownFormat data={this.props.data}/>);
        }

        return (
            <div>
                {body}
                <div className="spacer"/>
                <br style={{clear: 'both'}}/>
            </div>
        );
    }
}

class GraphicBlock extends React.Component {
    render() {
        if (!this.props.data.graphicRenderingBlock) {
            return (<UnknownFormat data={this.props.data}/>);
        }

        let graphicControlExtension = (this.props.data.graphicControlExtension)?
            (<GraphicControlExtension data={this.props.data.graphicControlExtension}/>) : '';

        return (
            <div>
                {graphicControlExtension}
                <GraphicRenderingBlock
                    data={this.props.data.graphicRenderingBlock}
                    globalColorTable={this.props.globalColorTable}
                    graphicControlExtension={this.props.data.graphicControlExtension}
                />
            </div>
        );
    }
}

class GraphicControlExtension extends React.Component {
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
                              lzwminimumcodesize={this.props.data.lzwminimumcodesize}
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

class SpecialPurposeBlock extends React.Component {
    render() {
        if (this.props.data.applicationExtension) {
            return (<ApplicationExtension data={this.props.data.applicationExtension}/>);
        } else if (this.props.data.commentExtension) {
            return (<CommentExtension data={this.props.data.commentExtension}/>);
        } else {
            return (<UnknownFormat data={this.props.data}/>);
        }
    }
}

class Header extends React.Component {
    render() {
        if (this.props.data === 'GIF89a') {
            return (
                <a title="Visit the GIF89a specification."
                   href='http://www.w3.org/Graphics/GIF/spec-gif89a.txt'
                   target="_blank"
                >
                    {this.props.data}
                </a>
            );
        } else {
            return (<span>{this.props.data}</span>);
        }
    }
}

class Trailer extends React.Component {
    render() {
        return (<span>{this.props.data}</span>);
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

class LogicalScreenDescriptor extends React.Component {
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

class GlobalColorTable extends React.Component {
    render() {
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

class ImageDescriptor extends React.Component {
    render() {
        return (<GeneralStructure caption="Image descriptor" data={this.props.data}/>);
    }
}

class LocalColorTable extends React.Component {
    render() {
        return (<span>LocalColorTable</span>);
    }
}

class ApplicationExtension extends React.Component {
    render() {
        return (<GeneralStructure caption="Application Extension" data={this.props.data}/>);
    }
}

class CommentExtension extends React.Component {
    render() {
        return (<span>CommentExtension</span>);
    }
}

class GifImageData extends React.Component {
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
            this.props.lzwminimumcodesize,
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