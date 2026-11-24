const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: '',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'favicon-32x32.png')
  })

  win.removeMenu()
  win.on('page-title-updated', (event) => {
    event.preventDefault()
  })

  win.loadURL('http://localhost/ProyectoFinalArtik3d/validarCredencial.html')
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})