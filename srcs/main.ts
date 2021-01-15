import LauncherUpdater from "./launcher-updater"

(async () => {
  let lu = new LauncherUpdater();

  lu.launch();
  const updateReport = await lu.getUpdateReport();
  if (updateReport.aNewVersionIsAvailable === true) {
    //do something
  }
})();