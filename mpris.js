const Player = require("mpris-service");

const toMicros = (s) => Math.round((s || 0) * 1e6);
const fromMicros = (us) => (us || 0) / 1e6;

const sanitizeTrackId = (id) => {
  if (!id) return "0";
  return id.replace(/[^A-Za-z0-9_]/g, "_") || "0";
};

const safeNum = (val, fallback = 0) =>
  typeof val === "number" && Number.isFinite(val) ? val : fallback;

class VoxityMpris {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.player = null;
    this.currentPosition = 0;
    this.isReconnecting = false;
  }

  initialize() {
    if (process.platform !== "linux") {
      return;
    }
    this._createPlayer();
  }

  _createPlayer() {
    try {
      if (this.player) {
        this.player.removeAllListeners?.();
        this.player = null;
      }

      this.player = Player({
        name: "voxity",
        identity: "Voxity",
        supportedUriSchemes: ["http", "https"],
        supportedMimeTypes: ["audio/mpeg", "audio/flac", "audio/ogg", "audio/wav", "audio/aac"],
        supportedInterfaces: ["player"],
        desktopEntry: "com.exerinity.voxity",
      });

      this.player.getPosition = () => toMicros(this.currentPosition);

      const forward = (mprisEvent, voxityEvent, transform) => {
        this.player.on(mprisEvent, (data) => {
          if (!this.player || this.isReconnecting) return;
          try {
            const payload = transform ? transform(data) : undefined;
            this._sendToRenderer(voxityEvent, payload);
          } catch (err) {
            console.error(`[MPRIS] Error handling '${mprisEvent}':`, err);
          }
        });
      };

      forward("playpause", "mpris:playpause");
      forward("play",      "mpris:play");
      forward("pause",     "mpris:pause");
      forward("stop",      "mpris:pause");
      forward("next",      "mpris:next");
      forward("previous",  "mpris:previous");

      forward("seek", "mpris:seek", (us) => ({
        seconds: fromMicros(us),
        type: "relative",
      }));

      forward("position", "mpris:seek", (data) => ({
        seconds: fromMicros(data?.position ?? 0),
        type: "absolute",
      }));

      forward("volume", "mpris:volume", (vol) => ({ volume: safeNum(vol, 1) }));

      forward("loopStatus", "mpris:loop", (status) => ({ status }));

      forward("shuffle", "mpris:shuffle", (val) => ({ shuffle: !!val }));

      this.player.on("quit", () => this._sendToRenderer("mpris:quit"));

      this.player.on("error", (err) => {
        console.error("[MPRIS] D-Bus error:", err);
        if (this._isStreamError(err)) this._handleStreamError();
      });

      this.isReconnecting = false;
      console.log("[MPRIS] Service initialized!");
    } catch (err) {
      console.error("[MPRIS] Failed to initialize:", err);
      this._scheduleReconnect();
    }
  }

  updateState(state) {
    if (!this.player || this.isReconnecting) return;

    try {
      this.currentPosition = safeNum(state.currentSeconds, 0);

      const trackId = sanitizeTrackId(state.trackId ?? state.title);
      const duration = safeNum(state.durationSeconds, 0);
      const volume   = Math.max(0, Math.min(1, safeNum(state.volume, 1)));

      this.player.metadata = {
        "mpris:trackid": `/org/mpris/MediaPlayer2/track/${trackId}`,
        "mpris:length":  toMicros(duration),
        "mpris:artUrl":  state.artUrl || "",
        "xesam:title":   state.title  || "Unknown",
        "xesam:artist":  [state.artist || "Unknown"],
        "xesam:album":   state.album  || "",
        "xesam:url":     state.url    || "",
      };

      this.player.playbackStatus = state.status === "paused" ? "Paused" : "Playing";
      this.player.volume         = volume;
      this.player.shuffle        = !!state.shuffle;
      this.player.loopStatus     = state.loop || "None";
    } catch (err) {
      console.error("[MPRIS] Error updating state:", err);
      if (this._isStreamError(err)) this._handleStreamError();
    }
  }

  _sendToRenderer(channel, payload) {
    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("mpris", channel, payload);
      }
    } catch (err) {
      console.error("[MPRIS] Failed to send to renderer:", err);
    }
  }

  _isStreamError(err) {
    return err instanceof Error &&
      (err.message.includes("EPIPE") || err.message.includes("broken"));
  }

  _handleStreamError() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.player = null;
    this._scheduleReconnect();
  }

  _scheduleReconnect(delay = 1000) {
    setTimeout(() => {
      try {
        console.log("[MPRIS] Attempting reconnect...");
        this._createPlayer();
      } catch (err) {
        console.error("[MPRIS] Reconnect failed:", err);
        this.isReconnecting = false;
        this._scheduleReconnect(5000);
      }
    }, delay);
  }

  destroy() {
    this.isReconnecting = false;
    if (this.player) {
      try { this.player.removeAllListeners(); } catch {}
      this.player = null;
    }
    this.currentPosition = 0;
    console.log("[MPRIS] Service destroyed!");
  }
}

module.exports = { VoxityMpris };
