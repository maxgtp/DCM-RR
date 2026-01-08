// ===============================
// GERENCIADOR DE SALVAMENTO
// ===============================

var SaveManager = (function () {
  "use strict"

  var STORAGEDB_UNAVAILABLE = "StorageDB indisponível no navegador."
  var PENDING_PREFIX = "pending-report"
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
    return modal
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function escapeHTML(value) {
    if (!value && value !== 0) return ""
    return String(value).replace(/[&<>"]+/g, function (m) {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
        }[m] || m
      )
    })
  }

  function inferirTipoConteudo(dados) {
    var tipos = ["Texto"]
    if (dados?.fotos?.length) tipos.push("Imagem")
    return tipos.join(" + ")
  }

  // ===============================
  // PROGRESSO GERAL
  // ===============================
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

  function fecharModalErro() {
    document.getElementById("save-error-modal")?.remove()
  }

  // ===============================
  // UPLOADS (FILA)
  // ===============================
  function getUploadName(foto, index) {
    return foto?.name || "Imagem " + (index + 1)
  }

  function inicializarUploadLista(fotos) {
    var container = document.getElementById("progress-uploads")
    if (!container) return

    container.innerHTML = ""

    if (!fotos.length) {
      container.innerHTML =
        '<div class="progress-upload-empty">Nenhuma imagem para enviar.</div>'
      return
    }

    fotos.forEach(function (foto, index) {
      var el = document.createElement("div")
      el.className = "progress-upload-item"
      el.dataset.uploadIndex = index
      el.style.display = "none"

      el.innerHTML = `
        <div class="upload-meta">
          <span class="upload-name">${escapeHTML(getUploadName(foto, index))}</span>
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
    var v = Math.max(0, Math.min(100, progresso))

    if (fill) fill.style.width = v + "%"
    if (perc) perc.textContent = Math.round(v) + "%"
  }

  function marcarUploadConcluido(index) {
    var item = document.querySelector(`[data-upload-index="${index}"]`)
    if (!item) return

    item.classList.remove("is-active")
    item.classList.add("is-complete")

    setTimeout(() => item.remove(), 500)
  }

  async function processarUploadsComProgresso(fotos) {
    if (!fotos.length) {
      atualizarProgresso(PROGRESS_UPLOAD_START, "Preparando dados...", "")
      return
    }

    var total = fotos.length

    for (let i = 0; i < total; i++) {
      setUploadActive(i)

      for (let p = 1; p <= 6; p++) {
        await delay(120)
        atualizarUploadItem(i, (p / 6) * 100)

        var overall =
          PROGRESS_UPLOAD_START +
          ((i + p / 6) / total) *
            (PROGRESS_UPLOAD_END - PROGRESS_UPLOAD_START)

        atualizarProgresso(
          overall,
          `Preparando imagens (${i + 1} de ${total})`,
          getUploadName(fotos[i], i)
        )
      }

      marcarUploadConcluido(i)
    }
  }

  // ===============================
  // SALVAMENTO
  // ===============================
  function salvarOffline(dados) {
    if (!window.StorageDB)
      return Promise.reject(new Error(STORAGEDB_UNAVAILABLE))

    var record = {
      id: `${PENDING_PREFIX}:${dados.protocolo || Date.now()}`,
      protocol: dados.protocolo,
      dados,
      savedAt: new Date().toISOString(),
    }

    return window.StorageDB.savePendingReport(record).then(() => record)
  }

  async function salvarComProgresso(dados, supabase, isUpdate, reportId) {
    criarModalProgresso()
    var fotos = dados.fotos?.filter(Boolean) || []

    try {
      inicializarUploadLista(fotos)
      atualizarProgresso(8, "Validando dados...")
      await delay(150)

      await processarUploadsComProgresso(fotos)

      atualizarProgresso(72, "Enviando dados...")
      var op = isUpdate
        ? supabase.from("relatorios").update({
            nome_cidadao: dados.nome_cidadao,
            dados_relatorio: dados,
            status: dados.status || "Pendente",
          }).eq("id", reportId)
        : supabase.from("relatorios").insert({
            protocolo: dados.protocolo,
            cpf: window.cleanCPF(dados.cpf),
            nome_cidadao: dados.nome_cidadao,
            dados_relatorio: dados,
            status: dados.status || "Pendente",
          }).select().single()

      var res = await op
      if (res.error) throw res.error

      atualizarProgresso(100, "Salvo com sucesso!")
      await delay(500)
      fecharModalProgresso()
      return res
    } catch (err) {
      fecharModalProgresso()
      await salvarOffline(dados)
      throw err
    }
  }

  // ===============================
  // API
  // ===============================
  return {
    salvarComProgresso,
    salvarOffline,
  }
})()

window.SaveManager = SaveManager
