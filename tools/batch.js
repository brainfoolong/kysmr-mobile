#!/usr/bin/env node

let exec = require('child_process').exec
let fs = require('fs')
let config = require('./config')

let runCmd = function (cmd, callback) {
  let c = exec(cmd, function (err, stdout, stderr) {
    if (err) {
      process.stderr.write(err.message)
    }
    if (callback) callback(!err && !stderr)
  })
  c.stdout.on('data', function (data) {
    process.stdout.write(data.toString())
  })
  c.stderr.on('data', function (data) {
    process.stderr.write(data.toString())
  })
}

let copyDist = function () {
  let copyFiles = {
    '/../platforms/android/app/build/outputs/apk/debug/app-debug.apk': '/../dist/android-debug.apk',
    '/../platforms/android/app/build/outputs/apk/release/app-release.apk': '/../dist/android-release.apk',
  }
  for (let src in copyFiles) {
    if (fs.existsSync(__dirname + src)) {
      fs.copyFileSync(__dirname + src, __dirname + copyFiles[src])
    }
  }
}

switch (process.argv[2]) {
  case 'create-keystore':
    if (fs.existsSync(config.APP_KEYSTORE_FILE) || fs.existsSync(config.APP_DEBUG_KEYSTORE_FILE)) {
      process.stderr.write('Keystore files already exists, you must delete it before you can create new ones')
      return
    }
    runCmd('"' + config.APP_JAVAKEYTOOL + '" -genkeypair -dname "cn=' + config.APP_CERT_CN + ', ou=' + config.APP_CERT_OU + ', o=' + config.APP_CERT_OU + ', c=AU" -keyalg RSA -keysize 2048 -alias app -keystore ' + config.APP_KEYSTORE_FILE + ' -storepass ' + config.APP_STOREPASS + ' -storetype PKCS12 -validity 9999', function (success) {
      if (success) process.stdout.write(config.APP_KEYSTORE_FILE + ' created\n')
    })
    runCmd('"' + config.APP_JAVAKEYTOOL + '" -genkeypair -dname "cn=' + config.APP_CERT_CN + ', ou=' + config.APP_CERT_OU + ', o=' + config.APP_CERT_OU + ', c=AU" -keyalg RSA -keysize 2048 -alias debug -keystore ' + config.APP_DEBUG_KEYSTORE_FILE + ' -storepass ' + config.APP_STOREPASS + ' -storetype PKCS12 -validity 9999', function (success) {
      if (success) process.stdout.write(config.APP_DEBUG_KEYSTORE_FILE + ' created\n')
    })
    break
  case 'prepare':
    runCmd('cd "' + config.APP_ROOT + '" && cordova prepare')
    break
  case 'browser-run':
    runCmd('cd "' + config.APP_ROOT + '" && cordova run browser')
    break
  case 'android-run':
    runCmd('cd "' + config.APP_ROOT + '" && cordova run android --debug', function () {
      copyDist()
    })
    break
  case 'android-build':
    runCmd('cd "' + config.APP_ROOT + '" && cordova build android --release -- --keystore="' + config.APP_KEYSTORE_FILE + '" --storePassword="' + config.APP_STOREPASS + '" --alias=app --password="' + config.APP_STOREPASS + '"', function () {
      copyDist()
    })
    copyDist()
    break
}