import React from 'react';

export default class GrammarGuide extends React.Component {
    render() {
        return (
            <div className="grammar">
                <div className="rule">
                    <span className="word">GIF Data Stream</span> ::=

                    <span className="token header">Header</span>
                    <span className="word">Logical Screen</span>
                    <span className="word nary">Data</span>
                    <span className="token">Trailer</span>
                </div>

                <div className="rule">
                    <span className="word">Logical Screen</span> ::=

                    <span className="token logicalscreendescriptor">Logical Screen Descriptor</span>
                    <span className="token optional globalcolortable">Global Color Table</span>
                </div>

                <div className="rule">
                    <span className="word">Data</span> ::=

                    <span className="word">Graphic Block</span> |
                    <span className="word">Special-Purpose Block</span>
                </div>

                <div className="rule">
                    <span className="word">Graphic Block</span> ::=

                    <span className="word optional">Graphic Control Extension</span>
                    <span className="word">Graphic-Rendering Block</span>
                </div>

                <div className="rule">
                    <span className="word">Graphic-Rendering Block</span> ::=

                    <span className="word">Table-Based Image</span> |
                    <span className="word">Plain Text Extension</span>
                </div>

                <div className="rule">
                    <span className="word">Table-Based Image</span> ::=

                    <span className="token">Image Descriptor</span> |
                    <span className="token optional">Local Color Table</span>
                    <span className="token">Image Data</span>
                </div>

                <div className="rule">
                    <span className="word">Special-Purpose Block</span> ::=

                    <span className="token">Application Extension</span> |
                    <span className="token">Comment Extension</span>
                </div>

            </div>
        );
    }
}
