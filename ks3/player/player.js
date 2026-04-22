const audio = document.getElementById("audio");
const playPauseButton = document.getElementById("playPause");
const playIcon = document.getElementById("playIcon");
const volumeInput = document.getElementById("volume");
const playerStatus = document.getElementById("playerStatus");
const statusFrame = document.getElementById("statusFrame");
const playIconSrc = "./icons/play.svg";
const pauseIconSrc = "./icons/pause.svg";
const volumeStorageKey = "konata-player-volume";
let userHasInteracted = false;

function setStatus(message) {
    if (playerStatus) playerStatus.textContent = message;
}

function pingStatusFrame(state) {
    if (!statusFrame?.contentWindow) return;
    statusFrame.contentWindow.postMessage({ type: "player-state", state }, window.location.origin);
}

function syncButtonState() {
    const isPlaying = !audio.paused;
    playIcon.src = isPlaying ? pauseIconSrc : playIconSrc;
    playPauseButton.setAttribute("aria-label", isPlaying ? "Pausar radio" : "Reproducir radio");
    pingStatusFrame(isPlaying ? "playing" : "paused");
}

function restoreVolume() {
    const savedVolume = window.localStorage.getItem(volumeStorageKey);
    const parsedVolume = savedVolume === null ? Number(volumeInput.value) : Number(savedVolume);
    const safeVolume = Number.isFinite(parsedVolume) ? Math.min(1, Math.max(0, parsedVolume)) : 1;

    volumeInput.value = String(safeVolume);
    audio.volume = safeVolume;
}

async function startPlayback() {
    await audio.play();
    setStatus("Radio reproduciéndose.");
}

function markInteraction() {
    userHasInteracted = true;
}

async function togglePlayback() {
    markInteraction();

    try {
        if (audio.paused) {
            await startPlayback();
        } else {
            audio.pause();
            setStatus("Radio en pausa.");
        }
    } catch (error) {
        console.error("No se pudo iniciar la reproducción:", error);
        setStatus("La reproducción automática fue bloqueada. Usa el botón play.");
    } finally {
        syncButtonState();
    }
}

volumeInput.addEventListener("input", event => {
    markInteraction();
    const nextVolume = Number(event.target.value);
    audio.volume = nextVolume;
    window.localStorage.setItem(volumeStorageKey, String(nextVolume));
});

volumeInput.addEventListener("change", markInteraction);

playPauseButton.addEventListener("click", togglePlayback);
audio.addEventListener("play", syncButtonState);
audio.addEventListener("pause", syncButtonState);
audio.addEventListener("play", () => {
    setStatus("Radio reproduciéndose.");
    pingStatusFrame("playing");
});
audio.addEventListener("pause", () => {
    setStatus("Radio en pausa.");
    pingStatusFrame("paused");
});
audio.addEventListener("waiting", () => {
    setStatus("Cargando transmisión...");
    pingStatusFrame("buffering");
});
audio.addEventListener("stalled", () => {
    setStatus("Reconectando transmisión...");
    pingStatusFrame("buffering");
});
audio.addEventListener("canplay", () => pingStatusFrame(audio.paused ? "paused" : "playing"));
audio.addEventListener("error", () => {
    console.error("Error en la transmisión de audio.");
    setStatus("Error en la transmisión. Intentando reconectar...");
    pingStatusFrame("error");
    audio.load();
});

window.addEventListener("online", () => {
    pingStatusFrame("buffering");
    if (audio.paused && !userHasInteracted) return;
    audio.load();
    startPlayback().catch(() => {
        setStatus("Conexión recuperada. Presiona play si la radio no continúa.");
        pingStatusFrame("paused");
    });
});

window.addEventListener("offline", () => {
    setStatus("Sin conexión. Esperando red...");
    pingStatusFrame("offline");
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        pingStatusFrame(audio.paused ? "paused" : "playing");
    }
});

statusFrame?.addEventListener("load", () => {
    pingStatusFrame(audio.paused ? "paused" : "playing");
});

playPauseButton.addEventListener("touchstart", markInteraction, { passive: true });

restoreVolume();
syncButtonState();
startPlayback().catch(() => {
    setStatus("Autoplay bloqueado. Presiona play para escuchar.");
    pingStatusFrame("paused");
    syncButtonState();
});
