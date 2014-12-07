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
    var header, lsd, gct, imagedescriptor, gctdata, stringdata, subblocklengths, 
        nextChar, sizeOfGct, size, cursor = 0, terminatorSeen = false;

    header = stringFormatter(data.buffer.slice(cursor, cursor += 6));
    visitor.header(header);

    lsd = lsdFormatter(data.buffer.slice(cursor, cursor += 7));
    visitor.lsd(lsd);

    if (lsd.PackedFields >> 7) { // hasGlobalColorTable
        sizeOfGct = lsd.PackedFields & 7;

        gctdata = data.buffer.slice(cursor, cursor += (3 * (2 << sizeOfGct)));
        gct = colorTableParser(sizeOfGct, gctdata);
        visitor.gct(gct);
    }

    
    while (!terminatorSeen) {
        nextByte = stringFormatter(data.buffer.slice(cursor, cursor += 1));

        switch(nextByte) {
        case ';': // terminator
            visitor.terminator(nextByte);
            terminatorSeen = true;
            break;
        case '!': // extension
            nextByte = data.getUint8(cursor++);
            _nb = nextByte;

            switch (nextByte) {
            case 0x1: // read_plain_text_extension
                size = data.getUint8(cursor++);
                if (size != 12) {
                    throw "Expected size 12! " + size;
                }

                subblocklengths = [];
                do {
                    size = data.getUint8(cursor++);
                    cursor += size;
                    subblocklengths.push(size);
                } while (size > 0);

                visitor.pte({
                    subblocks: subblocklengths.length,
                    totalsize: Array.reduce(subblocklengths, function(x, y) { return x + y; }),
                    textGridLeftPosition: data.getUint16(cursor+=2),
                    TextGridTopPosition: data.getUint16(cursor+=2),
                    TextGridWidth: data.getUint16(cursor+=2),
                    TextGridHeight: data.getUint16(cursor+=2),
                    CharacterCellWidth: data.getUint8(cursor++),
                    CharacterCellHeight: data.getUint8(cursor++),
                    TextForegroundColorIndex: data.getUint8(cursor++),
                    TextBackgroundColorIndex: data.getUint8(cursor++)
                });

                
                break;
            case 0xf9: // read_graphic_control_extension
                size = data.getUint8(cursor++);
                if (size != 4) {
                    throw "Expected size 4! " + size;
                }

                visitor.gce({
                    packedFields: data.getUint8(cursor++),
                    delayTime: data.getUint16(cursor+=2),
                    transparentColorIndex: data.getUint8(cursor++)
                });

                bt = data.getUint8(cursor++);
                if (bt) {
                    throw "Expected block terminator! " + bt;
                }                

                break;
            case 0xfe: // read_comment_extension
                do {
                    size = data.getUint8(cursor++);
                    stringdata = stringFormatter(data.buffer.slice(cursor, cursor += size));
                    visitor.commentExtension(stringdata);
                } while (size > 0);
                break;
            case 0xff: // read_application_extension
                size = data.getUint8(cursor++);
                if (size != 11) {
                    throw "Expected size 11! " + size;
                }
                stringdata = stringFormatter(data.buffer.slice(cursor, cursor += 11));
                subblocklengths = [];
                do {
                    size = data.getUint8(cursor++);
                    cursor += size;
                    subblocklengths.push(size);
                } while (size > 0);
                visitor.ape({
                    applicationextension: stringdata,
                    subblocks: subblocklengths.length,
                    totalsize: Array.reduce(subblocklengths, function(x, y) { return x + y; })
                });

                break;
            default:  
                throw "Unexpected byte " + nextByte.toString(16);
            }
            break;
        case ',': // imagedescriptor
            imagedescriptor = {
                imageLeftPosition: data.getUint16(cursor+=2),
                imageTopPosition: data.getUint16(cursor+=2),
                imageWidth: data.getUint16(cursor+=2),
                imageHeight: data.getUint16(cursor+=2),
                packedFields: data.getUint8(cursor++)                
            };
            visitor.imagedescriptor(imagedescriptor);

            if (imagedescriptor.packedFields >> 7) { // has local color table
                sizeoflocalcolortable = imagedescriptor.packedFields & 7;
                var lct = colorTableParser(
                    sizeoflocalcolortable,
                    data.buffer.slice(cursor, cursor += (3 * 2 << sizeoflocalcolortable))
                );
                visitor.lct(lct);
            }

            var lzwminimumcodesize = data.getUint8(cursor++);
            subblocklengths = [];
            do {
                size = data.getUint8(cursor++);
                cursor += size;
                subblocklengths.push(size);
            } while (size > 0);

            visitor.imagedata({
                lzwminimumcodesize: lzwminimumcodesize,
                subblocks: subblocklengths.length,
                totalsize: Array.reduce(subblocklengths, function(x, y) { return x + y; })
            });
            break;
        default:
            throw ("Unexpected at " + cursor + " : " + nextByte);
        }
    }
}
