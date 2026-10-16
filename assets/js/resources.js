(function(){
    var grid = document.getElementById('rxResults');
    var searchInput = document.getElementById('rxSearch');
    var clearBtn = document.getElementById('rxClear');
    var sortSelect = document.getElementById('rxSort');
    var chipsWrap = document.getElementById('rxChips');
    var emptyState = document.getElementById('rxEmpty');
    var resetBtn = document.getElementById('rxReset');
    var countTotal = document.getElementById('rxTotal');
    var countCats = document.getElementById('rxCatCount');
    if(!grid){ return; }

    var DATA = [];
    var CATS = [];
    var state = { q: '', cat: 'all', sort: 'category' };

    var linkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';

    function esc(s){
        return String(s).replace(/[&<>"]/g, function(c){
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
        });
    }

    function hostname(url){
        try{ return url.replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0]; }
        catch(e){ return 'Visit site'; }
    }

    function cardHTML(item){
        var addr = item.address
            ? '<span class="rx-card-addr">' + pinIcon + '<span>' + esc(item.address) + '</span></span>'
            : '<span class="rx-card-addr">' + pinIcon + '<span>Charlotte, NC</span></span>';
        var quote = item.quote ? '<p class="rx-card-quote">' + esc(item.quote) + '</p>' : '';
        return '<article class="rx-card">'
            + quote
            + '<h3>' + esc(item.name) + '</h3>'
            + '<p>' + esc(item.description) + '</p>'
            + '<div class="rx-card-foot">'
            + addr
            + '<a class="rx-card-link" href="' + esc(item.website) + '" target="_blank" rel="noopener">Visit ' + linkIcon + '</a>'
            + '</div></article>';
    }

    function filtered(){
        var q = state.q.trim().toLowerCase();
        return DATA.filter(function(item){
            if(state.cat !== 'all' && item.category !== state.cat){ return false; }
            if(!q){ return true; }
            return (item.name + ' ' + item.description + ' ' + item.category + ' ' + (item.quote||'')).toLowerCase().indexOf(q) !== -1;
        });
    }

    function render(){
        var items = filtered();

        if(state.sort === 'az'){
            items = items.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });
        } else if(state.sort === 'za'){
            items = items.slice().sort(function(a,b){ return b.name.localeCompare(a.name); });
        }

        if(!items.length){
            grid.innerHTML = '';
            emptyState.classList.add('show');
            return;
        }
        emptyState.classList.remove('show');

        var html = '';
        if(state.sort === 'category'){
            CATS.forEach(function(cat){
                var group = items.filter(function(i){ return i.category === cat; });
                if(!group.length){ return; }
                html += '<section class="rx-section">'
                    + '<div class="rx-section-head"><h2>' + esc(cat) + '</h2>'
                    + '<span class="rx-section-count">' + group.length + (group.length === 1 ? ' resource' : ' resources') + '</span></div>'
                    + '<div class="rx-grid">' + group.map(cardHTML).join('') + '</div></section>';
            });
        } else {
            html = '<section class="rx-section"><div class="rx-grid">'
                + items.map(cardHTML).join('') + '</div></section>';
        }
        grid.innerHTML = html;
    }

    function buildChips(){
        var counts = {};
        DATA.forEach(function(i){ counts[i.category] = (counts[i.category]||0) + 1; });
        var html = '<button class="rx-chip is-active" data-cat="all">All <span>' + DATA.length + '</span></button>';
        CATS.forEach(function(cat){
            html += '<button class="rx-chip" data-cat="' + esc(cat) + '">' + esc(cat) + ' <span>' + counts[cat] + '</span></button>';
        });
        chipsWrap.innerHTML = html;

        chipsWrap.querySelectorAll('.rx-chip').forEach(function(chip){
            chip.addEventListener('click', function(){
                state.cat = chip.getAttribute('data-cat');
                chipsWrap.querySelectorAll('.rx-chip').forEach(function(c){ c.classList.remove('is-active'); });
                chip.classList.add('is-active');
                render();
            });
        });
    }

    function init(list){
        DATA = list;
        var seen = {};
        DATA.forEach(function(i){ if(!seen[i.category]){ seen[i.category] = true; CATS.push(i.category); } });
        CATS.sort();

        if(countTotal){ countTotal.textContent = DATA.length; }
        if(countCats){ countCats.textContent = CATS.length; }

        buildChips();
        render();

        searchInput.addEventListener('input', function(){
            state.q = searchInput.value;
            clearBtn.classList.toggle('show', state.q.length > 0);
            render();
        });

        clearBtn.addEventListener('click', function(){
            searchInput.value = '';
            state.q = '';
            clearBtn.classList.remove('show');
            searchInput.focus();
            render();
        });

        sortSelect.addEventListener('change', function(){
            state.sort = sortSelect.value;
            render();
        });

        if(resetBtn){
            resetBtn.addEventListener('click', function(){
                searchInput.value = '';
                state.q = '';
                state.cat = 'all';
                clearBtn.classList.remove('show');
                chipsWrap.querySelectorAll('.rx-chip').forEach(function(c){ c.classList.remove('is-active'); });
                var first = chipsWrap.querySelector('.rx-chip');
                if(first){ first.classList.add('is-active'); }
                render();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    fetch('/data/resources.json')
        .then(function(r){ return r.json(); })
        .then(init)
        .catch(function(){
            grid.innerHTML = '<p style="color:#7683a0;padding:40px 0;">Could not load resources. Make sure the page is served over a local server (not opened as a file).</p>';
        });
})();