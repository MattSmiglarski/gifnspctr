var widgetCreator = {
    header: function(header) {
        addContainer(header).title = "GIF Header";
    },
    lsd: function(lsd) {
        addContainer(lsd).title = "Logical Screen Descriptor";
    },
    gct: colorTableWidget,
    lct: colorTableWidget,
    commentExtension: function(commentdata) {
        addContainer(commentdata).title = "Comment data";
    },
    gce: function(jsondata) {
        addContainer(jsondata).title = "Graphic Control Extension";
    },
    imagedescriptor: function(data) {
        addContainer(data).title = "Image descriptor";
    },
    imagedata: function(data) {
        addContainer(data).title = "Image data";
    },
    ape: function(ape) {
        addContainer(ape).title = "Application Extension";
    },
    terminator: function(terminator) {
        addContainer(terminator).title = "Terminator";
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

var thunks = []; // Container for delayed thunks (functions with no arguments).

function initApp() {
    var arrayBuffer, gifurl = determineGifUrl();
    document.getElementById("gifurl").innerHTML = gifurl;
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
    };
    req.send(null);
}

document.addEventListener("DOMContentLoaded", initApp);
