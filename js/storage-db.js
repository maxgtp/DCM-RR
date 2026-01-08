(function (global) {
  "use strict"

  if (global.StorageDB) {
    return
  }

  var DB_NAME = "dcm_storage_db"
  var DB_VERSION = 1
  var STORE_PENDING = "pendingReports"

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error("IndexedDB não suportado neste navegador"))
        return
      }

      var request = global.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = function () {
        reject(request.error || new Error("Falha ao abrir StorageDB"))
      }

      request.onupgradeneeded = function () {
        var db = request.result
        if (!db.objectStoreNames.contains(STORE_PENDING)) {
          var store = db.createObjectStore(STORE_PENDING, { keyPath: "id" })
          store.createIndex("savedAt", "savedAt", { unique: false })
        }
      }

      request.onsuccess = function () {
        resolve(request.result)
      }
    })
  }

  function withStore(mode, callback) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(STORE_PENDING, mode)
        var store = transaction.objectStore(STORE_PENDING)

        var request
        try {
          request = callback(store)
        } catch (err) {
          reject(err)
          db.close()
          return
        }

        if (!request) {
          resolve(undefined)
          db.close()
          return
        }

        request.onsuccess = function (event) {
          resolve(event.target.result)
        }

        request.onerror = function () {
          reject(request.error)
        }

        transaction.oncomplete = function () {
          db.close()
        }

        transaction.onerror = function () {
          reject(transaction.error)
          db.close()
        }
      })
    })
  }

  function ensureId(record) {
    if (record.id) return record.id
    if (global.crypto && global.crypto.randomUUID) {
      record.id = global.crypto.randomUUID()
    } else {
      record.id = "pending:" + Date.now() + ":" + Math.random().toString(16).slice(2)
    }
    return record.id
  }

  function savePendingReport(record) {
    if (!record || !record.protocol) {
      return Promise.reject(new Error("Registro inválido para StorageDB"))
    }

    ensureId(record)
    record.savedAt = record.savedAt || new Date().toISOString()

    return withStore("readwrite", function (store) {
      return store.put(record)
    }).then(function () {
      return record
    })
  }

  function listPendingReports() {
    return withStore("readonly", function (store) {
      return store.getAll()
    }).then(function (items) {
      return (items || []).sort(function (a, b) {
        return new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
      })
    })
  }

  function removePendingReport(id) {
    if (!id) return Promise.resolve()
    return withStore("readwrite", function (store) {
      return store.delete(id)
    })
  }

  function countPendingReports() {
    return withStore("readonly", function (store) {
      return store.count()
    }).then(function (count) {
      return count || 0
    })
  }

  function hasPendingReports() {
    return countPendingReports().then(function (count) {
      return count > 0
    })
  }

  function clearPendingReports() {
    return withStore("readwrite", function (store) {
      return store.clear()
    })
  }

  global.StorageDB = {
    savePendingReport: savePendingReport,
    listPendingReports: listPendingReports,
    removePendingReport: removePendingReport,
    countPendingReports: countPendingReports,
    hasPendingReports: hasPendingReports,
    clearPendingReports: clearPendingReports
  }
})(typeof window !== "undefined" ? window : this)
