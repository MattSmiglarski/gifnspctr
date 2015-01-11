var links = [
    "Y9ax5kJ.gif",
    "GifSample.gif",
    "CBUZdvB.gif",
    "tiny.gif",
    "sample_1.gif",
    "sample_2_animation.gif",
    "black.gif",
    "ronpaul.gif",
    "fshQ1.gif"
];

function initLinks() {
    var el = document.getElementById("links");

    for (var i=0; i<links.length; i++) {
        var c = document.location.toString().replace(
                /gif=([^&]*)/,
            function(match, $1) { return "gif=" + encodeURIComponent(links[i]); });
        
        var linkEl = document.createElement("a");
        linkEl.href = c;
        linkEl.innerHTML = links[i];
        el.appendChild(linkEl);
    }
}

document.addEventListener("DOMContentLoaded", initLinks);
