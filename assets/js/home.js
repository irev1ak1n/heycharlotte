(function(){
    var targets = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    if(!targets.length){ return; }

    if('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if(entry.isIntersecting){
                    entry.target.classList.add('is-revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
        targets.forEach(function(t){ io.observe(t); });
    } else {
        targets.forEach(function(t){ t.classList.add('is-revealed'); });
    }
})();

(function(){
    var btn = document.getElementById('toTop');
    if(!btn){ return; }

    function onScroll(){
        btn.classList.toggle('show', window.scrollY > 600);
    }

    btn.addEventListener('click', function(){
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
})();