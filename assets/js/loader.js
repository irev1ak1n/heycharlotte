(function(){
    var loader = document.getElementById('siteLoader');
    var fill = document.getElementById('loaderBarFill');
    var pctEl = document.getElementById('loaderPct');
    if(!loader){ return; }

    var KEY = 'hc_loader_seen';
    var fast = false;
    try{ fast = sessionStorage.getItem(KEY) === '1'; }catch(e){}
    try{ sessionStorage.setItem(KEY, '1'); }catch(e){}

    var MIN_SHOW = fast ? 1000 : 1400;
    var TICK = fast ? 60 : 160;
    var STEP_BASE = fast ? 14 : 6;
    var STEP_RAND = fast ? 20 : 9;

    document.body.classList.add('is-loading');

    var pct = 0;
    var target = 0;
    var loaded = false;
    var started = performance.now();

    function render(){
        if(fill){ fill.style.width = pct + '%'; }
        if(pctEl){ pctEl.textContent = Math.round(pct); }
        loader.style.setProperty('--p', (pct / 100).toFixed(3));
    }

    var trickle = setInterval(function(){
        target = Math.min(target + Math.random() * STEP_RAND + 3, loaded ? 100 : 88);
        if(pct < target){
            pct = Math.min(target, pct + Math.random() * STEP_BASE + 2);
            render();
        }
        if(loaded && pct >= 100){
            clearInterval(trickle);
            finish();
        }
    }, TICK);

    function finish(){
        var elapsed = performance.now() - started;
        var wait = Math.max(0, MIN_SHOW - elapsed);
        setTimeout(function(){
            loader.classList.add('done');
            document.body.classList.remove('is-loading');
            window.__loaderFinished = true;
            document.dispatchEvent(new CustomEvent('loaderDone'));
            setTimeout(function(){
                if(loader.parentNode){ loader.parentNode.removeChild(loader); }
            }, 700);
        }, wait);
    }

    window.addEventListener('load', function(){
        loaded = true;
    });

    setTimeout(function(){ loaded = true; }, fast ? 3000 : 8000);
})();