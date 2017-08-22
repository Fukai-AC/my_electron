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
const check_update = () => {
  // axios.get().end((err, res) => {
  //   if(res.statusCode == 204) {

  //   }
  // });
  const index = dialog.showMessageBox({
    type: 'info',
    message: '发现新版本请立即更新',
    buttons: ['升级', '取消']
  });
  if (index === 0 && version !== '') {
    var updateUrl = "";
    if (process.platform === 'darwin') {
      updateUrl = '';
    } else if (process.platform.indexOf('win')) {
      updateUrl = '';
    }
    var isUrl = updateUrl.match(/http:\/\/.+/);
    if (isUrl) {
      shell.openExternal(updateUrl);
    }
    shell.openExternal('https://static.codemao.cn/my_electron-1.0.0.dmg');
  }
}

function createWindow() {
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
    backgroundColor: '#CDFEFF',
  });
  win.webContents.on('new-window', (ev, url) => {
    ev.preventDefault();
    const displays = electron.screen.getAllDisplays();
    let externalDisplay = displays.find((display) => {
      return display.bounds.x !== 0 || display.bounds.y !== 0
    })
    var window;
    if (externalDisplay) {
      window = new BrowserWindow({
        width: externalDisplay.workAreaSize.width,
        height: externalDisplay.workAreaSize.height,
        maximize: false,
      })
    } else {
      window = new BrowserWindow();
    }
    // window.setFullScreen(true)
    window.maximize();
    window.loadURL(url);
  });
  win.loadURL('http://localhost:5050/home', {
    userAgent: 'codemao-application'
  });
  win.on('closed', () => {
    win = null
  });
  check_update();
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