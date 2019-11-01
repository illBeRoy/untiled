# untiled
> super simple tilemap editor

![image](https://user-images.githubusercontent.com/6681893/67148571-7ce09a80-f2a9-11e9-98e8-c5e938cf73ee.png)

## General
***untiled*** is a small, to point tilemap editor. It's a pet project I started in order to easily create maps to work with in my games, where I don't need many features so keeping stuff simple was top priority.

This is not a perfect software, though - far from it. That's why feedback \ contributions would be much appreciated, so this software can be as convenient and as fun to use as possible.

## Features
* 🗺 Create tile-based maps from png/jpg tilesets
* 💾 Save \ load documents using a standalone JSON format
* 🖼 Export maps to PNG
* ✏️ Frame drawing mode: select a 3x3 tiles group to draw framed areas
* ↩ Undo

## Download
You can find downloadables in the [releases page](https://github.com/illBeRoy/untiled/releases).

## Development
If you wish to work on the project locally, make sure that you have a supported node version (LTS or later).

Start by pulling this project using:
```bash
git clone git@github.com:illBeRoy/untiled.git
```

Then install dependencies using:
```bash
npm install
```

You can start your project by running:
```bash
npm start
```

This mode supports live-reload inside electron.

If you want to build an executable use the following command:
```bash
npm run build
```
It will put the executable inside the `bin` directory.
