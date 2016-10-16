import React from 'react';

export class GrammarGuide extends React.Component {
    render() {
        return (
            <div className="grammar">
                <a title="Visit the GIF89a specification."
                   href='http://www.w3.org/Graphics/GIF/spec-gif89a.txt'
                   target="_blank"
                >
                    <h3>GIF89a</h3>
                </a>
                <div className="rule">
                    <div className="symbol">GIF Data Stream</div>
                    <div className="operator">::=</div>
                    <div className="expression">
                        <div className="token header">Header</div>
                        <div className="word">Logical Screen</div>
                        <div className="word nary">Data</div>
                        <div className="token">Trailer</div>
                    </div>
                </div>

                <div className="rule">
                    <span className="symbol">Logical Screen</span>
                    <div className="operator">::=</div>

                    <div className="expression">
                        <div className="token logicalscreendescriptor">Logical Screen Descriptor</div>
                        <div className="token optional globalcolortable">Global Color Table</div>
                    </div>
                </div>

                <div className="rule">
                    <span className="symbol">Data</span>
                    <div className="operator">::=</div>

                    <div className="expression">
                        <div className="word">Graphic Block</div>
                        {'\u00a0'}|{'\u00a0'}
                        <div className="word">Special-Purpose Block</div>
                    </div>
                </div>

                <div className="rule">
                    <span className="symbol">Graphic Block</span>
                    <div className="operator">::=</div>

                    <div className="expression">
                        <div className="token optional">Graphic Control Extension</div>
                        <div className="word">Graphic-Rendering Block</div>
                    </div>
                </div>

                <div className="rule">
                    <span className="symbol">Graphic-Rendering Block</span>
                    <div className="operator">::=</div>

                    <div className="expression">
                        <div className="word">Table-Based Image</div>
                        {'\u00a0'}|{'\u00a0'}
                        <div className="token">Plain Text Extension</div>
                    </div>
                </div>

                <div className="rule">
                    <span className="symbol">Table-Based Image</span>
                    <div className="operator">::=</div>

                    <div className="expression">
                        <div className="token">Image Descriptor</div>
                        <div className="token optional">Local Color Table</div>
                        <div className="token">Image Data</div>
                    </div>
                </div>

                <div className="rule">
                    <span className="symbol">Special-Purpose Block</span>
                    <div className="operator">::=</div>

                    <div className="expression">
                        <div className="token">Application Extension</div>
                        {'\u00a0'}|{'\u00a0'}
                        <div className="token">Comment Extension</div>
                    </div>
                </div>
            </div>
        );
    }
}
