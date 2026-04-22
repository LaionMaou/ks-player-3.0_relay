const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPause');
const playIcon = document.getElementById('playIcon');
const volumeSlider = document.getElementById('volume');

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playIcon.src = "https://cdn.jsdelivr.net/gh/laionmaou/icons-vls@main/pause.svg";
    } else {
        audio.pause();
        playIcon.src = "https://cdn.jsdelivr.net/gh/laionmaou/icons-vls@main/play.svg";
    }
});

volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
});