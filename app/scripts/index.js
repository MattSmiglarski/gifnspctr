import React from 'react';
import ReactDOM from 'react-dom';
import GrammarGuide from './grammar';
import { Next } from './gifdisplay';
require('../styles/style.scss');

export function determineGifUrl() {
    var gifurl = document.location.search.toString().replace(
        /.*gif=([^\&]+).*/,
        function(match, $1) { return $1; }
    );
    return decodeURIComponent(gifurl) || "sample.gif";
}

export class Links extends React.Component {
    constructor() {
        super();
        let linksStorage = localStorage.getItem('history');
        let links = linksStorage? JSON.parse(linksStorage) : [];
        const baseUrl = document.location.origin + document.location.pathname + '?' + document.location.search.replace(/[\?\&]*gif=[^\&]+/, '');

        let gifurl = determineGifUrl();
        if (links.indexOf(gifurl) === -1) {
            links.push(gifurl);
            localStorage.setItem('history', JSON.stringify(links));
        }

        this.state = {
            baseUrl: baseUrl,
            links: links
        };
    }

    render() {
        let linkElements = this.state.links.map((item, i) => {
            return <a key={i} href={this.state.baseUrl + '&gif=' + encodeURIComponent(item)}>{item}</a>
        });
        return (<div id="links">
            <span>Quick links:{linkElements}</span>
        </div>);
    }
}

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