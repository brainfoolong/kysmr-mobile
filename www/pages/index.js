'use strict';
(function () {
  setTimeout(function () {
    cordova.getAppVersion.getVersionNumber(function (version) {
      $('.appversion').text(version)
    })
  }, 500)
})()