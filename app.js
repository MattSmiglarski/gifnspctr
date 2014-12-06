function rangeRequest(url, from, until, callback) {
    var arrayBuffer;
    var req = new XMLHttpRequest();
    var byterange = "bytes=" + from + "-" + until;
    req.open("GET", url, true);
    req.setRequestHeader("Range", byterange);
    req.responseType = "arraybuffer";
    req.onload = function(evt) {
        callback(req.response);
    };
    req.send(null);
}

function widgetRange(widget, start, length, formatter) {
    rangeRequest(
        "http://localhost/Y9ax5kJ.gif",
        start,
        start + length,
        function(arrayBuffer) {
            widget.setContent(formatter(arrayBuffer));
            widget.setRange(start, start + length);
        });    
}

function binInt(h) {
    return h;
}

function binByte(b) {
    return b;
}

DataView.prototype.getUTF8String = function(offset, length) {
    var utf16 = new ArrayBuffer(length * 2);
    var utf16View = new Uint16Array(utf16);
    for (var i = 0; i < length; ++i) {
        utf16View[i] = this.getUint8(offset + i);
    }
    return String.fromCharCode.apply(null, utf16View);
};

var textDecoder = new TextDecoder("utf-8");

function stringFormatter(n) {
    return function(x) {
        return textDecoder.decode(x.slice(0, n));
    }
}

function lsdFormatter(x) {
    var dv = new DataView(x);
    return {
        'LogialScreenWidth': dv.getInt16(0),
        'LogicalScreenHeight': dv.getInt16(1),
        'PackedFields': dv.getInt8(4),
        'BackgroundColorIndex': dv.getInt8(5),
        'PixelAspectRatio': dv.getInt8(6)
    };
 }

function init() {
    var debug = new DebugOutput(document.getElementById("gifheader"));
    
    Array.every(
        document.querySelectorAll('.header'),
        function(el) {
            el.onclick = function() { widgetRange(debug, 0, 5, stringFormatter(5)); };
            el.classList.add("clickable");
        });

    Array.every(
        document.querySelectorAll('.logicalscreendescriptor'),
        function(el) {
            el.onclick = function() { widgetRange(debug, 5, 7, lsdFormatter); },
            el.classList.add('clickable');
        });
}

window.onload = function(evt) {
    init();
}
