function BitView(dataView) {

    var bitcursor = 0;
    var bytecursor = 0;

    function readNBits(n) {
        var bitsleft, first, rest, b, bits, shift;
        
        shift = 8 - n - bitcursor;
        if (shift < 0) {
            bitsleft = 8 - bitcursor;
            first = readNBits(bitsleft);
            rest = readNBits(n - bitsleft)
            return (rest << bitsleft) | first;
        }

        b = dataView.getUint8(bytecursor);

        // eg. for n = 4, shift = 4: (b & 0b11110000) >> 4
        bits = ((b & (((1 << n) - 1)) << bitcursor) >> bitcursor);

        bitcursor = (bitcursor + n) % 8;
        if (bitcursor == 0) {
            bytecursor +=1;
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
        return (dataView.byteLength - bytecursor) * 8 - bitcursor;
    }
    
    return {
        readBit: readBit,
        readNBits: readNBits,
        available: available
    };
}

/* Format binary and hex. */
function f(n) {
    return ("00000000" + n.toString(2)).substr(-8)
        + "\t"
        + ("00" + n.toString(16)).substr(-2);
}

function decompress(colortable, originalcodesize, data) {
    _colortable = colortable;
    _codesize = codesize;
    _data = data;
    
    var bytes, bv, table, pixels, entry, k, w, c;
    var clearCode = (1 << originalcodesize);
    var eoiCode = clearCode + 1;
    var codesize = originalcodesize + 1

    bv = BitView(new DataView(data));
    table = colortable.slice(); // copy the array, keeping the references.
    k = bv.readNBits(codesize);
    if (k === clearCode) {
        table = colortable.slice()
        codesize = originalcodesize + 1
    } else {
        console.log("Expected clear code.... oh well.");
    }
    pixels = [];
    k = bv.readNBits(codesize);
    entry = table[k];
    pixels.push(entry);
    w = k;

    var previous = entry;
    
    while (true) {
        if (table.length === (Math.pow(2, codesize) - 1)) {
            codesize += 1;
        }
        k = bv.readNBits(codesize);

        if (k === clearCode) {
            clear();
        } else if (k === eoiCode) {
            console.log("End of information!");
            break;
        } else {
            entry = [].concat(table[k]);

            if (typeof entry === 'undefined') {
                k = previous[0];
                entry = Array.concat(previous, k);
                for (var i=0; i<entry.length; i++) {
                    pixels.push(entry[i]);
                }
                table.push(entry);
            } else {
                for (var i=0; i<entry.length; i++) {
                    pixels.push(entry[i]);
                }
                k = entry[0];
                table.push(Array.concat(previous, k));
            }
            
            w = k;
        }
    }
    return pixels;
}

function compress2(colortable, codesize, data) {
    var indexStream, codeStream, indexBuffer, entry;
    indexStream = BitView(new DataView(data));
    codeStream = [];

    codeStream.push(readClearCode(indexStream));
    indexBuffer.push(indexStream.read());

    while (true) {
        k = indexStream.read();
        entry = codeStream.lookup(indexBuffer + k);
        if (entry) {
            indexBuffer.push(k);
        } else {
            codeStream.put(indexBuffer + k);
            codeStream.push(indexBuffer);
            indexBuffer = k;
        }
    }
}

function decompress2(originalcodesize, data) {
    var indexStream, next, entry;
    var bv = BitView(new DataView(data));
    var codesize = originalcodesize + 1;
    var table;
    var indices = [];
    var resetCode = 1 << originalcodesize;
    var eoiCode = resetCode + 1;
    var previous;

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

    // read the initial reset code.
    if (bv.readNBits(codesize) != resetCode) {
        throw "Expected initial reset code!";
    } else {
        reset();
    }    

    // write the first code
    entry = lookup(nextCode());
    if (!entry) {
        throw "Failed to read first code!";
    }
    write(entry);

    while (bv.available() >= codesize) {
        next = nextCode();
        
        if (next === resetCode) {
            console.log('What to do with a reset code?');
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


