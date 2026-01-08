// Script do painel do agente
// Usa funções globais de config.js

document.addEventListener("DOMContentLoaded", () => {
  // Usa funções globais de config.js
  var requireAuth = window.requireAuth
  var initSupabase = window.initSupabase
  var doLogout = window.doLogout

  // Verifica autenticação
  if (!requireAuth()) return

  var supabase = initSupabase()
  var logoutBtn = document.getElementById("logout-btn")
  var syncBtn = document.getElementById("sync-pending-btn")
  var syncModal = null
  var pendentesCache = []
  var isSyncing = false

  // Tabs
  var tabs = document.querySelectorAll(".panel-tab")
  var tabContents = document.querySelectorAll(".tab-content")

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      var targetTab = tab.getAttribute("data-tab")

      tabs.forEach((t) => t.classList.remove("active"))
      tabContents.forEach((tc) => tc.classList.remove("active"))

      tab.classList.add("active")
      document.getElementById(targetTab + "-tab").classList.add("active")
    })
  })

  // Logout
  logoutBtn.addEventListener("click", () => {
    doLogout()
  })

  // Carrega estatísticas
  loadStats()
  loadOcorrenciasStats()

  // Verifica relatórios pendentes de sincronização
  verificarPendentes()

  if (syncBtn) {
    syncBtn.addEventListener("click", (e) => {
      e.preventDefault()
      abrirModalPendentes()
    })
  }

  function escapeHTML(value) {
    if (!value && value !== 0) return ""
    return String(value).replace(/[&<>"]+/g, function (match) {
      switch (match) {
        case "&":
          return "&amp;"
        case "<":
          return "&lt;"
        case ">":
          return "&gt;"
        case '"':
          return "&quot;"
        default:
          return match
      }
    })
  }

  function formatarDataHora(value) {
    if (!value) return "-"
    var d = new Date(value)
    if (isNaN(d.getTime())) return value
    return d.toLocaleString("pt-BR")
  }

  function criarModalPendentes() {
    if (syncModal) return syncModal

    var modal = document.createElement("div")
    modal.id = "pending-sync-modal"
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content pending-sync-modal">
        <div class="pending-sync-header">
          <h3>Pendências Locais</h3>
          <button type="button" class="pending-sync-close" id="pending-sync-close">&times;</button>
        </div>
        <div class="pending-sync-subtitle" id="pending-sync-subtitle">Carregando...</div>

        <div class="pending-sync-progress" id="pending-sync-progress" style="display:none;">
          <div class="pending-sync-progress-bar">
            <span class="pending-sync-progress-fill" id="pending-sync-progress-fill"></span>
          </div>
          <div class="pending-sync-progress-label" id="pending-sync-progress-label"></div>
        </div>

        <div class="pending-sync-list" id="pending-sync-list"></div>

        <div class="pending-sync-actions">
          <button class="btn btn-outline" id="pending-sync-refresh" type="button">Atualizar</button>
          <button class="btn btn-primary" id="pending-sync-run" type="button">Sincronizar Pendentes</button>
        </div>
        <div class="pending-sync-feedback" id="pending-sync-feedback"></div>
      </div>
    `

    document.body.appendChild(modal)
    syncModal = modal

    document.getElementById("pending-sync-close").addEventListener("click", function () {
      fecharModalPendentes()
    })

    document.getElementById("pending-sync-refresh").addEventListener("click", function () {
      carregarPendentesNoModal()
    })

    document.getElementById("pending-sync-run").addEventListener("click", function () {
      sincronizarPendentesNoModal()
    })

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        fecharModalPendentes()
      }
    })

    return syncModal
  }

  function fecharModalPendentes() {
    if (isSyncing) return
    if (syncModal) {
      syncModal.remove()
      syncModal = null
      pendentesCache = []
    }
  }

  function obterElemento(id) {
    return document.getElementById(id)
  }

  function setBotaoSincronizarEstado(texto, disabled) {
    var btn = obterElemento("pending-sync-run")
    if (!btn) return
    btn.disabled = !!disabled
    btn.textContent = texto
  }

  function atualizarProgresso(percent, label) {
    var box = obterElemento("pending-sync-progress")
    var fill = obterElemento("pending-sync-progress-fill")
    var lab = obterElemento("pending-sync-progress-label")
    if (!box || !fill || !lab) return

    if (percent == null) {
      box.style.display = "none"
      return
    }

    box.style.display = "block"
    fill.style.width = Math.max(0, Math.min(100, percent)) + "%"
    lab.textContent = label || ""
  }

  function setFeedback(message, type) {
    var el = obterElemento("pending-sync-feedback")
    if (!el) return
    el.className = "pending-sync-feedback" + (type ? " is-" + type : "")
    el.textContent = message || ""
  }

  function renderPendentesList(pendentes) {
    var listEl = obterElemento("pending-sync-list")
    if (!listEl) return

    if (!pendentes || pendentes.length === 0) {
      listEl.innerHTML = '<div class="pending-sync-empty">Nenhum relatório pendente.</div>'
      return
    }

    var html = pendentes
      .map(function (p) {
        var nome = escapeHTML(p.nome || "Sem nome")
        var dataHora = escapeHTML(formatarDataHora(p.savedAt || p.data))
        var tipo = escapeHTML(p.tipo || "Texto")

        return (
          '<div class="pending-sync-item" data-pending-id="' +
          escapeHTML(p.id) +
          '">' +
          '<div class="pending-sync-main">' +
          '<div class="pending-sync-name">' +
          nome +
          "</div>" +
          '<div class="pending-sync-meta">' +
          '<span class="pending-sync-meta-item">' +
          dataHora +
          "</span>" +
          '<span class="pending-sync-meta-item">' +
          tipo +
          "</span>" +
          "</div>" +
          "</div>" +
          '<div class="pending-sync-status" id="pending-status-' +
          escapeHTML(p.id) +
          '">Pendente</div>' +
          '<div class="pending-sync-actions-row">' +
          '<button class="btn btn-outline btn-small pending-retry-btn" type="button" data-action="retry" data-id="' +
          escapeHTML(p.id) +
          '">Tentar novamente</button>' +
          '<button class="btn btn-secondary btn-small" type="button" data-action="edit" data-id="' +
          escapeHTML(p.id) +
          '">Editar</button>' +
          '<button class="btn btn-danger btn-small" type="button" data-action="delete" data-id="' +
          escapeHTML(p.id) +
          '">Excluir</button>' +
          "</div>" +
          '<div class="pending-sync-error" id="pending-error-' +
          escapeHTML(p.id) +
          '"></div>' +
          "</div>"
        )
      })
      .join("")

    listEl.innerHTML = html

    listEl.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action")
        var id = btn.getAttribute("data-id")
        if (!id) return
        if (action === "edit") {
          editarPendente(id)
        }
        if (action === "delete") {
          excluirPendente(id)
        }
        if (action === "retry") {
          retryPendente(id)
        }
      })
    })
  }

  function atualizarStatusItem(id, status, message) {
    var statusEl = obterElemento("pending-status-" + id)
    var errEl = obterElemento("pending-error-" + id)
    var retryBtn = document.querySelector(
      '.pending-sync-item[data-pending-id="' + id + '"] .pending-retry-btn'
    )
    if (!statusEl) return

    statusEl.className = "pending-sync-status"
    if (errEl) errEl.textContent = ""
    if (retryBtn) retryBtn.style.display = "none"

    if (status === "syncing") {
      statusEl.textContent = "Sincronizando"
      statusEl.classList.add("is-syncing")
      return
    }

    if (status === "success") {
      statusEl.textContent = "Sincronizado"
      statusEl.classList.add("is-success")
      return
    }

    if (status === "error") {
      statusEl.textContent = "Erro"
      statusEl.classList.add("is-error")
      if (errEl && message) errEl.textContent = message
      if (retryBtn) retryBtn.style.display = "inline-flex"
      return
    }

    statusEl.textContent = "Pendente"
  }

  function abrirModalPendentes() {
    if (!window.SaveManager) return
    criarModalPendentes()
    carregarPendentesNoModal()
  }

  function carregarPendentesNoModal() {
    if (!window.SaveManager) return
    setFeedback("", "")
    atualizarProgresso(null, "")

    var subtitle = obterElemento("pending-sync-subtitle")
    if (subtitle) subtitle.textContent = "Carregando..."

    window.SaveManager.obterRelatoriosPendentes().then(function (pendentes) {
      pendentesCache = pendentes || []
      if (subtitle) subtitle.textContent = pendentesCache.length + " pendência(s) encontrada(s)."
      renderPendentesList(pendentesCache)
      setBotaoSincronizarEstado("Sincronizar Pendentes", pendentesCache.length === 0)
    })
  }

  function editarPendente(id) {
    if (isSyncing) return
    window.location.href = "editar-relatorio.html?pending=" + encodeURIComponent(id)
  }

  function excluirPendente(id) {
    if (isSyncing) return
    if (!window.StorageDB) return

    var ok = window.confirm("Deseja remover esta pendência local?")
    if (!ok) return

    window.StorageDB.removePendingReport(id).then(function () {
      window.showToast("Pendência removida", "success")
      carregarPendentesNoModal()
      verificarPendentes()
    })
  }

  function sincronizarPendentesNoModal() {
    if (!window.SaveManager || isSyncing) return
    if (!pendentesCache || pendentesCache.length === 0) return

    isSyncing = true
    setFeedback("", "")
    setBotaoSincronizarEstado("Sincronizando...", true)

    var ids = pendentesCache.map(function (p) {
      return p.id
    })

    window.SaveManager
      .sincronizarPendentes(supabase, {
        onlyIds: ids,
        onProgress: function (info) {
          atualizarProgresso(info.percent, info.label)
        },
        onItemStatusChange: function (evt) {
          atualizarStatusItem(evt.id, evt.status, evt.message)
        },
      })
      .then(function (resultados) {
        var sucessos = (resultados || []).filter(function (r) {
          return r.sucesso
        }).length
        var falhas = (resultados || []).length - sucessos

        if (falhas > 0) {
          setFeedback(
            "Sincronização concluída com falhas. Você pode tentar novamente.",
            "warning"
          )
        } else {
          setFeedback("Sincronização concluída com sucesso.", "success")
        }

        carregarPendentesNoModal()
        verificarPendentes()
        loadStats()
        loadOcorrenciasStats()
      })
      .finally(function () {
        isSyncing = false
        setBotaoSincronizarEstado("Sincronizar Pendentes", pendentesCache.length === 0)
        atualizarProgresso(null, "")
      })
  }

  function retryPendente(id) {
    if (!window.SaveManager || isSyncing) return

    var pendente = pendentesCache.find(function (p) {
      return p.id === id
    })

    if (!pendente) {
      window.showToast("Pendência não encontrada", "error")
      return
    }

    isSyncing = true
    setFeedback("", "")
    setBotaoSincronizarEstado("Sincronizando...", true)

    window.SaveManager
      .sincronizarPendentes(supabase, {
        onlyIds: [id],
        onProgress: function (info) {
          atualizarProgresso(info.percent, info.label)
        },
        onItemStatusChange: function (evt) {
          atualizarStatusItem(evt.id, evt.status, evt.message)
        },
      })
      .then(function (resultados) {
        var resultado = (resultados || [])[0]
        if (resultado && resultado.sucesso) {
          setFeedback("Pendência sincronizada com sucesso.", "success")
        } else {
          setFeedback("Falha ao sincronizar. Tente novamente.", "warning")
        }

        carregarPendentesNoModal()
        verificarPendentes()
        loadStats()
        loadOcorrenciasStats()
      })
      .finally(function () {
        isSyncing = false
        setBotaoSincronizarEstado("Sincronizar Pendentes", pendentesCache.length === 0)
        atualizarProgresso(null, "")
      })
  }

  function loadStats() {
    supabase
      .from("relatorios")
      .select("status")
      .then((response) => {
        if (response.error) throw response.error

        var data = response.data || []
        var total = data.length
        var pending = data.filter((r) => r.status === "Pendente" || !r.status).length
        var analysis = data.filter((r) => r.status === "Em Análise").length
        var completed = data.filter((r) => r.status === "Concluído").length

        document.getElementById("total-reports").textContent = total
        document.getElementById("pending-reports").textContent = pending
        document.getElementById("analysis-reports").textContent = analysis
        document.getElementById("completed-reports").textContent = completed
      })
      .catch((err) => {
        console.error("Erro ao carregar estatísticas:", err)
      })
  }

  function loadOcorrenciasStats() {
    supabase
      .from("ocorrencias")
      .select("status")
      .then((response) => {
        if (response.error) throw response.error

        var data = response.data || []
        var total = data.length
        var andamento = data.filter((o) => o.status === "Em Andamento" || !o.status).length
        var concluidas = data.filter((o) => o.status === "Concluída").length

        document.getElementById("total-ocorrencias").textContent = total
        document.getElementById("andamento-ocorrencias").textContent = andamento
        document.getElementById("concluidas-ocorrencias").textContent = concluidas
      })
      .catch((err) => {
        console.error("Erro ao carregar estatísticas de ocorrências:", err)
      })
  }

  function verificarPendentes() {
    if (!window.SaveManager) return

    var syncBtn = document.getElementById("sync-pending-btn")
    var countText = document.getElementById("pending-count-text")

    window.SaveManager.obterRelatoriosPendentes().then(function (pendentes) {
      if (!pendentes || pendentes.length === 0) {
        syncBtn.style.display = "none"
        return
      }

      syncBtn.style.display = "block"
      countText.textContent = pendentes.length + " relatório(s) aguardando sincronização"
    })
  }

  function sincronizarPendentes() {
    if (!window.SaveManager) return

    abrirModalPendentes()
  }

  function autoSyncPendentes() {
    if (!window.SaveManager || isSyncing) return

    window.SaveManager.obterRelatoriosPendentes().then(function (pendentes) {
      if (!pendentes || pendentes.length === 0) {
        return
      }

      isSyncing = true
      window.showToast("Reconectado. Sincronizando pendências automaticamente...", "info")

      window.SaveManager
        .sincronizarPendentes(supabase, {
          onItemStatusChange: function (evt) {
            if (syncModal) {
              atualizarStatusItem(evt.id, evt.status, evt.message)
            }
          },
        })
        .then(function () {
          verificarPendentes()
          loadStats()
          loadOcorrenciasStats()
          if (syncModal) {
            carregarPendentesNoModal()
          }
        })
        .finally(function () {
          isSyncing = false
          atualizarProgresso(null, "")
          setBotaoSincronizarEstado("Sincronizar Pendentes", pendentesCache.length === 0)
        })
    })
  }

  window.addEventListener("online", function () {
    autoSyncPendentes()
  })
})
