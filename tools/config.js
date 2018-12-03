let config = {
  'APP_JAVAKEYTOOL': process.env.JAVA_HOME + '/bin/keytool',
  'APP_CERT_CN': 'Roland Eigelsreiter',
  'APP_CERT_OU': 'Nullix',
  'APP_ROOT': __dirname + '/..',
  'APP_KEYSTORE_FILE': __dirname + '/../key/app.pfx',
  'APP_DEBUG_KEYSTORE_FILE': __dirname + '/../key/debug.pfx',
  'APP_APKFOLDER': __dirname + '/../platforms/android/app/build/outputs/apk'
}

let fs = require('fs')
// release config include
if (fs.existsSync(__dirname + '/config.release.js')) {
  let addConfig = require('./config.release.js')
  for (let i in addConfig) {
    config[i] = addConfig[i]
  }
}
module.exports = config