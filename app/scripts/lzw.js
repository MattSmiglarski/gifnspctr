/**
 * A container for reading variable bitlength data from a sequence of byte arrays. 
 */
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

export function rgba2colour(r, g, b, a) {
    return '#'
        + ("00" + r.toString(16)).substr(-2)
        + ("00" + g.toString(16)).substr(-2)
        + ("00" + b.toString(16)).substr(-2)
        + (typeof a !== 'undefined'? ("00" + a.toString(16)).substr(-2) : '');
}

export function renderImage(canvas, colortable, originalcodesize, width, height, interlaced, transparentcolorindex) {
    var zoom = 1;
    var cursor = 0;

    var context = canvas.getContext("2d");
    var table = null;
    var codesize = originalcodesize + 1;
    var previous;
    var bv = BitView();

    function decompress(data) {
        var next, entry;
        bv.add(new DataView(data));
        var resetCode = 1 << originalcodesize;
        var eoiCode = resetCode + 1;

        if (data.byteLength === 0) {
            return [];
        }

        function nextCode() {
            /*
             * When the table is full, the encoder can choose to use the table as is, making no
             * changes to it until the encoder chooses to clear it.  The encoder during
             * this time sends out codes that are of the maximum Code Size.
             */
            if (codesize < 12 && table.length === Math.pow(2, codesize)) {
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

            previous = [];

            // write the first code
            next = nextCode();
            entry = lookup(next);
            if (!entry) {
                throw "Failed to read first code!";
            }
            write(entry);
        }

        function lookup(code) {
            var entry = table[code];
            if (typeof entry != 'undefined') {
                return [].concat(entry);
            } else {
                return null;
            }
        }

        // Interlacing
        var pass1 = 1 + Math.floor(height / 8);
        var pass2 = pass1 + 1 + Math.floor((height - 4) / 8);
        var pass3 = pass2 + 1 + Math.floor((height - 2) / 4);

        function write(entry) {
            if (entry.length == 1 && entry[0] == -1) {
                reset();
                throw "Unexpected reset code!", cursor;
            }

            previous = entry;
            for (var i=0; i<entry.length; i++) {
                var x = (cursor + i) % width;
                var y = (cursor + i - x) / width;

                if (interlaced) {
                    if (y < pass1) {
                        y *= 8;
                    } else if (y < pass2) {
                        y = ((y - pass1) * 8) + 4;
                    } else if (y < pass3) {
                        y = ((y - pass2) * 4) + 2;
                    } else {
                        y = ((y - pass3) * 2) + 1;
                    }
                }
                
                var color = colortable[entry[i]];
                if (typeof color === 'undefined') {
                    throw ("Unknown color " + entry[i] + " at: " + cursor);
                    continue;
                } else if (transparentcolorindex != entry[i]) { // Don't fill the transparent colour
                    var colorString = rgba2colour(color['r'], color['g'], color['b']);
                    context.fillStyle = colorString;
                    context.fillRect(x, y, zoom, zoom);
                } else {
                    context.clearRect(x, y, zoom, zoom);
                }
            }
            cursor += i;
        }

        // read the initial reset code if not initialised.
        if (!table) {
            if (bv.readNBits(codesize) != resetCode) {
                throw "Expected initial reset code!";
            } else {
                reset();
            }
        }

        while (bv.available() >= codesize) {
            next = nextCode();
            
            if (next === resetCode) {
                reset();
                next = nextCode();
            } else if (next === eoiCode) {
                break;
            }
            var k;
            entry = lookup(next);

            if (entry) {
                k = entry[0];
                if (table.length < 4096) { // when the decoder's table is full, it must not change the table until a clear code is received.
                    table.push(previous.concat(k));
                }
                write(entry);
            } else {
                k = previous[0];
                if (table.length < 4096) {
                    table.push([k].concat(previous));
                } else {
                    throw "I never expected that.";
                }
                write([k].concat(previous));
            }
        }
    }

    return decompress;
}
