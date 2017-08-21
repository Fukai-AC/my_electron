const {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  ipcMain,
  ipcRenderer,
  dialog
} = require('electron');
const { version } = require('./package.json');
const electron = require('electron');
const path = require('path');
const url = require('url');
const axios = require('axios');

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let win;
const check_update = () => {
  axios.get().end((err, res) => {
    if(res.statusCode == 204) {

    }
  });
  const index = dialog.showMessageBox({
    type: 'info',
    message: '发现新版本请立即更新',
    buttons: ['升级', '取消']
  });
  console.log(index);
}

function createWindow () {
  console.log(version);
  global.ipcRender = ipcRenderer;
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 930,
    height: 580,
    resizable: false,
    movable: true,
    maximizable: false,
    frame: false,
    show: false,
    backgroundColor: '#CDFEFF',
  });
  win.once('ready-to-show', () => {
    win.show()
  })
  win.webContents.on('new-window', (ev, url) => {
    ev.preventDefault();
    const displays = electron.screen.getAllDisplays();
    let externalDisplay = displays.find((display) => {
      return display.bounds.x !== 0 || display.bounds.y !== 0
    })
    var window = new BrowserWindow({
      width: externalDisplay.workAreaSize.width,
      height: externalDisplay.workAreaSize.height,
      maximize: false,
    })
    window.setFullScreen(true)
    window.maximize();
    window.loadURL(url);
  });
  win.loadURL('http://192.168.30.235:5050/home', {
    userAgent: 'codemao-application'
  });
  win.on('closed', () => {
    win = null
  });
  // check_update();
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

const menu = new Menu();
menu.append(new MenuItem({
  label: '刷新',
  click: () => {
    win.reload();
  },
}));
app.on('browser-window-created', (ev, window) => {
  window.webContents.on('context-menu', (e, params) => {
    menu.popup(window, params.x, params.y);
  });
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