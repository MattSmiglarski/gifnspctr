function DebugOutput(element) {

    var rangeEl = document.createElement("div");
    var contentEl = document.createElement("div");

    element.appendChild(rangeEl);
    element.appendChild(contentEl);

    return {
        setRange: function(from, to) {
            rangeEl.innerHTML = "Range: " + from + " - " + to;
        },

        setContent: function(content) {
            if (typeof(content) == 'string') {
                contentEl.innerHTML = content;
            } else if (typeof(content) == 'object') {
                contentEl.innerHTML = '<pre>' + JSON.stringify(content, null, 2) + '</pre>';
            } else {
                console.log(content);
                content.innerHTML = 'Unknown type ' + typeof(content);
            }
        }
    };
}

function grammar(element) {
}
