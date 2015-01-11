var textDecoder = new TextDecoder("utf-8");

function ByteView(dataview) {
    var byteCursor = 0;
    var littleEndian = true;

    function nextSlice(n) {
        return dataview.buffer.slice(byteCursor, byteCursor += n);
    }

    function nextUint8() {
        return dataview.getUint8(byteCursor++, littleEndian);
    }

    function nextUint16() {
        var val = dataview.getUint16(byteCursor, littleEndian);
        byteCursor += 2;
        return val;
    }

    return {
        nextUint8: nextUint8,
        nextUint16: nextUint16,
        nextSlice: nextSlice        
    };
}


function stringFormatter(x) {
    return textDecoder.decode(new DataView(x));
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
    
    var ct = [];
    for (i=0; i < 2<<size; i+=1) {
        ct.push({
            r: dv.getUint8(3*i),
            g: dv.getUint8(3*i+1),
            b: dv.getUint8(3*i+2)
        });
    }
    return ct;
}

var gct;

function navigateGif(data, visitor) {
    var header, lsd, imagedescriptor, gctdata, stringdata, subblocklengths, 
        nextChar, sizeOfGct, size, terminatorSeen = false;

    var byteview = new ByteView(data);
    header = stringFormatter(byteview.nextSlice(6));
    visitor.header(header);

    lsd = lsdFormatter(byteview.nextSlice(7));
    visitor.lsd(lsd);

    if (lsd.PackedFields >> 7) { // hasGlobalColorTable
        sizeOfGct = lsd.PackedFields & 7;

        gctdata = byteview.nextSlice(3 * (2 << sizeOfGct));
        gct = colorTableParser(sizeOfGct, gctdata);
        visitor.gct(gct);
    }

    
    while (!terminatorSeen) {
        nextByte = stringFormatter(byteview.nextSlice(1));

        if (!nextByte) {
            break;
        }

        switch(nextByte) {
        case ';': // terminator
            visitor.terminator(nextByte);
            terminatorSeen = true;
            break;
        case '!': // extension
            nextByte = byteview.nextUint8();
            _nb = nextByte;

            switch (nextByte) {
            case 0x1: // read_plain_text_extension
                size = byteview.nextUint8();
                if (size != 12) {
                    throw "Expected size 12! " + size;
                }

                subblocklengths = [];
                do {
                    size = byteview.nextUint8();
                    byteview.nextSlice(size); // throwaway for now.
                    subblocklengths.push(size);
                } while (size > 0);

                visitor.pte({
                    subblocks: subblocklengths.length,
                    totalsize: subblocklengths.reduce(function(x, y) { return x + y; }),
                    textGridLeftPosition: byteview.nextUint16(),
                    TextGridTopPosition: byteview.nextUint16(),
                    TextGridWidth: byteview.nextUint16(),
                    TextGridHeight: byteview.nextUint16(),
                    CharacterCellWidth: byteview.nextUint8(),
                    CharacterCellHeight: byteview.nextUint8(),
                    TextForegroundColorIndex: byteview.nextUint8(),
                    TextBackgroundColorIndex: byteview.nextUint8()
                });

                
                break;
            case 0xf9: // read_graphic_control_extension
                size = byteview.nextUint8();
                if (size != 4) {
                    throw "Expected size 4! " + size;
                }

                visitor.gce({
                    packedFields: byteview.nextUint8(),
                    delayTime: byteview.nextUint16(),
                    transparentColorIndex: byteview.nextUint8()
                });

                bt = byteview.nextUint8();
                if (bt) {
                    throw "Expected block terminator! " + bt;
                }                

                break;
            case 0xfe: // read_comment_extension
                do {
                    size = byteview.nextUint8();
                    stringdata = stringFormatter(byteview.nextSlice(size));
                    visitor.commentExtension(stringdata);
                } while (size > 0);
                break;
            case 0xff: // read_application_extension
                size = byteview.nextUint8();
                if (size != 11) {
                    throw "Expected size 11! " + size;
                }
                stringdata = stringFormatter(byteview.nextSlice(11));
                subblocklengths = [];
                payload = "";
                do {
                    size = byteview.nextUint8();
                    subblocklengths.push(size);

                    if (size > 0) {
                        payload += stringFormatter(byteview.nextSlice(size));
                    }

                } while (size > 0);
                visitor.ape({
                    applicationextension: stringdata,
                    subblocks: subblocklengths.length,
                    totalsize: subblocklengths.reduce(function(x, y) { return x + y; }),
                    payload: payload
                });

                break;
            default:  
                throw "Unexpected byte " + nextByte.toString(16);
            }
            break;
        case ',': // imagedescriptor
            imagedescriptor = {
                imageLeftPosition: byteview.nextUint16(),
                imageTopPosition: byteview.nextUint16(),
                imageWidth: byteview.nextUint16(),
                imageHeight: byteview.nextUint16(),
                packedFields: byteview.nextUint8()
            };
            visitor.imagedescriptor(imagedescriptor);

            if (imagedescriptor.packedFields >> 7) { // has local color table
                sizeoflocalcolortable = imagedescriptor.packedFields & 7;
                var lct = colorTableParser(
                    sizeoflocalcolortable,
                    byteview.nextSlice(3 * 2 << sizeoflocalcolortable)
                );
                visitor.lct(lct);
            }

            function actualImage(colortable, originalcodesize, width, height) {
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

                    function write(entry) {
                        if (entry.length == 1 && entry[0] == -1) {
                            reset();
                            throw "Unexpected reset code!", cursor;
                        }
                        
                        previous = entry;
                        for (var i=0; i<entry.length; i++) {
                            var x = (cursor + i) % width;
                            var y = (cursor + i - x) / width;
                            var color = colortable[entry[i]];
                            if (typeof color === 'undefined') {
                                throw ("Unknown color " + entry[i] + " at: " + cursor);
                                continue;
                            }

                            var colorString = rgba2colour(color['r'], color['g'], color['b']);
                            context.fillStyle = colorString;
                            context.fillRect(x, y, zoom, zoom);
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
                
                return function(compresseddata) {
                    var imagedata = decompress(compresseddata);
                };
            }

            var lzwminimumcodesize = byteview.nextUint8();
            subblocklengths = [];
            var addData = actualImage(
                    lct || gct,
                    lzwminimumcodesize,
                    imagedescriptor.imageWidth,
                    imagedescriptor.imageHeight);
            do {
                size = byteview.nextUint8();
                addData(byteview.nextSlice(size));
                subblocklengths.push(size);
            } while (size > 0);

            visitor.imagedata({
                lzwminimumcodesize: lzwminimumcodesize,
                subblocks: subblocklengths.length,
                totalsize: subblocklengths.reduce(function(x, y) { return x + y; })
            });

            break;
        default: throw ("Unexpected: '" + nextByte + "'");
        }
    }
}
