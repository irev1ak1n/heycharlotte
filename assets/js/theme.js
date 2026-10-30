(function(){
    var THEME_ENABLED = false;
    if(!THEME_ENABLED){ return; }

    var KEY = 'hc_theme';
    var root = document.documentElement;

    function apply(theme){
        var light = theme === 'light';
        root.classList.toggle('light', light);
        document.querySelectorAll('[data-theme-toggle]').forEach(function(btn){
            btn.setAttribute('aria-pressed', String(light));
            btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
            var text = btn.querySelector('[data-theme-text]');
            if(text){ text.textContent = light ? 'Light mode' : 'Dark mode'; }
        });
    }

    var saved = 'dark';
    try{ saved = localStorage.getItem(KEY) || 'dark'; }catch(e){}
    apply(saved);

    function bind(){
        document.querySelectorAll('[data-theme-toggle]').forEach(function(btn){
            if(btn.dataset.bound === '1'){ return; }
            btn.dataset.bound = '1';
            apply(root.classList.contains('light') ? 'light' : 'dark');
            btn.addEventListener('click', function(){
                var next = root.classList.contains('light') ? 'dark' : 'light';
                try{ localStorage.setItem(KEY, next); }catch(e){}
                apply(next);
            });
        });
    }

    bind();
    document.addEventListener('DOMContentLoaded', bind);
    var tries = 0;
    var iv = setInterval(function(){
        bind();
        if(document.querySelector('[data-theme-toggle]') || ++tries > 40){ clearInterval(iv); }
    }, 100);
})();