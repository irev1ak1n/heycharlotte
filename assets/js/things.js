(function(){
    var track = document.getElementById('thingsTrack');
    var prev = document.getElementById('thingsPrev');
    var next = document.getElementById('thingsNext');
    if(!track || !prev || !next){ return; }

    function step(){
        var card = track.querySelector('.things-card');
        if(!card){ return 320; }
        var gap = parseFloat(getComputedStyle(track).gap) || 22;
        return card.getBoundingClientRect().width + gap;
    }

    function updateArrows(){
        var max = track.scrollWidth - track.clientWidth - 2;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max;
    }

    prev.addEventListener('click', function(){
        track.scrollBy({ left: -step(), behavior: 'smooth' });
    });

    next.addEventListener('click', function(){
        track.scrollBy({ left: step(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
})();