const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const asar = require('asar');

(async () => {

  process.chdir(path.dirname(process.argv[1]));

  function rewritePackageFile() {
    const fileBuffer = fs.readFileSync('./package.json');
    const package = JSON.parse(fileBuffer.toString());

    const newPackage = {
      "name": package.name + '-internal-package',
      "version": package.version,
      "main": "main.js",
      "homepage": package.homepage,
      "repository": package.repository,
      "author": package.author,
      "license": package.license,
      "dependencies": package.dependencies
    }
    fs.writeFileSync('./dist/package.json', JSON.stringify(newPackage, null, 2));
  }

  async function runCommandAsync(command) {
    return new Promise((resolve, reject) => {
      console.log(command);

      const npmInstallProcess = exec(`bash -c '${command}'`);
  
      [ 'stdout', 'stdin', 'stderr' ].forEach(
        stdio_ => npmInstallProcess[stdio_].pipe(process[stdio_])
      );
      npmInstallProcess.on('error', (e => {
        reject(`error when lauching '${command}': ${e.message}`);
      }));
      npmInstallProcess.on('exit', (s => {
        if (s === 0) {
          resolve();
        } else {
          reject(`error when lauching '${command}'`);
        }
      }));
    })
  }

  try {
    try {
      var options = JSON.parse(process.argv[2]);
    } catch {
      throw `usage: ${process.argv0} ${process.argv[1]} '{ "out": "outfile.asar", "prod": true }'`;
    }

    
    if (options.clean === true) {
      fs.rmdirSync("./dist", { recursive: true });
      fs.rmdirSync("./bin", { recursive: true });
      fs.rmdirSync("./build", { recursive: true });
      fs.rmdirSync("./10.3.2", { recursive: true });
    }

    if (!fs.existsSync('./dist')) {
      fs.mkdirSync('./dist')
    }
    
    rewritePackageFile();
    await runCommandAsync('cd dist; npm install --only=production');
    await runCommandAsync('../node_modules/.bin/tsc');
    await runCommandAsync('../node_modules/.bin/electron-rebuild');
    fs.copyFileSync("./build/Release/native_executor.node", "./dist/native_executor.node")

    if (options.prod === true) {
      fs.readdirSync('./dist').forEach(p => {
        p = './dist/' + p;
        const s = fs.statSync(p);
        if (s.isFile) {
          const ext = path.extname(p);
  
          if (ext === '.map') {
            fs.unlinkSync(p);
          }
        }
      })

      fs.copyFileSync('../html/build/index.html', './dist/index.html');
    }

    await asar.createPackage('./dist', options.out);

  } catch (e) {
    console.error(e);
    process.exit(-1);
  }

})();