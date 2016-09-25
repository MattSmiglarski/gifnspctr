import React from 'react';
import ReactDOM from 'react-dom';
import GrammarGuide from './grammar';
import { Links, determineGifUrl } from './app.js';
import { Next } from './gifdisplay';
require('../styles/style.scss');

let gifurl = determineGifUrl();
ReactDOM.render(
    <div>
        <div id="navbar">
            <a id="gifurl"
               href={gifurl}
               target="_blank"
               title="View image in new tab."
            >
                View image
            </a>

            <div id="bookmarklet" title="If you want a quick way to jump to this page when viewing a gif, copy the code in the input field and paste it as a bookmark location.">
                <label>Bookmarklet</label>
                <input value="javascript:document.location = 'http://localhost?gif=' + document.location;"
                       readOnly="readonly"
                       onClick={function() { this.select(); }}
                       size="50"/>
            </div>

            <Links/>
            <div style={{clear: 'both', height: '0em'}}></div>
        </div>
        <div style={{clear: 'both', margin: '1em'}}></div>
        <GrammarGuide/>
        <div style={{clear: 'both'}}></div>
        <div id="error" className="error" style={{display: "none"}}>
            <p>Could not download GIF. Please check the console log.</p>
        </div>
        <Next/>
    </div>,
    document.getElementById('app')
);