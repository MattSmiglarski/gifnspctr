function rangeRequest(url, from, until, callback) {
    var arrayBuffer;
    var req = new XMLHttpRequest();
    var byterange = "bytes=" + from + "-" + until;
    req.open("GET", url, true);
    req.setRequestHeader("Range", byterange);
    req.responseType = "bytearray";
    req.onload = function(evt) {
        callback(req.response);
    };
    req.send(null);
}

function displayHeader(widget) {
    var from = 0, to=5;
    rangeRequest(
        "http://localhost/Y9ax5kJ.gif",
        from,
        to,
        function(arrayBuffer) {
            widget.setContent(arrayBuffer);
            widget.setRange(from, to);
        });
}

function init() {
    var debug = new DebugOutput(document.getElementById("gifheader"));
    
    Array.every(
        document.querySelectorAll('.header'),
        function(el) {
            el.onclick = function() { displayHeader(debug); };
            el.classList.add("clickable");
        });

}

window.onload = function(evt) {
    init();
}
