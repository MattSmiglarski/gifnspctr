function determineGifUrl() {
    var gifurl = document.location.search.replace(
        /.*gif=([^\&]+).*/,
        function(match, $1) { return $1; }
    );
    return gifurl || "http://localhost/GifSample.gif";
}

var widgetCreator = {
    header: function(header) {
        addContainer(header);
    },
    lsd: function(lsd) {
        addContainer(lsd);
    },
    gct: colorTableWidget,
    lct: colorTableWidget,
    commentExtension: function(commentdata) {
        addContainer(commentdata);
    },
    gce: function(jsondata) {
        addContainer(jsondata);
    },
    imagedescriptor: function(data) {
        addContainer(data);
    },
    ape: function(ape) {
        addContainer(ape);
    },
    terminator: function() {}
};

function init(gifurl) {
    var arrayBuffer;
    document.getElementById("gifurl").innerHTML = gifurl;
    var req = new XMLHttpRequest();
    req.open("GET", gifurl, true);
    req.responseType = "arraybuffer";
    req.onload = function(evt) {
        navigateGif(new DataView(req.response), widgetCreator);
    };
    req.send(null);
}

window.onload = function(evt) {
    init(determineGifUrl());
}
