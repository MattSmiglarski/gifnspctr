let textDecoder = new TextDecoder("utf-8");

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
    var header, logicalScreenDescriptor, imageDescriptor, globalColorTableData,
        stringData, subBlockLengths, nextChar, sizeOfGlobalColorTable, size,
        terminatorSeen = false, graphicControlExtension;

    var byteView = new ByteView(data);
    header = stringFormatter(byteView.nextSlice(6));
    visitor.header(header);

    logicalScreenDescriptor = lsdFormatter(byteView.nextSlice(7));
    visitor.logicalScreenDescriptor(logicalScreenDescriptor);

    if (logicalScreenDescriptor.PackedFields >> 7) { // hasGlobalColorTable
        sizeOfGlobalColorTable = logicalScreenDescriptor.PackedFields & 7;

        globalColorTableData = byteView.nextSlice(3 * (2 << sizeOfGlobalColorTable));
        gct = colorTableParser(sizeOfGlobalColorTable, globalColorTableData);
        visitor.globalColorTable(gct);
    }

    while (!terminatorSeen) {
        let nextByte = stringFormatter(byteView.nextSlice(1));

        if (!nextByte) {
            break;
        }

        switch(nextByte) {
        case ';': // trailer
            visitor.trailer(nextByte);
            terminatorSeen = true;
            break;
        case '!': // extension
            nextByte = byteView.nextUint8();
            let _nb = nextByte;

            switch (nextByte) {
            case 0x1: // read_plain_text_extension
                size = byteView.nextUint8();
                if (size != 12) {
                    throw "Expected size 12! " + size;
                }

                subBlockLengths = [];
                do {
                    size = byteView.nextUint8();
                    byteView.nextSlice(size); // throwaway for now.
                    subBlockLengths.push(size);
                } while (size > 0);

                let pte = {
                    subBlocks: subBlockLengths.length,
                    totalSize: subBlockLengths.reduce(function(x, y) { return x + y; }),
                    textGridLeftPosition: byteView.nextUint16(),
                    TextGridTopPosition: byteView.nextUint16(),
                    TextGridWidth: byteView.nextUint16(),
                    TextGridHeight: byteView.nextUint16(),
                    CharacterCellWidth: byteView.nextUint8(),
                    CharacterCellHeight: byteView.nextUint8(),
                    TextForegroundColorIndex: byteView.nextUint8(),
                    TextBackgroundColorIndex: byteView.nextUint8()
                };
                visitor.plainTextExtension(pte);
                break;
            case 0xf9: // read_graphic_control_extension
                size = byteView.nextUint8();
                if (size != 4) {
                    throw "Expected size 4! " + size;
                }

                graphicControlExtension = {
                    packedFields: byteView.nextUint8(),
                    delayTime: byteView.nextUint16(),
                    transparentColorIndex: byteView.nextUint8()
                };

                visitor.graphicControlExtension(graphicControlExtension);

                let bt = byteView.nextUint8();
                if (bt) {
                    throw "Expected block trailer! " + bt;
                }                

                break;
            case 0xfe: // read_comment_extension
                do {
                    size = byteView.nextUint8();
                    stringData = stringFormatter(byteView.nextSlice(size));
                    visitor.commentExtension(stringData);
                } while (size > 0);
                break;
            case 0xff: // read_application_extension
                size = byteView.nextUint8();
                if (size != 11) {
                    throw "Expected size 11! " + size;
                }
                stringData = stringFormatter(byteView.nextSlice(11));
                subBlockLengths = [];
                let payload = "";
                do {
                    size = byteView.nextUint8();
                    subBlockLengths.push(size);

                    if (size > 0) {
                        payload += stringFormatter(byteView.nextSlice(size));
                    }

                } while (size > 0);
                visitor.applicationExtension({
                    applicationExtension: stringData,
                    subBlocks: subBlockLengths.length,
                    totalSize: subBlockLengths.reduce(function(x, y) { return x + y; }),
                    payload: payload
                });

                break;
            default:  
                throw "Unexpected byte " + nextByte.toString(16);
            }
            break;
        case ',': // imageDescriptor
            imageDescriptor = {
                imageLeftPosition: byteView.nextUint16(),
                imageTopPosition: byteView.nextUint16(),
                imageWidth: byteView.nextUint16(),
                imageHeight: byteView.nextUint16(),
                packedFields: byteView.nextUint8()
            };
            visitor.imageDescriptor(imageDescriptor);

            if (imageDescriptor.packedFields >> 7) { // has local color table
                let sizeOfLocalColorTable = imageDescriptor.packedFields & 7;
                var lct = colorTableParser(
                    sizeOfLocalColorTable,
                    byteView.nextSlice(3 * 2 << sizeOfLocalColorTable)
                );
                visitor.localColorTable(lct);
            }

            var lzwMinimumCodeSize = byteView.nextUint8();
            var interlaced = (imageDescriptor.packedFields & 64) === 64;
            var transparentColorFlag;
            if (typeof graphicControlExtension !== 'undefined') {
                transparentColorFlag = graphicControlExtension.packedFields & 1;
            }
            var transparentcolorindex = transparentColorFlag?
                                         graphicControlExtension.transparentColorIndex : null;
            
            var subBlocks = [];
            do {
                size = byteView.nextUint8();
                let subblock = byteView.nextSlice(size);
                subBlocks.push(subblock);
            } while (size > 0);

            visitor.imageData(subBlocks, lzwMinimumCodeSize);

            graphicControlExtension = null; // The GCE is now out of scope.

            break;
        default: throw ("Unexpected: '" + nextByte + "'");
        }
    }
}