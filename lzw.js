function BitView() {

    var bitcursor = 0;
    var bytecursor = 0;
    var dataViews = [];

    function add(anotherdataview) {
        dataViews.push(anotherdataview);
    }

    function readNBits(n) {
        var bitsleft, first, rest, b, bits, shift;
        
        shift = 8 - n - bitcursor;
        if (shift < 0) {
            bitsleft = 8 - bitcursor;
            first = readNBits(bitsleft);
            rest = readNBits(n - bitsleft)
            return (rest << bitsleft) | first;
        }

        b = dataViews[0].getUint8(bytecursor);

        // eg. for n = 4, shift = 4: (b & 0b11110000) >> 4
        bits = ((b & (((1 << n) - 1)) << bitcursor) >> bitcursor);

        bitcursor = (bitcursor + n) % 8;
        if (bitcursor == 0) {
            bytecursor +=1;
        }
        if (bytecursor == dataViews[0].byteLength) {
            dataViews.shift();
            bytecursor = 0;
        }

        return bits;
    }

    function readBit() {
        var shift, bit;
        var b = dataView.getUint8(bytecursor);
        shift = 7 - bitcursor;
        bit = ((b & (1 << shift)) >> shift);
        bitcursor = (bitcursor + 1) % 8;
        if (!bitcursor) {
            bytecursor +=1;
        }
        return bit;
    }

    function available() {
        var totalLength = 0;
        for (var i=0; i<dataViews.length; i++) {
            totalLength += dataViews[i].byteLength;
        }
        
        return (totalLength - bytecursor) * 8 - bitcursor;
    }
    
    return {
        readBit: readBit,
        readNBits: readNBits,
        available: available,
        add: add
    };
}

/* Format binary and hex. */
function f(n) {
    return ("00000000" + n.toString(2)).substr(-8)
        + "\t"
        + ("00" + n.toString(16)).substr(-2);
}

function rgba2colour(r, g, b, a) {
    return '#'
        + ("00" + r.toString(16)).substr(-2)
        + ("00" + g.toString(16)).substr(-2)
        + ("00" + b.toString(16)).substr(-2)
        + (typeof a !== 'undefined'? ("00" + a.toString(16)).substr(-2) : '');
}

function bitLength(n) {
    return n.toString(2).length;
}

function context2rgba(context) {
    var width = context.canvas.width;
    var height = context.canvas.height;
    var imagedata = context.getImageData(0, 0, width, height);
    var i, j, pixelStart;
    var rgbaData = [];

    for (i=0; i<imagedata.height; i++) {
        for (j=0; j<imagedata.width; j++) {
            pixelStart = 4*i*imagedata.width + 4*j;
            rgbaData.push(rgba2colour(
                imagedata.data[pixelStart],
                imagedata.data[pixelStart + 1],
                imagedata.data[pixelStart + 2],
                imagedata.data[pixelStart + 3]
            ));
        }
    }
    
    return rgbaData;
}

function uniqueColours(rgba) {
    var uniqueColors = [];
    for (var i=0; i<rgba.length; i++) {
        if (uniqueColors.indexOf(rgba[i]) < 0) {
            uniqueColors.push(rgba[i]);
        }
    }
    return uniqueColors;
}

/*
LZW compression
====================

1. Establish the Code Size - Define the number of bits needed to represent the
actual data.

2. Compress the Data - Compress the series of image pixels to a series of
compression codes.

3. Build a Series of Bytes - Take the set of compression codes and convert to a
string of 8-bit bytes.

4. Package the Bytes - Package sets of bytes into blocks preceded by character
counts and output.
*/
function lzwCompress(canvas) {
    var rgba = context2rgba(canvas.getContext("2d"));
    var uniqueColors = uniqueColors(rgba);
    var codeSize = bitLength(uniqueColors.length) + 1;
    var clearCode = 1 << codeSize;
    var terminator = clearCode + 1;
    var compressionTable = [];
    var compressionIndex;
    var i;
    var bitOs;

    for (i=0; i<rgba.length; i++) {
        compressionIndex = compressionTable.indexOf(rgba[i]);
        if (compressionIndex >= 0) {
            bitOs.put(compressionIndex);
        } else {
            compressionTable.push(rgba[i]);
            bitOs.put(rgba[i]);
        }
    }
}


