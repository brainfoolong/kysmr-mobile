#!/usr/bin/env node

let del = require('del')
let fs = require('fs')
let platform = process.argv[3]

if (platform === 'android') {
  let fileData = fs.readFileSync('config.xml')
  fileData = fileData.toString()
  fileData = fileData.replace(/id="kysmrmobile\.nullix\.at[a-z0-9\.]*?"/ig, 'id="kysmrmobile.nullix.at"')
  fs.writeFileSync('config.xml', fileData);
  (function () {
    let dirs = ['platforms/android/app/src/main/res']
    dirs.forEach(function (dir) {
      let files = fs.readdirSync(dir)
      files.forEach(function (file) {
        if (file.match(/drawable-(port|land)-/)) {
          del.sync(dir + '/' + file)
        }
      })
    })
  })()
}