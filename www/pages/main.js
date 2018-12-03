'use strict';
(function () {
  const page = $('.page').filter('[data-page=\'main\']')
  const list = page.find('ul.entries')
  const liTpl = list.find('.template').clone()
  liTpl.removeClass('template')
  list.find('.template').remove()

  function buildTable () {
    let entries = Storage.data.entries || {}
    if (!Object.keys(entries)) {
      list.addClass('hidden')
      return
    }
    list.empty()
    list.removeClass('hidden')
    for (const id in entries) {
      const entryData = entries[id]
      const entry = liTpl.clone()
      entry.find('.item-header').text(entryData.label)
      entry.attr('data-id', id)
      list.append(entry)
    }
  }

  buildTable()

  list.on('click', '.action', function () {
    const li = $(this).closest('li')
    const id = li.attr('data-id')
    const entryData = Storage.data.entries[id]
    const action = $(this).attr('data-action')

    let decryptConfig = {
      clientId: 'kysmrmobile.nullix.at',
      username: entryData.username,
      token: entryData.token,
      dialogTitle: entryData.label,
      disableBackup: true
    }
    App.f7.swipeout.close(li[0])
    if (action === 'entry-delete') {
      App.toast('Entry deleted on this device', 'success')
      delete Storage.data.entries[id]
      Storage.save()
      buildTable()
    }
    FingerprintAuth.decrypt(decryptConfig, function (result) {
      if (!result.withFingerprint || !result.password) {
        App.toast('Not authenticated', 'error')
        return
      }
      $.post(entryData.protocol + '://' + entryData.ip + ':' + entryData.port, {
        'action': action,
        'id': entryData.id,
        'password': btoa(result.password)
      }).done(function (result) {
        if (result === '1') {
          App.toast('Successfully sent to desktop', 'success')
          return
        }
        App.toast('Desktop request has no response', 'error')
      }).fail(function () {
        App.toast('Desktop did not answer with correct status code', 'error')
      })
    }, console.error)

  }).on('click', '.delete', function () {
    const li = $(this).closest('li')
    const id = li.attr('data-id')
    delete Storage.data.entries[id]
    Storage.save()
    App.toast('Entry deleted. You must delete it manually on the desktop too.', 'success')
    buildTable()

  })

  page.on('click', '.scan', function () {
    App.scan().then(function (result) {
      let qrcodeData = JSON.parse(atob(result.code))
      let encryptConfig = {
        clientId: 'kysmrmobile.nullix.at',
        username: qrcodeData.username,
        password: Math.random().toString(32).substring(2),
        dialogTitle: qrcodeData.label,
        disableBackup: true
      }
      FingerprintAuth.encrypt(encryptConfig, function (result) {
        if (!result.withFingerprint || !result.token) {
          App.toast('You must use fingerprint authentication', 'error')
          return
        }
        $.post(qrcodeData.protocol + '://' + qrcodeData.ip + ':' + qrcodeData.port, {
          'action': 'entry-add',
          'id': qrcodeData.id,
          'password': btoa(encryptConfig.password)
        }).done(function (response) {
          if (response === '1') {
            App.toast('Successfully added to desktop', 'success')
          } else {
            App.toast('Desktop request has no response', 'error')
          }
          if (!Storage.data.entries) {
            Storage.data.entries = {}
          }
          Storage.data.entries[qrcodeData.id] = {
            'id': qrcodeData.id,
            'ip': qrcodeData.ip,
            'port': qrcodeData.port,
            'protocol': qrcodeData.protocol,
            'label': qrcodeData.label,
            'username': qrcodeData.username,
            'token': result.token
          }
          Storage.save()
          buildTable()
        }).fail(function () {
          App.toast('Desktop did not answer with correct status code', 'error')
        })
      }, console.error)
    })
  })
})()