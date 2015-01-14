function determineGifUrl() {
    var gifurl = document.location.search.toString().replace(
        /.*gif=([^\&]+).*/,
        function(match, $1) { return $1; }
    );
    return decodeURIComponent(gifurl) || "http://i.imgur.com/EDqGIpG.gif";
}

function initLinks() {
    var el = document.getElementById("links"),
        gifurl = determineGifUrl(),
        links = [];
    
    if (localStorage.getItem('history')) {
        links = JSON.parse(localStorage.getItem('history'));
    }

    if (links.indexOf(gifurl) === -1) {
        links.push(gifurl);
        localStorage.setItem('history', JSON.stringify(links));
    }
    
    var baseUrl = document.location.origin + document.location.pathname + '?' + document.location.search.replace(/[\?\&]*gif=[^\&]+/, '');

    for (var i=0; i<links.length; i++) {
        var linkEl = document.createElement("a");
        linkEl.href = baseUrl + '&gif=' + encodeURIComponent(links[i]);
        linkEl.innerHTML = links[i];
        el.appendChild(linkEl);
    }
}

document.addEventListener("DOMContentLoaded", initLinks);
