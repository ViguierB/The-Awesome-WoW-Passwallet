# THE AWESOME WOW PASSWALLET

## How to build

### Install build env

- Install [NodeJs](https://nodejs.org/)

- Install the project and its dependencies by running

```bash
git clone https://gitlab.holidev.net/ben/the-awesome-wow-passwallet.git;
cd "the-awesome-wow-passwallet";
npm i;
```

Linux users must install libsecret-dev

- Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
- Red Hat-based: `sudo yum install libsecret-devel`
- Arch Linux: `sudo pacman -S libsecret`

### Build

First of all you must build **index.html** page that is located if folder **"html"**

```bash
cd html
npm i;
npm run build
```

Then go back to the root directory of the project and run:

```bash
npm run build
```

## Run

### Dev

```bash
## start front http server in background
( cd html && npm start ) & frontpid=$!

npm start

## kill the http server
kill $frontpid;

```

### prod

```bash
## build front
( cd html && npm run build -- --prod )

npm run build && npm start;
```
