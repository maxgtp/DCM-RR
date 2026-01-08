// ===============================
// GERENCIADOR DE SALVAMENTO
// ===============================

// Gerencia salvamento com barra de progresso, retry e persistência offline via StorageDB

var SaveManager = (function () {
  "use strict"

  var STORAGEDB_UNAVAILABLE = "StorageDB indisponível no navegador.";
  var PENDING_PREFIX = "pending-report";
  var RETRY_DELAY_MS = 3000;
  var PROGRESS_UPLOAD_START = 12;
  var PROGRESS_UPLOAD_END = 55;

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

  function inferirTipoConteudo(dados) {
    var tipos = []
    tipos.push("Texto")

    if (dados && Array.isArray(dados.fotos) && dados.fotos.length > 0) {
      tipos.push("Imagem")
    }

    return tipos.join(" + ")
  }

  function criarModalErro(config) {
    if (!window.StorageDB) {
      return null;
    }

    var modal = document.createElement("div")
    modal.id = "save-error-modal"
    modal.className = "modal-overlay"

    var secondary = config.secondaryMessage
      ? `<div class="error-info"><small>${config.secondaryMessage}</small></div>`
      : ""

    modal.innerHTML = `
      <div class="modal-content error-modal">
        <div class="error-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Tentar Novamente
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

  function getUploadName(foto, index) {
    if (foto && foto.name) return foto.name
    return "Imagem " + (index + 1)
  }

  function inicializarUploadLista(fotos) {
    var container = document.getElementById("progress-uploads")
    if (!container) return

    if (!Array.isArray(fotos) || fotos.length === 0) {
      container.classList.add("is-empty")
      container.innerHTML = '<div class="progress-upload-empty">Nenhuma imagem para enviar.</div>'
      return
    }

    container.classList.remove("is-empty")
    var fragments = fotos
      .map(function (foto, index) {
        var safeName = escapeHTML(getUploadName(foto, index))
        return (
          '<div class="progress-upload-item" data-upload-index="' +
          index +
          '">' +
          '<div class="upload-meta">' +
          '<span class="upload-name">' +
          safeName +
          "</span>" +
          '<span class="upload-percentage" id="upload-percentage-' +
          index +
          '">0%</span>' +
          "</div>" +
          '<div class="upload-bar">' +
          '<span class="upload-fill" id="upload-fill-' +
          index +
          '"></span>' +
          "</div>" +
          "</div>"
        )
      })
      .join("")

    container.innerHTML = fragments
  }

  function setUploadActive(index) {
    var items = document.querySelectorAll(".progress-upload-item")
    items.forEach(function (item) {
      item.classList.remove("is-active")
    })

    var current = document.querySelector('[data-upload-index="' + index + '"]')
    if (current) {
      current.classList.add("is-active")
    }
  }

  function atualizarUploadItem(index, progresso) {
    var fill = document.getElementById("upload-fill-" + index)
    var percentage = document.getElementById("upload-percentage-" + index)
    var value = Math.max(0, Math.min(100, progresso))

    if (fill) fill.style.width = value + "%"
    if (percentage) percentage.textContent = Math.round(value) + "%"
  }

  function marcarUploadConcluido(index) {
    var item = document.querySelector('[data-upload-index="' + index + '"]')
    if (item) {
      item.classList.remove("is-active")
      item.classList.add("is-complete")
    }
  }

  function finalizarUploadListaSucesso(total) {
    if (!total) return

    for (var i = 0; i < total; i++) {
      atualizarUploadItem(i, 100)
      marcarUploadConcluido(i)
    }
  }

  async function processarUploadsComProgresso(fotos) {
    if (!Array.isArray(fotos) || fotos.length === 0) {
      atualizarProgresso(PROGRESS_UPLOAD_START, "Preparando dados...", "Nenhuma imagem para enviar.")
      return
    }

    var total = fotos.length

    for (var i = 0; i < total; i++) {
      setUploadActive(i)
      var passos = 6

      for (var passo = 1; passo <= passos; passo++) {
        await delay(120)
        var progressoItem = (passo / passos) * 100
        atualizarUploadItem(i, progressoItem)

        var fracao = (i + progressoItem / 100) / total
        var overall =
          PROGRESS_UPLOAD_START + fracao * (PROGRESS_UPLOAD_END - PROGRESS_UPLOAD_START)

        atualizarProgresso(
          overall,
          "Preparando imagens (" + (i + 1) + " de " + total + ")",
          getUploadName(fotos[i], i)
        )
      }

      marcarUploadConcluido(i)
      await delay(80)
    }
  }

  function mostrarNotificacaoPendencias() {
    if (!window.StorageDB) {
      return
    }

    window.StorageDB.countPendingReports().then(function (count) {
      if (count > 0) {
        var msg = "📋 Você tem " + count + " relatório(s) pendente(s) de sincronização."
        window.showToast(msg, "info")
      }
    })
  }

  function obterRelatoriosPendentes() {
    if (!window.StorageDB) {
      return Promise.resolve([])
    }

    return window.StorageDB.listPendingReports().then(function (items) {
      return (items || []).map(function (item) {
        var dados = item.dados || {}
        return {
          id: item.id,
          protocolo: item.protocol,
          nome: dados.nome_cidadao,
          data: dados.data_atendimento || item.savedAt,
          savedAt: item.savedAt,
          tipo: inferirTipoConteudo(dados),
          dados: dados,
        }
      })
    })
  }

  function getErrorMessage(err) {
    if (!err) return "Erro desconhecido"
    if (typeof err === "string") return err
    if (err.message) return err.message
    return "Erro desconhecido"
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

  function salvarOfflineEExibirAviso(dados, mensagemErro) {
    return salvarOffline(dados)
      .then(function () {
        window.showToast("⚠️ Salvamento offline concluído. Dados aguardando sincronização.", "warning")
        mostrarNotificacaoPendencias()
        throw mensagemErro
      })
      .catch(function (err) {
        console.error("Falha ao salvar no StorageDB:", err)
        throw err
      })
  }

  function registrarErroEmStorage(dados, erro) {
    if (!window.StorageDB) {
      return Promise.resolve()
    }

    return salvarOffline(dados).then(function () {
      window.showToast("⚠️ Dados armazenados offline devido a erro.", "warning")
      console.error("Erro original:", erro)
    })
  }

  // ===============================
  // SALVAMENTO COM PROGRESSO
  // ===============================
  function salvarComProgresso(dados, supabase, isUpdate, reportId) {
    return new Promise(function (resolve, reject) {
      ;(async function () {
        var modal = criarModalProgresso()
        var fotos = Array.isArray(dados.fotos) ? dados.fotos.filter(Boolean) : []

        inicializarUploadLista(fotos)

        try {
          atualizarProgresso(8, "Validando dados...", "")
          await delay(160)

          await processarUploadsComProgresso(fotos)

          atualizarProgresso(
            PROGRESS_UPLOAD_END + 5,
            "Conectando ao servidor...",
            fotos.length ? "Imagens prontas para envio." : "Dados preparados para envio."
          )

          await delay(140)

          var cpfLimpo = window.cleanCPF(dados.cpf)
          var operacao

          if (isUpdate) {
            operacao = supabase
              .from("relatorios")
              .update({
                nome_cidadao: dados.nome_cidadao,
                dados_relatorio: dados,
                status: dados.status || "Pendente",
              })
              .eq("id", reportId)
          } else {
            operacao = supabase
              .from("relatorios")
              .insert({
                protocolo: dados.protocolo,
                cpf: cpfLimpo,
                nome_cidadao: dados.nome_cidadao,
                dados_relatorio: dados,
                status: dados.status || "Pendente",
              })
              .select()
              .single()
          }

          atualizarProgresso(72, "Enviando dados...", "Sincronizando com o servidor.")

          var response = await operacao
          if (response.error) throw response.error

          finalizarUploadListaSucesso(fotos.length)

          atualizarProgresso(94, "Finalizando...", "Gerando confirmações.")
          await delay(240)

          atualizarProgresso(100, "Salvo com sucesso!", "")
          await delay(650)

          fecharModalProgresso()
          resolve(response)
        } catch (err) {
          console.error("Erro ao salvar:", err)
          fecharModalProgresso()

          var mensagemErro = !navigator.onLine
            ? "Sem conexão com a internet"
            : err.message || "Erro desconhecido"

          try {
            await registrarErroEmStorage(dados, err)
          } catch (storageErr) {
            console.error("Falha ao registrar erro no StorageDB:", storageErr)
          }

          criarModalErro({
            mainMessage: "Falha ao salvar online.",
            details: mensagemErro,
            secondaryMessage: "Os dados foram preservados e poderão ser sincronizados posteriormente.",
            onRetry: function () {
              salvarComProgresso(dados, supabase, isUpdate, reportId)
                .then(resolve)
                .catch(reject)
            },
          })

          reject(err)
        }
      })()
    })
  }

  // ===============================
  // SINCRONIZAÇÃO DE PENDENTES
  // ===============================
  function sincronizarPendentes(supabase) {
    var options = arguments.length > 1 ? arguments[1] : undefined

    if (!window.StorageDB) {
      window.showToast("⚠️ Sincronização offline indisponível neste navegador.", "warning")
      return Promise.resolve([])
    }

    options = options || {}

    function onItemStatus(pendenteId, status, message, index, total) {
      if (typeof options.onItemStatusChange === "function") {
        options.onItemStatusChange({
          id: pendenteId,
          status: status,
          message: message || "",
          index: index,
          total: total,
        })
      }
    }

    function onProgress(value, label) {
      if (typeof options.onProgress === "function") {
        options.onProgress({ percent: value, label: label || "" })
      }
    }

    return new Promise(function (resolve) {
      ;(async function () {
        var pendentes = await obterRelatoriosPendentes()

        if (options.onlyIds && Array.isArray(options.onlyIds) && options.onlyIds.length > 0) {
          pendentes = pendentes.filter(function (pendente) {
            return options.onlyIds.indexOf(pendente.id) !== -1
          })
        }

        if (!pendentes || pendentes.length === 0) {
          window.showToast("✅ Nenhum relatório pendente", "info")
          onProgress(100, "Nenhum pendente")
          resolve([])
          return
        }

        var total = pendentes.length
        onProgress(0, "Iniciando sincronização")
        window.showToast("🔄 Sincronizando " + total + " relatório(s)...", "info")

        var resultados = []

        for (var i = 0; i < total; i++) {
          var pendente = pendentes[i]
          var dados = pendente.dados || {}
          var pendenteId = pendente.id

          onItemStatus(pendenteId, "syncing", "", i, total)
          onProgress(Math.round((i / total) * 100), "Sincronizando " + (i + 1) + " de " + total)

          try {
            var cpfLimpo = window.cleanCPF(dados.cpf)

            var response = await supabase
              .from("relatorios")
              .insert({
                protocolo: dados.protocolo,
                cpf: cpfLimpo,
                nome_cidadao: dados.nome_cidadao,
                dados_relatorio: dados,
                status: dados.status || "Pendente",
              })
              .select()
              .single()

            if (response.error) {
              throw response.error
            }

            await window.StorageDB.removePendingReport(pendenteId)
            resultados.push({ sucesso: true, id: pendenteId, protocolo: dados.protocolo })
            onItemStatus(pendenteId, "success", "", i, total)
          } catch (err) {
            var msg = getErrorMessage(err)
            if (msg && msg.toLowerCase().indexOf("failed to fetch") !== -1) {
              msg = "Falha de conexão/CORS ao acessar o Supabase. Verifique se o domínio está autorizado."
            }

            console.error("Erro ao sincronizar relatório", pendente, err)
            resultados.push({ sucesso: false, id: pendenteId, protocolo: dados.protocolo, erro: err })
            onItemStatus(pendenteId, "error", msg, i, total)
          }
        }

        onProgress(100, "Concluído")

        var sucessos = resultados.filter(function (r) {
          return r.sucesso
        }).length
        var falhas = resultados.length - sucessos

        if (sucessos > 0) {
          window.showToast("✅ " + sucessos + " relatório(s) sincronizado(s)", "success")
        }
        if (falhas > 0) {
          window.showToast("⚠️ " + falhas + " relatório(s) não sincronizado(s)", "warning")
        }

        mostrarNotificacaoPendencias()
        resolve(resultados)
      })()
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
