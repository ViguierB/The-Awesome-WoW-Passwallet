import { app, BrowserWindow } from 'electron';
import LauncherUpdater from "./launcher-updater"

app.whenReady().then(main)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    main()
  }
})

async function main() {
  let lu = new LauncherUpdater({ isDev: process.env.IS_DEV === 'true' });

  lu.launch();
  const updateReport = await lu.getUpdateReport();
  if (updateReport.aNewVersionIsAvailable === true) {
    //do something
  }

  app.on('window-all-closed', () => {
    if (lu.anUpdateIsInstalling()) {
      return;
    }
    setTimeout(() => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    }, 250)
  })
};
