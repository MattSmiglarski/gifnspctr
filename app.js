var structure = {
    
};

function BinaryData() {
    return {
        available: function() {}        
    };
}

function ServerResource(url) {
    var cursor = 0;

    return {
        read: function(n) {

        }
    };
}

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


window.onload = function(evt) {
    console.log("Document loaded");
    rangeRequest(
        "http://localhost/Y9ax5kJ.gif",
        0, 5,
        function(arrayBuffer) {
            console.log(arrayBuffer);
            document.getElementById("gifheader").innerHTML = arrayBuffer.slice(0, 5);
        });
}
