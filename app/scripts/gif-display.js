import React from 'react';
import { navigateGif } from './navigator';
import { rgba2colour } from './lzw';
import {
    ApplicationExtension,
    LogicalScreenDescriptor,
    GifImageData,
    GlobalColorTable,
    GraphicControlExtension,
    Header,
    ImageDescriptor,
    Trailer
} from './gif-widgets';

function error() {
    document.getElementById('error').style.display = 'inline-block';
}

export class GifDisplay extends React.Component {
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

    /**
     * Top-level item.
     * @param logicalScreenDescriptor
     */
    logicalScreenDescriptor(logicalScreenDescriptor) {
        let logicalScreen = this.state.logicalScreen;
        logicalScreen.logicalScreenDescriptor = logicalScreenDescriptor;
        this.setState({
            logicalScreen: logicalScreen
        });
    }

    /**
     * Optional, top-level item.
     * @param globalColorTable
     */
    globalColorTable(globalColorTable) {
        let logicalScreen = this.state.logicalScreen;
        logicalScreen.globalColorTable = globalColorTable;
        this.setState({
            logicalScreen: logicalScreen
        });
    }

    /**
     * Here we append the previous GraphicBlock, ApplicationExtension or CommentExtension to the state.
     * (The corner case where no data blocks are present is not handled.)
     */
    trailer(trailer) {
        this.setState({
            trailer: trailer
        });
    }

    /**
     * May have an existing graphicControlExtension; completes data item.
     * @param plainTextExtension
     */
    plainTextExtension(plainTextExtension) {
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
     * Associated with the graphic-rendering block following.
     * Introduces a new data item; optional; does not complete data item.
     * @param graphicControlExtension
     */
    graphicControlExtension(graphicControlExtension) {
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
     * May have an existing graphicControlExtension; completes data item.
     * @param applicationExtension
     */
    applicationExtension(applicationExtension) {
        this.introducesData();
        this.currentData.specialPurposeBlock = {
            applicationExtension: applicationExtension
        };
        this.completesData();
    }
    // End of extensions

    /**
     * May have an associated graphicControlExtension; mandatory; does not complete data item.
     * @param imageDescriptor
     */
    imageDescriptor(imageDescriptor) {
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
                        imageDescriptor: imageDescriptor
                    }
                }
            }
        };
    }

    /**
     * Adds to existing data item; optional; does not complete data item.
     */
    localColorTable(localColorTable) {
        this.currentData.graphicBlock.graphicRenderingBlock.tableBasedImage.localColorTable = localColorTable;
    }

    /**
     * Adds to existing data item; mandatory; completes graphicBlock::data item.
     * Large object.
     * The lzwMinimumCodeSize is a single byte introduced before the image data.
     */
    imageData(imageData, lzwMinimumCodeSize) {
        let tableBasedImage = this.currentData.graphicBlock.graphicRenderingBlock.tableBasedImage;
        tableBasedImage.imageData = imageData;
        tableBasedImage.lzwMinimumCodeSize = lzwMinimumCodeSize;
        this.completesData();
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
                <GifBreakdown data={this.state}/>
                <div className="color-hint" ref="colorHint"/>
            </div>
        );
    }
}

class GifBreakdown extends React.Component {
    constructor() {
        super();
        this.state = {
            index: 0
        };
    }

    componentDidMount() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
    }

    onKeyDown(event) {
        if (event.keyCode === 37) {
            event.stopPropagation();
            event.preventDefault();
            this.decrement();
        } else if (event.keyCode === 39) {
            event.stopPropagation();
            event.preventDefault();
            this.increment();
        }
    }

    setIndex(newIndex) {
        let graphicBlocks = this.props.data.data.filter(x => x.graphicBlock);
        if (0 <= newIndex && newIndex <= graphicBlocks.length) {
            this.setState({
                index: newIndex
            });
        }
    }

    decrement() {
        this.setIndex(this.state.index - 1);
    }

    increment() {
        this.setIndex(this.state.index + 1);
    }

    render() {
        let imageIndex = this.state.index;
        let graphicBlocks = this.props.data.data.filter(x => x.graphicBlock);
        if (graphicBlocks.length == 0) {
            return (
                <div>No data</div>
            );
        }
        let frameData = graphicBlocks[imageIndex];
        let colorTable = frameData.graphicBlock.graphicRenderingBlock.localColorTable ||
            this.props.data.logicalScreen.globalColorTable;
        let tableBasedImage = frameData.graphicBlock.graphicRenderingBlock.tableBasedImage;
        let graphicControlExtension = frameData.graphicBlock.graphicControlExtension;

        let imageElement = (
            <GifImageData data={tableBasedImage.imageData}
                          lzwMinimumCodeSize={tableBasedImage.lzwMinimumCodeSize}
                          imageDescriptor={tableBasedImage.imageDescriptor}
                          colorTable={colorTable}
                          graphicControlExtension={graphicControlExtension}
            />
        );

        let extensions = this.props.data.data
            .filter(data => data.specialPurposeBlock)
            .map(data => data.specialPurposeBlock);

        let applicationExtensions = extensions.filter(specialPurposeBlock => specialPurposeBlock.applicationExtension)
            .map((specialPurposeBlock, index) => {
                return (
                    <ApplicationExtension key={index} data={specialPurposeBlock.applicationExtension}/>
                );
            });

        let commentExtensions = extensions.filter(specialPurposeBlock => specialPurposeBlock.commentExtension)
            .map((specialPurposeBlock, index) => {
                return (
                    <CommentExtension key={index} data={specialPurposeBlock.commentExtension}/>
                );
            });

        return (
            <div className="gif-breakdown">
                <Header data={this.props.data.header}/>
                <br className="spacer"/>
                <div className="metadata-group">
                    <LogicalScreenDescriptor data={this.props.data.logicalScreen.logicalScreenDescriptor}/>
                    {applicationExtensions}
                    {commentExtensions}
                </div>
                <div className="metadata-group">
                    <GlobalColorTable data={colorTable}/>
                    <GraphicControlExtension data={graphicControlExtension}/>
                    <ImageDescriptor data={tableBasedImage.imageDescriptor}/>
                </div>
                <br className="spacer"/>
                <div className="image-group">
                    <div onClick={this.decrement.bind(this)} className="left scroller">
                        {"<"}
                    </div>
                    {imageElement}
                    <div onClick={this.increment.bind(this)} className="right scroller">
                        {">"}
                    </div>
                </div>
                <br className="spacer"/>
                <Trailer data={this.props.data.trailer}/>
            </div>
        );
    }
}
