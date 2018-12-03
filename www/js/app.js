'use strict'

var App = {}

/**
 * @type {Framework7}
 */
App.f7 = null

/**
 * @type {Framework7}
 */
App.f7View = null

/**
 * Setup the app
 */
App.setup = function () {
  var start = function () {
    document.addEventListener('backbutton', function (ev) {
      ev.preventDefault()
      if (!Storage.data.auth || ($('.page-current').attr('data-default') && $('body').attr('data-prevent-close') !== '1')) {
        navigator.app.exitApp()
      } else {
        App.loadPage('/main/')
      }
    }, false)
    FileHelper.setup()
    Storage.setup().then(function () {
      App.f7Setup()
      App.initialize()
    })
  }
  if (typeof cordova !== 'undefined') {
    document.addEventListener('deviceready', start, false)
  } else {
    start()
  }
}

/**
 * F7 setup
 */
App.f7Setup = function () {
  App.f7 = new Framework7({
    root: '#app',
    name: 'kysmr - Fingerprint Keyboard Simulator',
    id: 'kysmrmobile.nullix.at',
    panel: {
      swipe: 'left'
    },
    routes: [
      {
        name: 'main',
        path: '/main/',
        url: './pages/main.html'
      }
    ],
    on: {
      pageInit: function (page) {
        var otherPages = $('.page').not(page.$el).filter('[data-page]')
        otherPages.trigger('page:beforeremove')
        otherPages.remove()
        App.f7.panel.close()
        $('html').attr('data-page', page.$el.attr('data-page'))
        $.getScript('./pages/' + page.$el.attr('data-page') + '.js')
      }
    }
  })
  App.f7View = App.f7.views.create('.view-main', {
    allowDuplicateUrls: true,
    preloadPreviousPage: false,
    materialPageLoadDelay: 50,
    animate: false
  })
  $(document).on('click', '.submit', function () {
    $(this).closest('form').trigger('submit')
  })
}

/**
 * Get object value
 * @param {object=} object
 * @param {string} key
 * @returns {*}
 */
App.getObjectValue = function (object, key) {
  if (!object) {
    return undefined
  }
  var s = key.split('[')
  var v = object
  for (var i in s) {
    var subKey = s[i].replace(/\]/ig, '')
    if (typeof v[subKey] === 'undefined') {
      return undefined
    }
    v = v[subKey]
  }
  return v
}

/**
 * Initialize the app - Set all to defaults
 * Could be called multiple times on app lifetime
 */
App.initialize = function () {
  App.f7.panel.close()
  App.loadPage('/main/')
}

/**
 * Load a page via router.navigate
 * @param {string} pagePath
 */
App.loadPage = function (pagePath) {
  App.f7View.router.navigate(pagePath)
}

/**
 * A quick way to display a toast
 * @param {string} message
 * @param {string} type
 * @param {number=} delay
 */
App.toast = function (message, type, delay) {
  if (!type) {
    type = 'info'
  }
  if (!delay) {
    delay = 5000
  }
  var cssClass = 'bg-color-blue'
  if (type === 'success') {
    cssClass = 'bg-color-green'
  }
  if (type === 'error') {
    cssClass = 'bg-color-red'
  }
  App.f7.toast.show({
    text: message,
    position: 'bottom',
    'cssClass': cssClass,
    closeTimeout: delay,
    closeButton: true,
    'closeButtonText': '<i class="fas fa-times"></i>',
    'closeButtonColor': 'white'
  })
}

/**
 * Scan something
 * @returns {Promise<Object>}
 */
App.scan = function () {
  return new Promise(function (resolve, reject) {
    if (typeof cordova === 'undefined' || typeof cordova.plugins.barcodeScanner === 'undefined') {
      // just return demo content for browser tests
      // just wait some time to simulate a user behaviour
      setTimeout(function () {
        resolve({
          'format': 'QR_CODE',
          'code': '1'
        })
      }, 500)
      return
    }
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        resolve({
          format: result.format,
          code: result.text
        })
      },
      reject,
      {
        preferFrontCamera: false, // iOS and Android
        showFlipCameraButton: false, // iOS and Android
        showTorchButton: true, // iOS and Android
        torchOn: false, // Android, launch with the torch switched on (if available)
        saveHistory: false, // Android, save scan history (default false)
        prompt: 'QR Code im Scanbereich zentrieren', // Android
        resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
        formats: 'QR_CODE', // default: all but PDF_417 and RSS_EXPANDED
        orientation: 'portrait', // Android only (portrait|landscape), default unset so it rotates with the device
        disableAnimations: true, // iOS
        disableSuccessBeep: true // iOS and Android
      }
    )
  })
}



/**
 * Btoa for unicode strings
 * @param {string} str
 * @returns {string}
 */
App.btoaUnicode = function (str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes (match, p1) {
      return String.fromCharCode('0x' + p1)
    }))
}

/**
 * Atob for unicode strings
 * @param {string} str
 * @returns {string}
 */
App.atobUnicode = function (str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

// start the magic
App.setup()