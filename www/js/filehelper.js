'use strict'

/**
 * File handling stuff
 * Cordova have really complicated file handling
 */
var FileHelper = {}

/**
 * Internal data directory, not synced, persistent
 * @type {string}
 */
FileHelper.DATA_DIRECTORY = null

/**
 * External data directory on android (not private), for other OS its the same as DATA_DIRECTORY
 * @type {string}
 */
FileHelper.EXTERNAL_DATA_DIRECTORY = null

/**
 * Use a proxy instead of real filesystem
 * Local development only
 * @type {boolean}
 */
FileHelper.useProxy = false

/**
 * The proxy url
 * Local development only
 * @type {string}
 */
FileHelper.proxyUrl = 'http://localhost:3001/'

/**
 * Setup
 */
FileHelper.setup = function () {
  // if we are in a browser mode we have to deal with super special handlers using a proxy
  if (typeof cordova === 'undefined' || device.platform.toLowerCase() === 'browser') {
    FileHelper.useProxy = true
    return
  }
  FileHelper.DATA_DIRECTORY = cordova.file.dataDirectory
  FileHelper.EXTERNAL_DATA_DIRECTORY = cordova.file.externalDataDirectory
  // browser have only one specific storage path available
  if (device.platform.toLowerCase() === 'browser') {
    FileHelper.EXTERNAL_DATA_DIRECTORY = 'cdvfile://localhost/persistent/'
  }
  // non android device doesnt have an external data directory
  if (device.platform.toLowerCase() !== 'android') {
    FileHelper.EXTERNAL_DATA_DIRECTORY = FileHelper.DATA_DIRECTORY
  }
}

/**
 * A cache to prevent multiple write calls to happen at once
 * @type {{}}
 */
FileHelper.writeCalls = {}

/**
 * Do a proxy request
 * @param {string} action
 * @param {string} directory
 * @param {string} filename
 * @param {string|null=} fileData
 * @param {Object=} options
 * @returns {Promise}
 */
FileHelper.proxyRequest = function (action, directory, filename, fileData, options) {
  return $.post(FileHelper.proxyUrl, {
    'action': action,
    'directory': encodeURIComponent(directory),
    'filename': filename,
    'fileData': App.btoaUnicode(fileData),
    'options': options
  })
}

/**
 * Get apps root directory url
 * @param {string} directory
 * @return {string}
 */
FileHelper.getDirectoryEntryUrl = function (directory) {
  if (FileHelper.useProxy) {
    return FileHelper.proxyUrl + encodeURIComponent(directory)
  }
  return directory
}

/**
 * Get apps root directory
 * Attention: This doesnt work for browser mode
 * @param {string} directory
 * @returns {Promise<Entry>}
 */
FileHelper.getDirectoryEntry = function (directory) {
  return new Promise(function (resolve, reject) {
    window.resolveLocalFileSystemURL(directory, function (entry) {
      resolve(entry)
    }, reject)
  })
}

/**
 * Get a file entry for the given path in the apps root directory
 * Ensure to create the file if not exist
 * Attention: This doesnt work for browser mode
 * @param {string|FileEntry} filename If is a filentry, just bypass the entry
 * @param {string} directory
 * @param {boolean} create Create the file if not exist
 * @returns {Promise<Entry>}
 */
FileHelper.getFileEntry = function (filename, directory, create) {
  return new Promise(function (resolve, reject) {
    if (filename instanceof FileEntry) {
      resolve(filename)
      return
    }
    FileHelper.getDirectoryEntry(directory).then(function (dir) {
      dir.getFile(filename, {'create': create}, function (fileEntry) {
        resolve(fileEntry)
      }, reject)
    })
  })
}

/**
 * Get all information about a file such as directory, filename, size
 * Ensure to create the file if not exist
 * @param {string|FileEntry} filename If is a filentry, just bypass the entry
 * @param {string} directory
 * @returns {Promise<Object>}
 */
FileHelper.getFileStats = function (filename, directory, create) {
  return new Promise(function (resolve, reject) {
    if (FileHelper.useProxy) {
      return FileHelper.proxyRequest('filestats', directory, filename).then(function (result) {
        result = JSON.parse(result)
        if (result) {
          result.directory = directory
          result.filename = filename
        }
        resolve(result)
      }, reject)
    }
    var getStats = function (fileEntry) {
      if (!fileEntry) {
        resolve(null)
        return
      }
      fileEntry.getMetadata(function (metadata) {
        resolve({
          'directory': directory,
          'filename': filename,
          'size': metadata.size
        })
      })
    }
    if (filename instanceof FileEntry) {
      getStats(filename)
      return
    }
    FileHelper.getDirectoryEntry(directory).then(function (dir) {
      dir.getFile(filename, {'create': false}, function (fileEntry) {
        getStats(fileEntry)
      }, reject)
    })
  })
}

