import { colorTableWidget, addHeader, addContainer, addSpacer } from './widgets';
import { navigateGif } from './navigator';

function determineGifUrl() {
    var gifurl = document.location.search.toString().replace(
        /.*gif=([^\&]+).*/,
        function(match, $1) { return $1; }
    );
    return decodeURIComponent(gifurl) || "http://i.imgur.com/EDqGIpG.gif";
}

function initLinks() {
    var el = document.getElementById("links"),
        gifurl = determineGifUrl(),
        links = [];

    if (localStorage.getItem('history')) {
        links = JSON.parse(localStorage.getItem('history'));
    }

    if (links.indexOf(gifurl) === -1) {
        links.push(gifurl);
        localStorage.setItem('history', JSON.stringify(links));
    }

    var baseUrl = document.location.origin + document.location.pathname + '?' + document.location.search.replace(/[\?\&]*gif=[^\&]+/, '');

    for (var i=0; i<links.length; i++) {
        var linkEl = document.createElement("a");
        linkEl.href = baseUrl + '&gif=' + encodeURIComponent(links[i]);
        linkEl.innerHTML = links[i];
        el.appendChild(linkEl);
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

window.thunks = []; // Container for delayed thunks (functions with no arguments).

function initApp() {
    initLinks();
    var arrayBuffer, gifurl = determineGifUrl();
    document.getElementById("gifurl").href = gifurl;
    var req = new XMLHttpRequest();
    req.open("GET", gifurl + '?x' + Math.random(), true);
    req.responseType = "arraybuffer";
    req.onload = function(evt) {
        if (req.status == 200) {
            navigateGif(new DataView(req.response), widgetCreator);
        } else {
            error();
        }
        
        // We delayed the intensive processing until later.
        window.setTimeout(function() {
            for (var i=0; i<thunks.length; i++) {
                thunks[i]();
            }
        }, 100);

        var colourHint = document.getElementById("colour-hint");

        var canvii = document.querySelectorAll('canvas');
        for (var i=0; i<canvii.length; i++) {
            
            canvii.item(i).onclick = function(evt) {
                var rgba = this.getContext('2d').getImageData(
                    evt.pageX - this.offsetLeft,
                    evt.pageY - this.offsetTop,
                    1, 1).data;
                var hex = rgba2colour(rgba[0], rgba[1], rgba[2]);
                colourHint.style.display = 'block';
                colourHint.innerHTML = hex;
                colourHint.style.backgroundColor = hex;
            };
        }
        
    };
    req.send(null);
}

module.exports = initApp;