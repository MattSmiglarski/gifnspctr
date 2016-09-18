import React from 'react';
import ReactDOM from 'react-dom';
import GrammarGuide from './grammar';
import initApp from './app.js';
require('../styles/style.scss');

ReactDOM.render(
    <div>
        <GrammarGuide/>
        <div style={{clear: 'both', height: '0em'}}></div>

        <div id="error" className="error" style={{display: "none"}}>
            <p>Could not download GIF. Please check the console log.</p>
        </div>

        <div id="containers"></div>

        <div id="colour-hint">&nbsp;</div>
    </div>,
    document.getElementById('app'),
    initApp
);