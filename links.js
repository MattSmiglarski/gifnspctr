var links = [
    "Y9ax5kJ.gif",
    "GifSample.gif",
    "CBUZdvB.gif",
    "tiny.gif",
    "sample_1.gif",
    "sample_2_animation.gif",
    "black.gif",
    "ronpaul.gif",
    "fshQ1.gif",
    "interlaced.gif"
];

function initLinks() {
    var el = document.getElementById("links"),
        gifregex = /gif=([^&]*)/,
        currentLocation = document.location.toString();

    for (var i=0; i<links.length; i++) {
        var c;
        if (currentLocation.match(gifregex)) {
            c = currentLocation.replace(
                gifregex,
                function(match, $1) { return "gif=" + encodeURIComponent(links[i]); }
            );
        } else {
            c = currentLocation + "?gif=" + encodeURIComponent(links[i]);
        }
        
        var linkEl = document.createElement("a");
        linkEl.href = c;
        linkEl.innerHTML = links[i];
        el.appendChild(linkEl);
    }
}

document.addEventListener("DOMContentLoaded", initLinks);
