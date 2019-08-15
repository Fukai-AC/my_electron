const {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  ipcMain,
  ipcRenderer,
  dialog,
  shell,
  globalShortcut,
  Tray,
  clipboard,
  Notification,
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
// const check_update = () => {
//   const dev_url = '';
//   const url = '';
//   axios.get(dev_url).then((res) => {
//     if(res.status == 200 && res.data && res.data.version_number !== version) {
//       const index = dialog.showMessageBox({
//         type: 'info',
//         message: '发现新版本请立即更新',
//         buttons: ['取消', '升级']
//       });
//       if (index === 1 && version !== '') {
//         var updateUrl = '';
//         if (process.platform.indexOf('darwin') >= 0) {
//           updateUrl = res.data.mac_url;
//         } else if (process.platform.indexOf('win') >= 0) {
//           updateUrl = res.data.windows_url;
//         }
//         shell.openExternal(updateUrl);
//       }
//     }
//   });
// }
function new_window_listener(ev, url, frameName, disposition, options, additionalFeatures) {
  ev.preventDefault();
  if (frameName === 'normal') {
    // open window as modal
    ev.preventDefault()
    Object.assign(options, {
      frame: true,
      x: win.x + 165,
      y: win.y,
      webPreferences: {
        nodeIntegration: false
      }
    })
    normal_window = new BrowserWindow(options);
    // normal_window.openDevTools();
    ev.newGuest = normal_window;
    ev.newGuest.loadURL(url);
  } else {
    create_full_screen_window(url);
  }
}

function createWindow() {
  app.version = '1.2.0';
  globalShortcut.register('CommandOrControl+Shift+o', () => {
    BrowserWindow.getFocusedWindow().openDevTools();
  })
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
  // win.openDevTools();
  win.webContents.on('new-window', new_window_listener);
  win.loadURL('', {
    userAgent: ''
  });
  win.on('closed', () => {
    app.quit();
  });
  // create menu
  var template = [
    {
      label: "编程猫",
      submenu: [
        { label: "退出编程猫", accelerator: "CmdOrCtrl+Q", click: function() { app.quit(); }}
      ]
    },
    {
      label: "修改",
      submenu: [
        { label: "撤销", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "剪切", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "复制", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "粘贴", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "全选", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    },
    {
      label: "截屏",
      submenu: [
        {
          label: "截图", accelerator: "CmdOrCtrl+P", click: function() {
            const cur_window = BrowserWindow.getFocusedWindow();
            if (!!cur_window) {
              const window_size = cur_window.getSize();
              BrowserWindow.getFocusedWindow().capturePage({x: 0, y: 0, width: window_size[0], height: window_size[1]}, (buffer) => {
                clipboard.writeImage(buffer);
              });
              create_simple_notification({
                title: '截屏成功',
                body: '截图已复制到剪贴板，请在对话框粘贴'
              });
            } else {
              create_simple_notification({
                title: '截屏失败',
                body: '截屏失败，请打开需要截屏的窗口'
              })
            }
          }
        }
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  win.flashFrame(true);
  win.once('focus', () => win.flashFrame(false));
  app.main_win = win;
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
  // window.openDevTools();
  var useragent = '';
  if (url.indexOf('wood') >= 0 || url.indexOf('dev-py') >= 0) {
    useragent = '' + process.versions.chrome;
  }
  window.maximize();
  window.webContents.on('new-window', new_window_listener);
  window.loadURL(url, {
    userAgent: useragent
  });
}

function create_simple_notification(options) {
  const notice = new Notification(options);
  notice.show();
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
  shell.openExternal(url);
});
