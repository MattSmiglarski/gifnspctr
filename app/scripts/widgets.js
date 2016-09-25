import { rgba2colour } from './lzw';

export function addHeader(content) {
    var container = document.createElement("div"), header;
    
    container.classList.add("output");
    if (content === 'GIF89a') {
        header = document.createElement("a");
        header.href = 'http://www.w3.org/Graphics/GIF/spec-gif89a.txt';
        header.title = 'Click to visit the GIF89a specification.';
        header.target = '_blank';
    } else {
        header = document.createElement("span");
    }
    
    header.innerHTML = content;
    container.appendChild(header);
    document.getElementById("containers").appendChild(container);
    return container;    
}

export function addContainer(title, content) {
    if (typeof(content) == 'object') {
        var t = document.createElement("table");
        var caption = document.createElement("caption");
        caption.innerHTML = title;

        t.appendChild(caption);
        t.classList.add('output');
        for (var k in content) {
            var trow = document.createElement("tr");
            var tkey = document.createElement("td");
            var tvalue = document.createElement("td");
            tkey.innerHTML = k;
            tvalue.innerHTML = content[k];
            trow.appendChild(tkey);
            trow.appendChild(tvalue);
            t.appendChild(trow);
        }
        document.getElementById("containers").appendChild(t);
        return t;
    }
    
    var container = document.createElement("div");
    container.classList.add("output");
    if (content.length == "") {
        container.classList.add("empty");
    }

    if (content instanceof HTMLElement) {
        container.appendChild(content);
        container.onclick = function(evt) { content.click(); };
    } else if (typeof(content) == 'string') {
        container.innerHTML = content;
    } else {
        container.innerHTML = 'Unknown type ' + typeof(content);
    }

    document.getElementById("containers").appendChild(container);
    return container;
}

export function addImage(canvas) {
    document.getElementById("containers").appendChild(canvas);
}

export function colorTableWidget(gct) {
    var container = document.createElement("div");
    container.title = "Colour table";
    container.classList.add("output");

    var i,j, width = 1, height;

    var sqrt = Math.sqrt(gct.length);
    if (Math.round(sqrt) == sqrt) {
        width = sqrt;
    } else {
        width = Math.sqrt(gct.length << 1);
    }
    height = gct.length / width;
    
    var zoom = 10;
    var canvas = document.createElement("canvas");
    canvas.width = zoom * width;
    canvas.height = zoom * height;
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    var context = canvas.getContext("2d");
    container.appendChild(canvas);
    document.getElementById("containers").appendChild(container);
    

    var color;
    for (i=0; i<height; i++) {
        for (j=0; j<width; j++) {
            color = gct[i*width + j];
            context.fillStyle = rgba2colour(color['r'], color['g'], color['b']);
            context.fillRect(j*zoom, i*zoom, zoom, zoom);
        }
    }
}

export function addSpacer() {
    var spacer = document.createElement("div");
    spacer.classList.add('spacer');
    document.getElementById("containers").appendChild(spacer);
}
