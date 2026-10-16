(function(){
    var THEME_ENABLED = false;
    if(!THEME_ENABLED){ return; }

    var KEY = 'hc_theme';
    var root = document.documentElement;

    function apply(theme){
        var light = theme === 'light';
        root.classList.toggle('light', light);
        var btn = document.getElementById('navTheme');
        if(btn){
            btn.setAttribute('aria-pressed', String(light));
            btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
        }
    }

    var saved = 'dark';
    try{ saved = localStorage.getItem(KEY) || 'dark'; }catch(e){}
    apply(saved);

    function bind(){
        var btn = document.getElementById('navTheme');
        if(!btn || btn.dataset.bound === '1'){ return; }
        btn.dataset.bound = '1';
        apply(root.classList.contains('light') ? 'light' : 'dark');
        btn.addEventListener('click', function(){
            var next = root.classList.contains('light') ? 'dark' : 'light';
            try{ localStorage.setItem(KEY, next); }catch(e){}
            apply(next);
        });
    }

    bind();
    document.addEventListener('DOMContentLoaded', bind);
    var tries = 0;
    var iv = setInterval(function(){
        bind();
        if(document.getElementById('navTheme') || ++tries > 40){ clearInterval(iv); }
    }, 100);
})();