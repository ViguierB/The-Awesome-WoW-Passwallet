# THE AWESOME WOW PASSWALLET

## The Projet

### A simple launcher for World of Warcraft

It was created to handle multiple accounts for friends who share their accounts.

By clicking on the 'play' button you'll launch wow and your credentials will be magically written into the wow window.

![alt text][screen1]

### Parts

This repo contains 3 projets

- container: the main program that is located in root directory
  - Its purpose is to load/update main electron program that is located in the application folder.

- application: the main program that load front end, accounts and handle wow.

- front-end: the front, writen using React it is located in the html folder.

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

npm run start-dev

## kill the http server
kill $frontpid;

```

### prod

```bash
## build front
( cd html && npm run build )

npm run build && npm start;
```

## Create Release

```bash
## build front
( cd html && npm run build )

npm run build && npm run dist;
```

Release packages can be found in the 'release' folder:

```bash
ls release
  ## >> output
  ...
  'the awesome wow passwallet Setup 1.0.0.exe'
  ...
```

[screen1]: https://gitlab.holidev.net/ben/the-awesome-wow-passwallet/-/raw/docs/images/Screenshot1.png?inline=false "Screenshot 1"