/**
 * Delete a file
 * @param {string|FileEntry} filename
 * @param {string} directory
 * @returns {Promise<boolean>}
 */
FileHelper.deleteFile = function (filename, directory) {
  return new Promise(function (resolve, reject) {
    if (FileHelper.useProxy) {
      return FileHelper.proxyRequest('deletefile', directory, filename).then(resolve, reject)
    }
    FileHelper.getFileEntry(filename, directory, false).then(function (fileEntry) {
      if (fileEntry) {
        fileEntry.remove()
        resolve(true)
        return
      }
      resolve(false)
    }, reject)
  })
}

/**
 * Read the contents of a file
 * @param {string|FileEntry} filename
 * @param {string} directory
 * @param {boolean} create Create the file if not exist
 * @param {string} method (readAsText, readAsBinary, ...)
 * @returns {Promise<string>}
 */
FileHelper.readFile = function (filename, directory, create, method) {
  return new Promise(function (resolve, reject) {
    if (FileHelper.useProxy) {
      return FileHelper.proxyRequest('readfile', directory, filename, null, {'method': method}).then(resolve, reject)
    }
    var done = function (fileEntry) {
      fileEntry.file(function (file) {
        var reader = new FileReader()
        reader.onloadend = function () {
          resolve(this.result)
        }
        reader.onerror = reject
        reader[method](file)
      }, reject)
    }
    if (filename instanceof FileEntry) {
      done(filename)
    } else {
      FileHelper.getFileEntry(filename, directory, create).then(done)
    }
  })
}

/**
 * Copy/Move a file
 * @param {string} method copy or move
 * @param {string|FileEntry} srcFilename
 * @param {string} srcDirectory
 * @param {string} destFilename
 * @param {string} destDirectory
 * @returns {Promise<FileEntry>}
 */
FileHelper.copyMoveFile = function (method, srcFilename, srcDirectory, destFilename, destDirectory) {
  return new Promise(function (resolve, reject) {
    if (FileHelper.useProxy) {
      return FileHelper.proxyRequest(method + 'file', srcDirectory, srcFilename, null, {
        'directory': encodeURIComponent(destDirectory),
        'filename': destFilename
      }).then(resolve, reject)
    }
    FileHelper.getFileEntry(srcFilename, srcDirectory, false).then(function (fileEntry) {
      if (fileEntry) {
        FileHelper.getDirectoryEntry(destDirectory).then(function (dir) {
          fileEntry[method + 'To'](dir, destFilename, function () {
            resolve(fileEntry)
          }, reject)
        }, reject)
      }
    }, reject)
  })
}

/**
 * Write the given contents to the given filename
 * @param {string|FileEntry} filename
 * @param {string} directory
 * @param {string} type eg: text/plain, image/jpg
 * @param {string|Blob} contents
 * @param {boolean} append
 * @returns {Promise<boolean>}
 */
FileHelper.writeFile = function (filename, directory, type, contents, append) {
  return new Promise(function (resolve, reject) {
    if (FileHelper.useProxy) {
      return FileHelper.proxyRequest('writefile', directory, filename, contents).then(resolve, reject)
    }
    // if file currently will be written than save the call for later
    if (typeof FileHelper.writeCalls[filename] !== 'undefined' && FileHelper.writeCalls[filename].inProgress) {
      FileHelper.writeCalls[filename].calls.push({
        'type': type,
        'contents': contents,
        'append': append,
        'directory': directory
      })
      return
    }
    if (typeof FileHelper.writeCalls[filename] === 'undefined') {
      FileHelper.writeCalls[filename] = {
        'calls': [],
        'inProgress': false
      }
    }
    FileHelper.writeCalls[filename].inProgress = true
    var done = function () {
      FileHelper.writeCalls[filename].inProgress = false
      // fire the remaining calls
      if (FileHelper.writeCalls[filename].calls.length) {
        var nextCall = FileHelper.writeCalls[filename].calls.shift()
        FileHelper.writeFile(filename, nextCall.directory, nextCall.type, nextCall.contents, nextCall.append).then(resolve, reject)
        return
      }
      resolve(true)
    }
    var write = function (fileEntry) {
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function () {
          done()
        }
        fileWriter.onerror = reject
        if (append) {
          fileWriter.seek(fileWriter.length)
        }
        var data = contents
        if (!data instanceof Blob) {
          data = new Blob([contents], {'type': type})
        }
        fileWriter.write(data)
      }, reject)
    }
    FileHelper.getFileEntry(filename, directory, true).then(function (fileEntry) {
      if (!append) {
        // truncate file before writing to make sure all contents will be deleted before write
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.truncate(0)
          write(fileEntry)
        })
      } else {
        write(fileEntry)
      }
    })
  })
}