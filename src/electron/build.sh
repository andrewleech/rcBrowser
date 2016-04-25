#!/bin/bash
npm install
./node_modules/.bin/electron-packager ./ --platform=darwin --arch=x64 --overwrite

rm -rf "/Volumes/SpindMac/Users/corona/Library/Application\ Support/Kodi/addons/script.module.webbrowser/lib/webbrowser/bin/rcBrowser-darwin-x64"
cp -a rcBrowser-darwin-x64 "/Volumes/SpindMac/Users/corona/Library/Application\ Support/Kodi/addons/script.module.webbrowser/lib/webbrowser/bin/"

# ./node_modules/.bin/node-inspector  --port 8088 &
# ./node_modules/.bin/electron --debug=5858 ./
