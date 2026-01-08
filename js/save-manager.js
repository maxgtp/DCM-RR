// ===============================
// GERENCIADOR DE SALVAMENTO
// ===============================
// Gerencia salvamento com barra de progresso, retry e persistência offline via StorageDB

var SaveManager = (function () {
  "use strict"

  var STORAGEDB_UNAVAILABLE = "StorageDB indisponível no navegador."
  var PENDING_PREFIX = "pending-report"
  var RETRY_DELAY_MS = 3000
  var PROGRESS_UPLOAD_START = 12
  var PROGRESS_UPLOAD_END = 55

  // ===============================
  // INTERFACE DE PROGRESSO
  // ===============================

  function criarModalProgresso() {
    var modal = document.createElement("div")
    modal.id = "save-progress-modal"
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content progress-modal">
        <div class="progress-header">
          <h3>Salvando Relatório</h3>
          <div class="progress-status">Preparando dados...</div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar" id="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-percentage" id="progress-percentage">0%</div>
        </div>

        <div class="progress-details" id="progress-details"></div>
        <div class="progress-uploads" id="progress-uploads"></div>
      </div>
    `
    document.body.appendChild(modal)
    return modal
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms)
    })
  }

  function escapeHTML(value) {
    if (!value && value !== 0) return ""
    return String(value).replace(/[&<>"]+/g, function (match) {
      switch (match) {
        case "&": return "&amp;"
        case "<": return "&lt;"
        case ">": return "&gt;"
        case '"': return "&quot;"
        default: return match
      }
    })
  }

  function inferirTipoConteudo(dados) {
    var tipos = []
    tipos.push("Texto")

    if (dados && Array.isArray(dados.fotos) && dados.fotos.length > 0) {
      tipos.push("Imagem")
    }

    return tipos.join(" + ")
  }

  function criarModalErro(config) {
    if (!window.StorageDB) return null

    var modal = document.createElement("div")
    modal.id = "save-error-modal"
    modal.className = "modal-overlay"

    var secondary = config.secondaryMessage
      ? `<div class="error-info"><small>${config.secondaryMessage}</small></div>`
      : ""

    modal.innerHTML = `
      <div class="modal-content error-modal">
        <div class="error-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>${config.title || "Erro ao Salvar"}</h3>
        </div>

        <div class="error-message">
          <p><strong>${config.mainMessage || "Ocorreu um erro durante o salvamento."}</strong></p>
          ${config.details ? `<p class="error-detail">${config.details}</p>` : ""}
        </div>

        <div class="error-actions">
          <button class="btn btn-primary" id="btn-retry">
            🔄 Tentar Novamente
          </button>
        </div>

        ${secondary}
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById("btn-retry").addEventListener("click", function () {
      fecharModalErro()
      config.onRetry && config.onRetry()
    })

    return modal
  }

  function atualizarProgresso(porcentagem, status, detalhes) {
    var fill = document.getElementById("progress-fill")
    var percentage = document.getElementById("progress-percentage")
    var statusEl = document.querySelector(".progress-status")
    var detailsEl = document.getElementById("progress-details")

    if (fill) fill.style.width = porcentagem + "%"
    if (percentage) percentage.textContent = Math.round(porcentagem) + "%"
    if (statusEl) statusEl.textContent = status
    if (detailsEl && detalhes) detailsEl.textContent = detalhes
  }

  function fecharModalProgresso() {
    var modal = document.getElementById("save-progress-modal")
    if (modal) modal.remove()
  }

  function fecharModalErro() {
    var modal = document.getElementById("save-error-modal")
    if (modal) modal.remove()
  }

  function salvarOffline(dados) {
    if (!window.StorageDB) {
      return Promise.reject(new Error(STORAGEDB_UNAVAILABLE))
    }

    var record = {
      id: PENDING_PREFIX + ":" + (dados.protocolo || Date.now()),
      protocol: dados.protocolo,
      dados: dados,
      savedAt: new Date().toISOString(),
    }

    return window.StorageDB.savePendingReport(record).then(function () {
      return record
    })
  }

  // ===============================
  // API PÚBLICA
  // ===============================

  return {
    salvarComProgresso: salvarComProgresso,
    salvarOffline: salvarOffline,
    obterRelatoriosPendentes: obterRelatoriosPendentes,
    sincronizarPendentes: sincronizarPendentes,
    mostrarNotificacaoPendencias: mostrarNotificacaoPendencias,
  }
})()

// Exporta globalmente
window.SaveManager = SaveManager
