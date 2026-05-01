const { app, BrowserWindow, shell, Menu, ipcMain } = require("electron");
const path = require("path");
const { VoxityMpris } = require("./mpris");

const APP_NAME  = "Voxity";
const START_URL = "https://voxity.dev?electron=true";
const ICON_PATH = path.join(__dirname, process.platform === "win32" ? "APP.ico" : "voxity.png");

app.setName(APP_NAME);
app.setAppUserModelId("com.exerinity.voxity");
if (process.platform === "linux") {
  app.setDesktopName("com.exerinity.voxity.desktop");
}

let mainWindow;
let mprisService;
let statePoller;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: APP_NAME,
    icon: ICON_PATH,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.on("will-prevent-unload", (e) => e.preventDefault());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(START_URL);
  createMenu(mainWindow);

  mainWindow.webContents.once("did-finish-load", () => {
    mprisService = new VoxityMpris(mainWindow);
    mprisService.initialize();
    startStatePolling();
  });

  mainWindow.on("closed", () => {
    stopStatePolling();
    mprisService?.destroy();
    mainWindow = null;
  });
}

ipcMain.on("mpris:state", (_event, state) => {
  mprisService?.updateState(state);
});

const STATE_POLL_INTERVAL = 1000;

const POLL_SCRIPT = `
(function() {
  try {
    const audio = elements?.player;
    if (!audio) return null;

    const loopBtn = document.getElementById('loop');
    const loop = (() => {
      if (!loopBtn) return 'None';
      if (loopBtn.classList.contains('track')) return 'Track';
      if (loopBtn.classList.contains('active')) return 'Playlist';
      return 'None';
    })();

    return {
      title:           metadata?.title  || 'Unknown track',
      artist:          metadata?.artist || 'Unknown artist',
      album:           metadata?.album  || 'Unknown album',
      artUrl:          globalart        || '',
      url:             audio.src        || '',
      trackId:         metadata?.title  || String(audio.src),
      durationSeconds: audio.duration   || 0,
      currentSeconds:  audio.currentTime || 0,
      volume:          audio.volume ?? 1,
      status:          audio.paused ? 'paused' : 'playing',
      shuffle:         !!document.getElementById('shuffle')?.classList.contains('active'),
      loop,
    };
  } catch { return null; }
})();
`;

function startStatePolling() {
  statePoller = setInterval(async () => {
    if (!mainWindow || mainWindow.isDestroyed() || !mprisService) return;
    try {
      const state = await mainWindow.webContents.executeJavaScript(POLL_SCRIPT);
      if (state) mprisService.updateState(state);
    } catch {
    }
  }, STATE_POLL_INTERVAL);
}

function stopStatePolling() {
  if (statePoller) {
    clearInterval(statePoller);
    statePoller = null;
  }
}

function createMenu(win) {
  const run = (code) => {
    if (!win || win.isDestroyed()) return;
    win.webContents.executeJavaScript(code).catch(() => {});
  };

  const template = [
    {
      label: "File",
      submenu: [
        { label: "About",             click: () => run(`msg?.(about_content);`) },
        { label: "Rewelcome",         click: () => run(`welcome?.();`) },
        { label: "Open sleep timer",  click: () => run(`openSleepTimerModal?.();`) },
        { label: "Open settings",     click: () => run(`document.getElementById('settings')?.click();`) },
        { type: "separator" },
        { role: "quit", label: "Exit Voxity" },
      ],
    },
    {
      label: "Playback",
      submenu: [
        { label: "Previous Track",    click: () => run(`previ?.();`) },
        { label: "Back 10 Seconds",   click: () => run(`document.getElementById('rwd')?.click();`) },
        { label: "Toggle Playback",   click: () => run(`document.getElementById('plps')?.click();`) },
        { label: "Forward 10 Seconds",click: () => run(`document.getElementById('fwd')?.click();`) },
        { label: "Next",              click: () => run(`contin?.();`) },
        { type: "separator" },
        { label: "Shuffle",           click: () => run(`document.getElementById('shuffle')?.click();`) },
        { label: "Loop",              click: () => run(`document.getElementById('loop')?.click();`) },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Miscellaneous",
      submenu: [
        { label: "Email",                  click: () => shell.openExternal("https://exerinity.com/email") },
        { label: "Reinject Font Awesome",  click: () => run(`loadFA?.();`) },
        { label: "View release notes",     click: () => run(`relnote?.();`) },
        { label: "Recalculate queue duration", click: () => run(`calqueue?.();`) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});