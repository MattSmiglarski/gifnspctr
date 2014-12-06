var gifurl = "http://localhost/Y9ax5kJ.gif";
gifurl = "http://localhost/GifSample.gif";

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
        gifurl,
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
        'LogialScreenWidth': dv.getUint16(0, true),
        'LogicalScreenHeight': dv.getUint16(2, true),
        'PackedFields': dv.getUint8(4, true),
        'BackgroundColorIndex': dv.getUint8(5, true),
        'PixelAspectRatio': dv.getUint8(6, true)
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
            el.onclick = function() {
                var start = 6, length = 7, widget = debug;
                rangeRequest(
                    gifurl,
                    start,
                    start + length,
                    function(arrayBuffer) {
                        var json = lsdFormatter(arrayBuffer);
                        widget.setContent(json);
                        widget.setRange(start, start + length);
                        
                        var hasGlobalColorTable = json['PackedFields'] >> 7;
                        var sizeOfGct = json['PackedFields'] & 7;

                        var cursor = 13;
                        
                        gctEl = document.querySelector('.globalcolortable')
                        if (hasGlobalColorTable) {
                            gctEl.onclick = function(evt) {
                                rangeRequest(
                                    gifurl,
                                    cursor,
                                    cursor + 3 * (2 << sizeOfGct),
                                    function(arraybuffer) {
                                        var dv = new DataView(arraybuffer);
                                        var i=0, r, g, b;

                                        var gct = [];
                                        for (i=0; i < 2<<sizeOfGct; i+=1) {
                                            gct.push({
                                                r: dv.getUint8(3*i),
                                                g: dv.getUint8(3*i+1),
                                                b: dv.getUint8(3*i+2)
                                            });
                                        }

                                        var container = document.createElement("div");
                                        container.classList.add("output");
                                        
                                        var canvas = document.createElement("canvas");
                                        var context = canvas.getContext("2d");
                                        
                                        container.appendChild(canvas);
                                        document.body.appendChild(container);

                                        var width = 8, height;
                                        height = (2 << sizeOfGct) / width;

                                        var zoom = 10;
                                        var color;
                                        for (i=0; i<height; i++) {
                                            for (j=0; j<width; j++) {
                                                color = gct[i*width + j];
                                                context.fillStyle = "#"
                                                    + color['r'].toString(16)
                                                    + color['g'].toString(16)
                                                    + color['b'].toString(16);
                                                context.fillRect(j*zoom, i*zoom, (j+1)*zoom, (i+1) * zoom);
                                                console.log((j+1)*zoom, (i+1) * zoom);
                                            }
                                        }
                                });
                            };
                            gctEl.classList.add('clickable');
                        } else {
                            gctEl.classList.add('nada');
                        }
                    });
            }
            el.classList.add('clickable');
        });
}

window.onload = function(evt) {
    init();
}
