(function(){
    var box = document.getElementById("heroLyrics");
    if(!box) return;

    var phrases = [
        ["HEY", "CHARLOTTE"],
        ["THE QUEEN", "CITY"],
        ["UPTOWN", "LIGHTS"],
        ["EVERY STREET", "A STORY"],
        ["SUNDAY", "MORNINGS"],
        ["FROM NODA", "TO SOUTH END"],
        ["GOOD FOOD", "GOOD PEOPLE"],
        ["LIVE", "MUSIC"],
        ["FIND YOUR", "PEOPLE"],
        ["FIND YOUR", "PLACE"],
        ["THIS IS", "HOME"],
        ["WE'VE", "GOT", "YOU"]
    ];

    var pairs = [
        ["#1E90FF", "#ffffff"],
        ["#00F5FF", "#ffffff"],
        ["#FF6A00", "#ffffff"],
        ["#FF1493", "#ffffff"],
        ["#39FF14", "#ffffff"],
        ["#FFC400", "#ffffff"],
        ["#00FFD5", "#ffffff"],
        ["#FF4500", "#ffffff"]
    ];

    var sizes = [0.7, 1.0, 1.4, 1.75];
    var stagger = 0.45;
    var popDur = 0.62;

    var pi = 0;
    var paused = false;
    var timers = [];
    var rand = function(min, max){ return Math.random() * (max - min) + min; };

    function clearTimers(){
        timers.forEach(function(t){ clearTimeout(t); });
        timers = [];
    }

    function build(){
        box.innerHTML = "";
        box.style.opacity = 1;

        var words = phrases[pi];
        var pair = pairs[pi % pairs.length];
        words.forEach(function(w, idx){
            var slot = document.createElement("div");
            slot.className = "clt-slot";
            slot.style.fontSize = sizes[Math.floor(Math.random() * sizes.length)] + "em";
            slot.style.transform =
                "translateX(" + Math.round(rand(-110, 110)) + "px) rotate(" + rand(-6, 6).toFixed(1) + "deg)";
            slot.style.margin = Math.round(rand(-8, 12)) + "px 0";

            var span = document.createElement("span");
            span.className = "clt-word";
            span.textContent = w;
            span.style.color = pair[idx % pair.length];
            span.style.animationDelay = (idx * stagger) + "s";

            slot.appendChild(span);
            box.appendChild(slot);
        });

        pi = (pi + 1) % phrases.length;
    }

    function cycle(){
        if(paused){ return; }
        var n = phrases[pi].length;
        build();
        var lastEnd = (n - 1) * stagger + popDur;
        var hold = Math.round((lastEnd + 1.15) * 1000);
        timers.push(setTimeout(function(){ box.style.opacity = 0; }, hold));
        timers.push(setTimeout(cycle, hold + 340));
    }

    document.addEventListener("heroPlayback", function(e){
        var p = e.detail && e.detail.paused;
        if(p){
            if(paused){ return; }
            paused = true;
            clearTimers();
            box.classList.add("is-paused");
        } else {
            if(!paused){ return; }
            paused = false;
            box.classList.remove("is-paused");
            cycle();
        }
    });

    cycle();
})();