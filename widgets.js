function addContainer(content) {
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
    } else if (typeof(content) == 'object') {
        container.innerHTML = '<pre class="smoothcorners">' + JSON.stringify(content, null, 2) + '</pre>';
    } else {
        container.innerHTML = 'Unknown type ' + typeof(content);
    }

    document.getElementById("containers").appendChild(container);
    return container;
}

function addImage(canvas) {
    document.getElementById("containers").appendChild(canvas);
}

function colorTableWidget(gct) {
    var container = document.createElement("div");
    container.title = "Colour table";
    container.classList.add("output");
    container.classList.add("realsquare");
    
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

function addSpacer() {
    var spacer = document.createElement("div");
    spacer.style.clear = "both";
    spacer.style.height = "0";
    document.getElementById("containers").appendChild(spacer);
}
