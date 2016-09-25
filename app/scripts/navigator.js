import { addImage } from './widgets';
import { renderImage } from './lzw';

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

var gct; // Global color table

export function navigateGif(data, visitor) {
    var header, lsd, imagedescriptor, gctdata, stringdata, subblocklengths, 
        nextChar, sizeOfGct, size, terminatorSeen = false, graphiccontrolextension;

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

    visitor.spacer();
    
    while (!terminatorSeen) {
        let nextByte = stringFormatter(byteview.nextSlice(1));

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
            let _nb = nextByte;

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

                let pte = {
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
                };
                visitor.pte(pte);
                break;
            case 0xf9: // read_graphic_control_extension
                size = byteview.nextUint8();
                if (size != 4) {
                    throw "Expected size 4! " + size;
                }

                graphiccontrolextension = {
                    packedFields: byteview.nextUint8(),
                    delayTime: byteview.nextUint16(),
                    transparentColorIndex: byteview.nextUint8()
                };

                visitor.gce(graphiccontrolextension);

                let bt = byteview.nextUint8();
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
                let payload = "";
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

            var lzwminimumcodesize = byteview.nextUint8();
            var interlaced = (imagedescriptor.packedFields & 64) === 64;
            var canvas = visitor.imageCanvas(imagedescriptor);
            var transparentcolorflag;
            if (typeof graphiccontrolextension !== 'undefined') {
                transparentcolorflag = graphiccontrolextension.packedFields & 1;
            }
            var transparentcolorindex = transparentcolorflag?
                                         graphiccontrolextension.transparentColorIndex : null;
            
            var subblocks = [];
            do {
                size = byteview.nextUint8();
                let subblock = byteview.nextSlice(size);
                subblocks.push(subblock);
            } while (size > 0);

            visitor.imagedata(subblocks, lzwminimumcodesize);

            graphiccontrolextension = null; // The GCE is now out of scope.

            break;
        default: throw ("Unexpected: '" + nextByte + "'");
        }
    }
}

