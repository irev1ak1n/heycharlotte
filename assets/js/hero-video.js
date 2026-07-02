(function(){
    var video = document.getElementById('heroVideo');
    if(!video){ return; }

    var soundBtn = document.getElementById('soundToggle');
    var playBtn = document.getElementById('playToggle');
    var paused = false;

    video.muted = true;
    var kickoff = video.play();
    if(kickoff && kickoff.catch){ kickoff.catch(function(){}); }

    function pop(btn){
        btn.classList.remove('pop');
        void btn.offsetWidth;
        btn.classList.add('pop');
    }

    if(soundBtn){
        soundBtn.addEventListener('click', function(){
            video.muted = !video.muted;
            soundBtn.classList.toggle('is-alt', !video.muted);
            soundBtn.setAttribute('aria-pressed', String(!video.muted));
            pop(soundBtn);
        });
    }

    if(playBtn){
        playBtn.addEventListener('click', function(){
            paused = !paused;
            if(paused){
                video.pause();
            } else {
                video.play();
            }
            playBtn.classList.toggle('is-alt', paused);
            playBtn.setAttribute('aria-pressed', String(!paused));
            pop(playBtn);
        });
    }
})();