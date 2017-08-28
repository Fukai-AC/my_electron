const {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  ipcMain,
  ipcRenderer,
  dialog,
  shell
} = require('electron');
const {
  version
} = require('./package.json');
const electron = require('electron');
const path = require('path');
const url = require('url');
const axios = require('axios');

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let win;
let normal_window;
const check_update = () => {
  const dev_url = 'https://backend-dev.codemao.cn/tiger/pc_client/releases/latest';
  const url = '';
  axios.get(dev_url).then((res) => {
    if(res.status == 200 && res.data && res.data.version_number !== version) {
      const index = dialog.showMessageBox({
        type: 'info',
        message: '发现新版本请立即更新',
        buttons: ['升级', '取消']
      });
      if (index === 0 && version !== '') {
        var updateUrl = '';
        if (process.platform === 'darwin') {
          updateUrl = res.data.mac_url;
        } else if (process.platform.indexOf('win')) {
          updateUrl = res.data.windows_url;
        }
        var isUrl = updateUrl.match(/http:\/\/.+/);
        if (isUrl) {
          shell.openExternal(updateUrl);
        }
      }
    }
  });
}
function new_window_listener(ev, url, frameName, disposition, options, additionalFeatures) {
  ev.preventDefault();
  if (frameName === 'normal') {
    // open window as modal
    ev.preventDefault()
    Object.assign(options, {
      frame: true,
      x: win.x + 165,
      y: win.y
    })
    normal_window = new BrowserWindow(options);
    ev.newGuest = normal_window;
    ev.newGuest.loadURL(url);
  } else {
    create_full_screen_window(url);
  }
}

function createWindow() {
  global.ipcRender = ipcRenderer;
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 930,
    height: 580,
    resizable: false,
    movable: true,
    maximizable: false,
    frame: false,
    backgroundColor: '#CDFEFF',
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      nativeWindowOpen: true
    }
  });
  win.webContents.on('new-window', new_window_listener);
  win.loadURL('http://192.168.30.200:5050/home', {
    userAgent: 'codemao-application'
  });
  win.on('closed', () => {
    win = null
  });
  check_update();
}
function create_full_screen_window(url) {
  const displays = electron.screen.getAllDisplays();
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })
  var window;
  if (externalDisplay) {
    window = new BrowserWindow({
      width: externalDisplay.workAreaSize.width,
      height: externalDisplay.workAreaSize.height,
      icon: path.join(__dirname, 'build/icon.ico'),
      frame: true
    })
  } else {
    window = new BrowserWindow({
      icon: path.join(__dirname, 'build/icon.ico'),
      frame: true
    });
  }
  // window.setFullScreen(true)
  window.maximize();
  window.webContents.on('new-window', new_window_listener);
  window.loadURL(url);
}

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) win.restore()
      win.focus();
  }
})

if (isSecondInstance) {
  app.quit()
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
});

ipcMain.on('show-context-menu', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  menu.popup(win);
});
ipcMain.on('minimize_window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.minimize();
});
ipcMain.on('close_window', (event) => {
  app.quit();
});
ipcMain.on('clear_cache', (event) => {
  win.webContents.clearHistory();
});
ipcMain.on('open_default_browser', (event, url) => {
  console.log(url);
  shell.openExternal(url);
});