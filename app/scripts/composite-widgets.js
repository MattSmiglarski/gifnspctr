/**
 * Module currently unused.
 */
import React from 'react';
import {
    ApplicationExtension,
    CommentExtension,
    GlobalColorTable,
    GraphicControlExtension
} from './gif-widgets';

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
            <div className="data">
                {body}
            </div>
        );
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
