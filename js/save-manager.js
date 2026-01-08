// ===============================
// GERENCIADOR DE SALVAMENTO (COMPLETO)
// ===============================

var SaveManager = (function () {
  "use strict"

  var STORAGEDB_UNAVAILABLE = "StorageDB indisponível no navegador."
  var PENDING_PREFIX = "pending-report"
  var PROGRESS_UPLOAD_START = 12
  var PROGRESS_UPLOAD_END = 55

  // ===============================
  // UTIL
  // ===============================

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function escapeHTML(value) {
    if (!value && value !== 0) return ""
    return String(value).replace(/[&<>"]+/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[m]))
  }

  // ===============================
  // MODAL DE PROGRESSO
  // ===============================

  function criarModalProgresso() {
    fecharModalProgresso()

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
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-percentage" id="progress-percentage">0%</div>
        </div>

        <div class="progress-details" id="progress-details"></div>
        <div class="progress-uploads" id="progress-uploads"></div>
      </div>
    `
    document.body.appendChild(modal)
  }

  function atualizarProgresso(p, status, detalhes) {
    var fill = document.getElementById("progress-fill")
    var perc = document.getElementById("progress-percentage")
    var statusEl = document.querySelector(".progress-status")
    var details = document.getElementById("progress-details")

    if (fill) fill.style.width = p + "%"
    if (perc) perc.textContent = Math.round(p) + "%"
    if (statusEl) statusEl.textContent = status || ""
    if (details && detalhes !== undefined) details.textContent = detalhes
  }

  function fecharModalProgresso() {
    document.getElementById("save-progress-modal")?.remove()
  }

  // ===============================
  // UPLOADS (VISUAL)
  // ===============================

  function inicializarUploadLista(fotos) {
    var container = document.getElementById("progress-uploads")
    if (!container) return

    container.innerHTML = ""

    if (!fotos.length) {
      container.innerHTML =
        `<div class="progress-upload-empty">Nenhuma imagem para enviar.</div>`
      return
    }

    fotos.forEach((foto, index) => {
      var el = document.createElement("div")
      el.className = "progress-upload-item"
      el.dataset.uploadIndex = index
      el.style.display = "none"

      el.innerHTML = `
        <div class="upload-meta">
          <span class="upload-name">${escapeHTML(foto?.name || "Imagem " + (index + 1))}</span>
          <span class="upload-percentage" id="upload-percentage-${index}">0%</span>
        </div>
        <div class="upload-bar">
          <span class="upload-fill" id="upload-fill-${index}"></span>
        </div>
      `
      container.appendChild(el)
    })
  }

  function setUploadActive(index) {
    document.querySelectorAll(".progress-upload-item").forEach(el => {
      el.style.display = "none"
      el.classList.remove("is-active")
    })

    var current = document.querySelector(`[data-upload-index="${index}"]`)
    if (current) {
      current.style.display = "block"
      current.classList.add("is-active")
    }
  }

  function atualizarUploadItem(index, progresso) {
    var fill = document.getElementById("upload-fill-" + index)
    var perc = document.getElementById("upload-percentage-" + index)
    if (fill) fill.style.width = progresso + "%"
    if (perc) perc.textContent = Math.round(progresso) + "%"
  }

  async function processarUploadsComProgresso(fotos) {
    if (!fotos.length) return

    for (let i = 0; i < fotos.length; i++) {
      setUploadActive(i)

      for (let p = 1; p <= 6; p++) {
        await delay(120)
        atualizarUploadItem(i, (p / 6) * 100)

        atualizarProgresso(
          PROGRESS_UPLOAD_START +
            ((i + p / 6) / fotos.length) *
              (PROGRESS_UPLOAD_END - PROGRESS_UPLOAD_START),
          `Processando imagens (${i + 1}/${fotos.length})`,
          fotos[i]?.name
        )
      }

      document
        .querySelector(`[data-upload-index="${i}"]`)
        ?.remove()
    }
  }

  // ===============================
  // OFFLINE (StorageDB)
  // ===============================

  function salvarOffline(dados) {
    if (!window.StorageDB)
      throw new Error(STORAGEDB_UNAVAILABLE)

    var record = {
      id: `${PENDING_PREFIX}:${dados.protocolo || Date.now()}`,
      protocol: dados.protocolo,
      nome: dados.nome_cidadao,
      dados,
      savedAt: new Date().toISOString(),
    }

    return window.StorageDB.savePendingReport(record)
  }

  function obterRelatoriosPendentes() {
    if (!window.StorageDB || !window.StorageDB.getPendingReports)
      return []

    return window.StorageDB.getPendingReports()
  }

  function removerRelatorioPendente(id) {
    if (!window.StorageDB || !window.StorageDB.removePendingReport)
      return Promise.resolve()

    return window.StorageDB.removePendingReport(id)
  }

  // ===============================
  // ONLINE
  // ===============================

  async function salvarComProgresso(dados, supabase, isUpdate, reportId) {
    criarModalProgresso()
    var fotos = dados.fotos?.filter(Boolean) || []

    try {
      inicializarUploadLista(fotos)
      atualizarProgresso(8, "Validando dados...")
      await delay(150)

      await processarUploadsComProgresso(fotos)

      atualizarProgresso(72, "Enviando dados...")

      var res = isUpdate
        ? await supabase.from("relatorios").update({
            nome_cidadao: dados.nome_cidadao,
            dados_relatorio: dados,
            status: dados.status || "Pendente",
          }).eq("id", reportId)
        : await supabase.from("relatorios").insert({
            protocolo: dados.protocolo,
            cpf: window.cleanCPF?.(dados.cpf),
            nome_cidadao: dados.nome_cidadao,
            dados_relatorio: dados,
            status: dados.status || "Pendente",
          })

      if (res.error) throw res.error

      atualizarProgresso(100, "Salvo com sucesso!")
      await delay(500)
      fecharModalProgresso()
      return res
    } catch (e) {
      fecharModalProgresso()
      await salvarOffline(dados)
      throw e
    }
  }

  async function sincronizarPendentes(supabase) {
    var pendentes = obterRelatoriosPendentes()
    var resultados = []

    for (var item of pendentes) {
      try {
        await salvarComProgresso(item.dados, supabase)
        await removerRelatorioPendente(item.id)
        resultados.push({ id: item.id, status: "success" })
      } catch (e) {
        resultados.push({ id: item.id, status: "error", error: e })
      }
    }

    return resultados
  }

  // ===============================
  // API PÚBLICA (COMPLETA)
  // ===============================

  return {
    salvarComProgresso,
    salvarOffline,
    obterRelatoriosPendentes,
    removerRelatorioPendente,
    sincronizarPendentes,
  }
})()

window.SaveManager = SaveManager
