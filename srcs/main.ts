import { app, BrowserWindow, shell } from 'electron';
import LauncherUpdater from "./launcher-updater"
import FirstInstallWindow from './first-install-window';

app.whenReady().then(main)

// process.noAsar = true;

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    main()
  }
})

async function promiseAll<T>(promisesAsObject: {[key: string]: Promise<T>}) {
  let resolvedPromises = {} as {[key: string]: T};
  const keys = Object.keys(promisesAsObject);
  return Promise.all(keys.map(k => promisesAsObject[k])).then(results => {
    results.forEach((v, i) => {
      resolvedPromises[keys[i]] = v;
    })
    return resolvedPromises;
  })
}

async function main() {
  let lu = new LauncherUpdater({ isDev: process.env.IS_DEV === 'true' });

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

  let launchError = null;
  await lu.launch().catch(e => launchError = e);
  if (launchError === 'APP_NOT_INSTALLED') {
    let win = new FirstInstallWindow();
    win.start();
    await lu.processFirstInstall(win.getProgressHandler());
    win.close();
    return;
  }

  try {
    var updateReport = await lu.getUpdateReport();
  } catch (e) {
    console.error("cannot fetch update sheet", e);
    return;
  }

  if (process.env.IS_DEV !== 'true') {
    if (updateReport['container'].aNewVersionIsAvailable === true) {
      lu.askForContainerUpdade(updateReport['container']).then(response => {
        if (response === false) { return; }
        let url = "https://gitlab.holidev.net/ben/the-awesome-wow-passwallet/-/releases"
        switch (typeof updateReport['container'].url) {
          case 'object': url = updateReport['container'].url[process.platform as "linux" | "win32"] || url; break;
          case 'string': url = updateReport['container'].url; break;
        }
        shell.openExternal(url)
        app.quit();
      })
    }
    if (updateReport['app'].aNewVersionIsAvailable === true) {
      lu.downloadNewAppUpdate(updateReport['app']).then(() => {
        return lu.askInstanceForApplyAppUpdate(updateReport['app'])
      }).then((r) => {
        if (r) {
          lu.applyPendingUpdate();
        }
      })

    }
  }
};
