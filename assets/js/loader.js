(function(){
    var loader = document.getElementById('siteLoader');
    var fill = document.getElementById('loaderBarFill');
    var pctEl = document.getElementById('loaderPct');
    if(!loader){ return; }

    var KEY = 'hc_loader_seen';
    var fast = false;
    try{ fast = sessionStorage.getItem(KEY) === '1'; }catch(e){}
    try{ sessionStorage.setItem(KEY, '1'); }catch(e){}

    var MIN_SHOW = fast ? 500 : 1200;
    var MAX_WAIT = fast ? 3000 : 8000;

    document.body.classList.add('is-loading');

    var shown = 0;
    var shownInt = -1;
    var progress = 0;
    var ready = false;
    var finished = false;
    var started = performance.now();
    var last = started;

    function step(weight){
        var done = false;
        return function(){
            if(done){ return; }
            done = true;
            progress += weight;
        };
    }

    var domDone = step(0.3);
    var fontsDone = step(0.2);
    var videoDone = step(0.5);

    function checkReady(){
        if(progress >= 0.999){ ready = true; }
    }

    document.addEventListener('DOMContentLoaded', function(){
        domDone();
        var video = document.getElementById('heroVideoA');
        if(!video || video.readyState >= 2){
            videoDone();
        }else{
            video.addEventListener('loadeddata', videoDone, { once: true });
            video.addEventListener('error', videoDone, { once: true });
        }
    });

    if(document.fonts && document.fonts.ready){
        document.fonts.ready.then(fontsDone, fontsDone);
    }else{
        fontsDone();
    }

    window.addEventListener('load', function(){ ready = true; });
    setTimeout(function(){ ready = true; }, MAX_WAIT);

    function render(){
        if(fill){ fill.style.transform = 'scaleX(' + (shown / 100).toFixed(4) + ')'; }
        var rounded = Math.round(shown);
        if(pctEl && rounded !== shownInt){
            shownInt = rounded;
            pctEl.textContent = rounded;
        }
        loader.style.setProperty('--p', (shown / 100).toFixed(3));
    }

    function frame(now){
        var dt = Math.min(now - last, 100);
        last = now;
        checkReady();

        var elapsed = now - started;
        var real = progress * 100;
        var target = ready ? 100 : Math.min(92, real + (92 - real) * (1 - Math.exp(-elapsed / 1500)));
        target = Math.min(target, elapsed / MIN_SHOW * 100);

        if(target > shown){
            shown += Math.max((target - shown) * (1 - Math.exp(-dt / 140)), dt * 0.01);
            if(shown > target){ shown = target; }
            render();
        }

        if(ready && shown >= 100){
            finish();
            return;
        }
        requestAnimationFrame(frame);
    }

    function finish(){
        if(finished){ return; }
        finished = true;
        loader.classList.add('done');
        document.body.classList.remove('is-loading');
        window.__loaderFinished = true;
        document.dispatchEvent(new CustomEvent('loaderDone'));
        setTimeout(function(){
            if(loader.parentNode){ loader.parentNode.removeChild(loader); }
        }, 700);
    }

    requestAnimationFrame(frame);
})();
