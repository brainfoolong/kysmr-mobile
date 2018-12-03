'use strict'

/**
 * Storage handling
 * Storage will be saved in files on disk
 */
var Storage = {}

/**
 * Directory
 * @type {string}
 */
Storage.directory = ''

/**
 * The storage file
 * @type {string}
 */
Storage.file = '__storage.json'

/**
 * Storage is ready to use
 * @type {boolean}
 */
Storage.ready = false

/**
 * The storage data object
 * @type {object}
 */
Storage.data = {}

/**
 * Setup storage
 * @returns {Promise}
 */
Storage.setup = function () {
  Storage.directory = FileHelper.EXTERNAL_DATA_DIRECTORY
  return FileHelper.readFile(Storage.file, Storage.directory, true, 'readAsText').then(function (data) {
    if (typeof data === 'string') {
      Storage.data = null
      if (data.length) {
        try {
          Storage.data = JSON.parse(data)
        } catch (e) {
          console.error(e)
        }
      }
      Storage.ready = true
      if (!Storage.data) {
        Storage.data = {}
      }
    }
    if (!Storage.data) {
      Storage.data = {}
    }
  })
}

/**
 * Save the data from the storage to the file
 * @returns {Promise<Boolean>}
 */
Storage.save = function () {
  return FileHelper.writeFile(Storage.file, Storage.directory, 'text/plain', JSON.stringify(Storage.data), false)
}

/**
 * Delete the whole storage
 * @returns {Promise<Boolean>}
 */
Storage.clear = function () {
  Storage.data = {}
  return FileHelper.deleteFile(Storage.file, Storage.directory)
}