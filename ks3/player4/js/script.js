const API_URL = "https://stream.host-cx.net.ar/api/nowplaying/2";

async function cargarEstadoRadio() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const streamTitle = document.getElementById("stream_title");
    const liveBox = document.getElementById("live_status");

    document.getElementById("current_song").textContent =
      data.now_playing?.song?.text || "Sin información";

    let bitrate = "--";
    if (data.station?.mounts) {
      const mountDefault = data.station.mounts.find(m => m.is_default === true);
      if (mountDefault) bitrate = mountDefault.bitrate;
    }
    document.getElementById("bitrate").textContent = bitrate;

    if (data.live?.is_live === true) {
      const djName = data.live.streamer_name || "Locutor";
      streamTitle.textContent =
        `${djName} →→ En VIVO en Konata Station Radio`;

      liveBox.classList.remove("live-off");
      liveBox.classList.add("live-on");
    } else {
      streamTitle.textContent = "AutoDJ Online";

      liveBox.classList.remove("live-on");
      liveBox.classList.add("live-off");
    }

  } catch (e) {
    console.error("Error AzuraCast:", e);
  }
}

cargarEstadoRadio();
setInterval(cargarEstadoRadio, 30000);