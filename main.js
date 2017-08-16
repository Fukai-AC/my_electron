const {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  ipcMain,
  ipcRenderer,
} = require('electron');
const path = require('path');
const url = require('url');

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let win;

function createWindow () {
  global.ipcRender = ipcRenderer;
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 1300,
    height: 800,
    resizable: false,
    movable: true,
    enableLargerThanScreen: false,
    maximizable: false,
    frame: false,
  });
  // 加载应用的 index.html。
  win.loadURL('http://localhost:5000/home', {
    userAgent: 'codemao-application'
  });
  
  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null
  });
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow);

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  // 在这文件，你可以续写应用剩下主进程代码。
  // 也可以拆分成几个文件，然后用 require 导入。
  if (win === null) {
    createWindow()
  }
});

// 在这文件，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。



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
ipcMain.on('hide_window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.minimize();
});