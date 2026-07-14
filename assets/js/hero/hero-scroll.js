(function(){
    var bar = document.getElementById("scrollProgressBar");
    if(bar){
        var update = function(){
            var doc = document.documentElement;
            var max = doc.scrollHeight - doc.clientHeight;
            var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
            bar.style.width = pct + "%";
        };
        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
    }

    var explore = document.getElementById("heroExplore");
    if(explore){
        explore.addEventListener("click", function(){
            window.scrollTo({ top: Math.round(window.innerHeight * 0.92), behavior: "smooth" });
        });
    }
})();