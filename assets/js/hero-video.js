(function(){
    var a = document.getElementById('heroVideoA');
    var b = document.getElementById('heroVideoB');
    if(!a || !b){ return; }
    var buffers = [a, b];

    var soundBtn = document.getElementById('soundToggle');
    var playBtn = document.getElementById('playToggle');

    var playlist = ['assets/img/clt.mp4', 'assets/img/clt3.mp4', 'assets/img/clt2.mp4'];
    var pIndex = 0;
    var activeBuf = 0;
    var muted = true;
    var paused = false;

    var CROSSFADE = 2.0;
    var transitioning = false;

    buffers.forEach(function(v){ v.loop = false; v.muted = true; v.volume = 1; });

    function current(){ return buffers[activeBuf]; }

    function pop(btn){
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
    }

    function reflectSound(){
        if(soundBtn){
            soundBtn.classList.toggle('is-alt', !muted);
            soundBtn.setAttribute('aria-pressed', String(!muted));
        }
    }

    function safePlay(v){
        var r = v.play();
        if(r && r.catch){ r.catch(function(){}); }
    }

    function loadInto(bufIdx, url){
        var v = buffers[bufIdx];
        v.src = url;
        v.load();
    }

    function rampAudio(fromV, toV){
        var start = performance.now();
        var dur = CROSSFADE * 1000;
        function step(now){
            var t = Math.min(1, (now - start) / dur);
            try{ fromV.volume = Math.max(0, 1 - t); }catch(e){}
            try{ toV.volume = Math.min(1, t); }catch(e){}
            if(t < 1 && transitioning){ requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
    }

    function startCrossfade(){
        if(transitioning){ return; }
        transitioning = true;

        var outgoingIdx = activeBuf;
        var incomingIdx = 1 - activeBuf;
        var outgoing = buffers[outgoingIdx];
        var incoming = buffers[incomingIdx];

        pIndex = (pIndex + 1) % playlist.length;

        try{ incoming.currentTime = 0; }catch(e){}
        incoming.muted = muted;
        incoming.volume = 0;
        incoming.classList.add('is-active');
        outgoing.classList.remove('is-active');

        var r = incoming.play();
        if(r && r.catch){ r.catch(function(){ incoming.muted = true; safePlay(incoming); }); }

        activeBuf = incomingIdx;
        rampAudio(outgoing, incoming);

        var afterIndex = (pIndex + 1) % playlist.length;
        setTimeout(function(){
            outgoing.pause();
            outgoing.volume = 1;
            loadInto(outgoingIdx, playlist[afterIndex]);
            transitioning = false;
        }, CROSSFADE * 1000 + 80);
    }

    buffers.forEach(function(v, i){
        v.addEventListener('timeupdate', function(){
            if(paused || transitioning){ return; }
            if(i !== activeBuf){ return; }
            var d = v.duration;
            if(!d || isNaN(d) || !isFinite(d)){ return; }
            if(d - v.currentTime <= CROSSFADE){ startCrossfade(); }
        });
        v.addEventListener('ended', function(){
            if(paused || transitioning){ return; }
            if(i !== activeBuf){ return; }
            startCrossfade();
        });
    });

    loadInto(1 - activeBuf, playlist[(pIndex + 1) % playlist.length]);

    var evs = ['pointerdown', 'click', 'keydown', 'touchstart'];
    function removeGestures(handler){
        evs.forEach(function(t){ window.removeEventListener(t, handler); });
    }

    var armed = false;
    function armFirstGesture(){
        if(armed){ return; }
        armed = true;
        function handler(e){
            if(soundBtn && e && e.target && soundBtn.contains(e.target)){ return; }
            muted = false;
            current().muted = false;
            var r = current().play();
            if(r && r.then){
                r.then(function(){
                    removeGestures(handler);
                    reflectSound();
                }).catch(function(){
                    muted = true;
                    current().muted = true;
                    reflectSound();
                });
            } else {
                removeGestures(handler);
                reflectSound();
            }
        }
        evs.forEach(function(t){ window.addEventListener(t, handler, { passive: true }); });
    }

    muted = false;
    current().muted = false;
    var kickoff = current().play();
    if(kickoff && kickoff.then){
        kickoff.then(reflectSound).catch(function(){
            muted = true;
            current().muted = true;
            safePlay(current());
            reflectSound();
            armFirstGesture();
        });
    } else {
        reflectSound();
    }

    if(soundBtn){
        soundBtn.addEventListener('click', function(){
            muted = !muted;
            current().muted = muted;
            var other = buffers[1 - activeBuf];
            if(transitioning){ other.muted = muted; }
            safePlay(current());
            reflectSound();
            pop(soundBtn);
        });
    }

    if(playBtn){
        playBtn.addEventListener('click', function(){
            paused = !paused;
            if(paused){
                current().pause();
            } else {
                safePlay(current());
            }
            document.dispatchEvent(new CustomEvent('heroPlayback', { detail: { paused: paused } }));
            playBtn.classList.toggle('is-alt', paused);
            playBtn.setAttribute('aria-pressed', String(!paused));
            pop(playBtn);
        });
    }
})();