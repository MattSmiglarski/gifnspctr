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
    actualImage: function(colortable, codesize, width, height) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var zoom = 1;
        var cursor = 0;

        canvas.width = width * zoom;
        canvas.height = height * zoom;
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";

        addContainer(canvas);
        return function(compresseddata) {
            var imagedata = decompress2(codesize, compresseddata);
            for (var i=0; i<imagedata.length; i++) {
                var x = (cursor + i) % width;
                var y = (cursor + i - x) / width;
                var color = colortable[imagedata[i]];
                var colorString = rgba2colour(color['r'], color['g'], color['b']);
                context.fillStyle = colorString;
                context.fillRect(x, y, zoom, zoom);
            }
            cursor += imagedata.length;
        }
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
