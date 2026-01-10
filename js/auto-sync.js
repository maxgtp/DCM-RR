(function () {
  'use strict'

  var _running = false

  async function attemptSync() {
    if (!navigator.onLine) return
    if (_running) return
    if (!window.StorageDB || !window.SaveManager) return

    try {
      var count = await window.StorageDB.countPendingReports().catch(function () { return 0 })
      if (!count || count === 0) return
    } catch (e) {
      return
    }

    _running = true
    try {
      var supabase = window.initSupabase()
      window.showToast('🔄 Sincronizando pendentes automaticamente...', 'info')

      var resultados = await window.SaveManager.sincronizarPendentes(supabase, {
        onProgress: function (p) {
          // opcional: podemos atualizar algum indicador na UI
          console.log('AutoSync progress:', p)
        },
        onItemStatusChange: function (s) {
          console.log('AutoSync item status:', s)
        },
      })

      var sucessos = resultados.filter(function (r) { return r.sucesso }).length
      var falhas = resultados.length - sucessos

      if (sucessos > 0) window.showToast('✅ ' + sucessos + ' relatório(s) sincronizado(s)', 'success')
      if (falhas > 0) window.showToast('⚠️ ' + falhas + ' relatório(s) não sincronizado(s)', 'warning')

    } catch (err) {
      console.error('AutoSync falhou:', err)
      window.showToast('Falha ao sincronizar pendentes automaticamente', 'warning')
    } finally {
      _running = false
    }
  }

  // Escuta reconexão
  window.addEventListener('online', function () {
    // Pequeno atraso para estabilizar a conexão
    setTimeout(attemptSync, 1000)
  })

  // Ao carregar a página, tenta sincronizar se houver pendentes
  document.addEventListener('DOMContentLoaded', function () {
    if (navigator.onLine) {
      // aguarda o StorageDB inicializar (se necessário)
      setTimeout(attemptSync, 1000)
    }
  })

  // Exporta para debug
  window.AutoSync = {
    attemptSync: attemptSync,
    isRunning: function () { return _running }
  }
})()
