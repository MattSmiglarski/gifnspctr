function determineGifUrl() {
    var gifurl = document.location.search.toString().replace(
        /.*gif=([^\&]+).*/,
        function(match, $1) { return $1; }
    );
    return decodeURIComponent(gifurl) || "http://localhost/GifSample.gif";
}

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
    }
};

function initApp() {
    var arrayBuffer, gifurl = determineGifUrl();
    document.getElementById("gifurl").innerHTML = gifurl;
    var req = new XMLHttpRequest();
    req.open("GET", gifurl, true);
    req.responseType = "arraybuffer";
    req.onload = function(evt) {
        _req = req.response;
        navigateGif(new DataView(req.response), widgetCreator);
    };
    req.send(null);
}

document.addEventListener("DOMContentLoaded", initApp);
