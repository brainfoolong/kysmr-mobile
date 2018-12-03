'use strict'

/**
 * Activate simple events for an object
 * The object will get on, off, emit handlers
 * An 'eventName' has 2 levels, splitted with a dot
 * The first level could be bound multiple times
 * The second level could hold only one handler, if your second level is not *
 * Examples:
 * obj.on('update', function) - Can be used as often as you want, every function will be executed
 * obj.on('update.bar', function) - Can be used as often as you want, only the last bound function will be executed on the eventname
 * @param {object} o
 * @constructor
 */
var Events = function (o) {
  var self = {}
  self.events = {}
  /**
   * Bind an event handler
   * @param {string} eventName
   * @param {function} callback
   * @returns {{once: function}}
   */
  o.on = function (eventName, callback) {
    var s = eventName.split('.')
    var event = {
      'callback': callback,
      'type': 'on'
    }
    if (!s[1]) s[1] = '*'
    if (typeof self.events[s[0]] === 'undefined') {
      self.events[s[0]] = {}
    }
    if (typeof self.events[s[0]][s[1]] === 'undefined' || s[1] !== '*') {
      self.events[s[0]][s[1]] = []
    }
    self.events[s[0]][s[1]].push(event)
    return {
      once: function () {
        event.type = 'once'
      }
    }
  }
  /**
   * Unbind an event handler
   * @param {string} eventName
   */
  o.off = function (eventName) {
    var s = eventName.split('.')
    if (typeof self.events[s[0]] !== 'undefined') {
      if (eventName.length > 1) {
        delete self.events[s[0]][s[1]]
      } else {
        delete self.events[s[0]]
      }
    }
  }
  /**
   * Emit all event handlers
   * @param {string} eventName
   * @param {*} eventData
   */
  o.emit = function (eventName, eventData) {
    var s = eventName.split('.')
    if (!s[1]) s[1] = '*'
    if (typeof self.events[s[0]] !== 'undefined') {
      for (var sub in self.events[s[0]]) {
        if (s[1] === sub || s[1] === '*') {
          (function (eventMain, eventSub) {
            self.events[eventMain][eventSub].forEach(function (entry, index) {
              entry.callback(eventData)
              if (entry.type === 'once') {
                delete self.events[eventMain][eventSub][index]
              }
            })
          })(s[0], sub)
        }
      }
    }
  }
}