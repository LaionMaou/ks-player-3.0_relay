const apiUrl = document.body.dataset.apiUrl;
const mode = document.body.dataset.mode;
const fallbackCover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' rx='12' fill='%231b213d'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='Arial' font-size='22' text-anchor='middle' dominant-baseline='middle'%3EKonata%3C/text%3E%3C/svg%3E";
let requestInFlight = false;
let pollIntervalId = null;

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        element.title = value;
    }
}

function setCover(artUrl) {
    const cover = document.getElementById("cover_art");
    if (!cover) return;
    cover.src = artUrl || fallbackCover;
}

function updateLiveBadge(data) {
    const badge = document.getElementById("live_status");
    if (!badge) return;

    const isLive = data.live?.is_live === true;
    badge.textContent = isLive ? "LIVE" : "AUTO";
    badge.classList.toggle("live-on", isLive);
    badge.classList.toggle("live-off", !isLive);
}

function setBodyState(state) {
    document.body.dataset.playerState = state;
}

function setPollingState(isVisible) {
    const intervalMs = isVisible ? 30000 : 90000;

    if (pollIntervalId) {
        clearInterval(pollIntervalId);
    }

    pollIntervalId = window.setInterval(loadStatus, intervalMs);
}

async function loadStatus() {
    if (requestInFlight) return;
    requestInFlight = true;

    try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const stationName = data.station?.name || "Konata Station";
        const currentSong = data.now_playing?.song?.text || "Sin información";
        const defaultMount = data.station?.mounts?.find(mount => mount.is_default === true);
        const bitrate = defaultMount?.bitrate ?? data.mounts?.[0]?.bitrate ?? "--";
        const listeners = data.listeners?.total ?? 0;

        setText("stream_title", mode === "live" && data.live?.is_live
            ? `${data.live.streamer_name || "Locutor"} · En vivo`
            : stationName);
        setText("current_song", currentSong);
        setText("listeners_count", listeners);
        setText("bitrate", bitrate);
        setCover(data.now_playing?.song?.art);
        updateLiveBadge(data);
        setBodyState(document.body.dataset.playerState || "ready");
    } catch (error) {
        console.error("Error cargando estado:", error);
        setText("stream_title", "No se pudo cargar el estado");
        setText("current_song", "Reintentando...");
        setText("listeners_count", "0");
        setText("bitrate", "--");
        setCover("");
        setBodyState("error");
    } finally {
        requestInFlight = false;
    }
}

loadStatus();
setPollingState(true);

document.addEventListener("visibilitychange", () => {
    const isVisible = document.visibilityState === "visible";
    setPollingState(isVisible);
    if (isVisible) loadStatus();
});

window.addEventListener("message", event => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== "player-state") return;

    setBodyState(event.data.state || "ready");
});
