#!/usr/bin/env node

let fs = require('fs')
let platform = process.argv[3]
let mode = process.argv[4];

(function () {
  let fileData = fs.readFileSync('config.xml')
  fileData = fileData.toString()
  fileData = fileData.replace(/id="kysmrmobile\.nullix\.at[a-z0-9\.]*?"/ig, 'id="kysmrmobile.nullix.at' + (mode === '--debug' ? '.debug' : '') + '"')
  fs.writeFileSync('config.xml', fileData)
})()