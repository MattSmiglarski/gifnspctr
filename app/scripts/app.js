import React from 'react';
import { colorTableWidget, addHeader, addContainer, addSpacer } from './widgets';

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

var widgetCreator = {
    header: function(header) {
        addHeader(header);
    },
    lsd: function(lsd) {
        addContainer("Logical Screen Descriptor", lsd);
    },
    gct: colorTableWidget,
    lct: colorTableWidget,
    commentExtension: function(commentdata) {
        addContainer("Comment data", commentdata);
    },
    gce: function(jsondata) {
        addContainer("Graphic Control Extension", jsondata);
    },
    imagedescriptor: function(data) {
        addContainer("Image descriptor", data);
    },
    imagedata: function(data) {
        addContainer("Image data", data);
    },
    ape: function(ape) {
        addContainer("Application Extension", ape);
    },
    terminator: function(terminator) {
        addContainer("Terminator", terminator);
    },
    imageCanvas: function(imagedescriptor) {
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
    },
    spacer: function() {
        addSpacer();
    }
};

function error() {
    document.getElementById('error').style.display = 'inline-block';
}