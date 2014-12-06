var gifurl = "http://localhost/Y9ax5kJ.gif";
gifurl = "http://localhost/GifSample.gif";

var textDecoder = new TextDecoder("utf-8");

function stringFormatter(x) {
    return textDecoder.decode(x);
}

function lsdFormatter(x) {
    var dv = new DataView(x);
    _lsddv = dv;
    return {
        LogialScreenWidth: dv.getUint16(0, true),
        LogicalScreenHeight: dv.getUint16(2, true),
        PackedFields: dv.getUint8(4, true),
        BackgroundColorIndex: dv.getUint8(5, true),
        PixelAspectRatio: dv.getUint8(6, true)
    };
}

function colorTableParser(size, arraybuffer) {
    var dv = new DataView(arraybuffer);
    var i=0, r, g, b;
    
    var gct = [];
    for (i=0; i < 2<<size; i+=1) {
        gct.push({
            r: dv.getUint8(3*i),
            g: dv.getUint8(3*i+1),
            b: dv.getUint8(3*i+2)
        });
    }
    return gct;
}

function navigateGif(data, visitor) {
    var header, lsd, gct, gctdata, nextChar, sizeOfGct, cursor = 0;

    header = stringFormatter(data.slice(cursor, cursor += 6));
    visitor.header(header);

    lsd = lsdFormatter(data.slice(cursor, cursor += 7));
    visitor.lsd(lsd);

    if (lsd.PackedFields >> 7) { // hasGlobalColorTable
        sizeOfGct = lsd.PackedFields & 7;

        gctdata = data.slice(cursor, cursor += (3 * (2 << sizeOfGct)));
        gct = colorTableParser(sizeOfGct, gctdata);
        visitor.gct(gct);
    }

    while (true) {
        nextByte = stringFormatter(data.slice(cursor, cursor += 1));

        switch(nextByte) {
        case ';': // terminator
            visitor.terminator();
            break;
        case '!': // extension
            nextByte = data.slice(cursor, cursor += 1)[0];

            throw "Not implemented!";

            switch (nextByte) {
            case 0x1: // read_plain_text_extension
                break;
            case 0xf9: // read_graphic_control_extension
                break;
            case 0xfe: // read_comment_extension
                break;
            case 0xff: // read_application_extension
                break;
            default:  
                throw "Unexpected byte " + nextByte;
            }
            break;
        case ',': // imagedescriptor
            break;
        default:
            throw ("Unexpected at " + cursor + " : " + nextByte);
        }
    }
}

function addContainer(content) {
    var container = document.createElement("div");
    container.classList.add("output");
    var debug = new DebugOutput(container);
    debug.setContent(content);
    document.body.appendChild(container);
}

var widgetCreator = {
    header: function(header) {
        addContainer(header);
    },
    lsd: function(lsd) {
        addContainer(lsd);
    },
    gct: function(gct) {
        _gct = gct;
        var container = document.createElement("div");
        container.classList.add("output");
        
        var i=0, width = 1, height;

        while (gct.length >> i > 0) {
            i+=1;
        }
        width = (i - 1) * 2;
        height = gct.length / width;
        
        var zoom = 10;
        var canvas = document.createElement("canvas");
        canvas.width = zoom * width;
        canvas.height = zoom * height;
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";
        var context = canvas.getContext("2d");
        container.appendChild(canvas);
        document.body.appendChild(container);
        

        var color;
        for (i=0; i<height; i++) {
            for (j=0; j<width; j++) {
                color = gct[i*width + j];
                context.fillStyle = "#"
                    + color['r'].toString(16)
                    + color['g'].toString(16)
                    + color['b'].toString(16);
                context.fillRect(j*zoom, i*zoom, zoom, zoom);
            }
        }
    }
};

function init() {
    var arrayBuffer;
    var req = new XMLHttpRequest();
    req.open("GET", gifurl, true);
    req.responseType = "arraybuffer";
    req.onload = function(evt) {
        navigateGif(req.response, widgetCreator);
    };
    req.send(null);
}

window.onload = function(evt) {
    init();
}
