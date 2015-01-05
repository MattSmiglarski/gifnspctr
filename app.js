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
    actualImage: function(colortable, originalcodesize, width, height) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var zoom = 1;
        var cursor = 0;

        canvas.width = width * zoom;
        canvas.height = height * zoom;
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";

        addContainer(canvas);

        var table = null;
        var codesize = originalcodesize + 1;
        var previous = [];

        function decompress(data) {
            var indexStream, next, entry;
            var bv = BitView(new DataView(data));
            var indices = [];
            var resetCode = 1 << originalcodesize;
            var eoiCode = resetCode + 1;

            if (data.byteLength === 0) {
                return [];
            }

            function nextCode() {
                if (table.length === Math.pow(2, codesize)) {
                    codesize += 1;
                }
                return bv.readNBits(codesize);
            }

            function reset() {
                var i;
                table = [];
                for (i=0; i<Math.pow(2, originalcodesize); i++) {
                    table[i] = i;
                }
                codesize = originalcodesize + 1;
                table[i] = -1; // clear code
                table[i+1] = -2; // end of information code
            }

            function lookup(code) {
                var entry = table[code];
                if (typeof entry != 'undefined') {
                    return [].concat(entry);
                } else {
                    return null;
                }
            }

            function write(entry) {
                previous = entry;
                for (var i=0; i<entry.length; i++) {
                    indices.push(entry[i]);
                }
            }

            // read the initial reset code if not initialised.
            if (!table) {
                if (bv.readNBits(codesize) != resetCode) {
                    throw "Expected initial reset code!";
                } else {
                    reset();
                    // write the first code
                    next = nextCode();
                    entry = lookup(next);
                    if (!entry) {
                        throw "Failed to read first code!";
                    }
                    write(entry);
                }
            }

            while (bv.available() >= codesize) {
                next = nextCode();
                
                if (next === resetCode) {
                    reset();
                    console.log("received clear code");
                } else if (next === eoiCode) {
                    console.log('Recieved EOI code.');
                    break;
                }
                var k;
                entry = lookup(next);

                if (entry) {
                    k = entry[0];
                    table.push(previous.concat(k));
                    write(entry);
                } else {
                    k = previous[0];
                    table.push([k].concat(previous));
                    write([k].concat(previous));
                }
            }

            return indices;
        }
        
        return function(compresseddata) {
            var imagedata = decompress(compresseddata);
            for (var i=0; i<imagedata.length; i++) {
                var x = (cursor + i) % width;
                var y = (cursor + i - x) / width;
                var color = colortable[imagedata[i]];
                if (typeof color === 'undefined') {
                    console.log("Unknown color");
                    continue;
                }

                var colorString = rgba2colour(color['r'], color['g'], color['b']);
                context.fillStyle = colorString;
                context.fillRect(x, y, zoom, zoom);
            }
            cursor += imagedata.length;
        };
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
