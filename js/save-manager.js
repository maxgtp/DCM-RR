// ===============================
// GERENCIADOR DE SALVAMENTO
// ===============================

// Gerencia salvamento com barra de progresso, retry e persistência offline via StorageDB

var SaveManager = (function () {
  "use strict"

  var STORAGEDB_UNAVAILABLE = "StorageDB indisponível no navegador.";
  var PENDING_PREFIX = "pending-report";
  var RETRY_DELAY_MS = 3000;

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
      </div>
    `
    document.body.appendChild(modal)
    return modal
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
        return {
          id: item.id,
          protocolo: item.protocol,
          nome: item.dados && item.dados.nome_cidadao,
          data: (item.dados && item.dados.data_atendimento) || item.savedAt,
          dados: item.dados,
        }
      })
    })
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
      var modal = criarModalProgresso()

      // Simula progresso durante preparação
      atualizarProgresso(10, "Validando dados...", "")

      setTimeout(function () {
        atualizarProgresso(30, "Conectando ao servidor...", "")

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

        atualizarProgresso(60, "Enviando dados...", "")

        operacao
          .then(function (response) {
            if (response.error) throw response.error

            atualizarProgresso(90, "Finalizando...", "")

            setTimeout(function () {
              atualizarProgresso(100, "Salvo com sucesso!", "")

              setTimeout(function () {
                fecharModalProgresso()
                resolve(response)
              }, 800)
            }, 300)
          })
          .catch(function (err) {
            console.error("Erro ao salvar:", err)
            fecharModalProgresso()

            var mensagemErro = !navigator.onLine
              ? "Sem conexão com a internet"
              : err.message || "Erro desconhecido"

            registrarErroEmStorage(dados, err).finally(function () {
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
            })
          })
      }, 300)
    })
  }

  // ===============================
  // SINCRONIZAÇÃO DE PENDENTES
  // ===============================
  function sincronizarPendentes(supabase) {
    if (!window.StorageDB) {
      window.showToast("⚠️ Sincronização offline indisponível neste navegador.", "warning")
      return Promise.resolve([])
    }

    return obterRelatoriosPendentes().then(function (pendentes) {
      if (!pendentes || pendentes.length === 0) {
        window.showToast("✅ Nenhum relatório pendente", "info")
        return []
      }

      window.showToast("🔄 Sincronizando " + pendentes.length + " relatório(s)...", "info")

      var promessas = pendentes.map(function (pendente) {
        var dados = pendente.dados || {}
        var cpfLimpo = window.cleanCPF(dados.cpf)

        return supabase
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
          .then(function (response) {
            if (response.error) {
              throw response.error
            }
            return window.StorageDB.removePendingReport(pendente.id || pendente.protocol).then(function () {
              return { sucesso: true, protocolo: dados.protocolo }
            })
          })
          .catch(function (erro) {
            console.error("Erro ao sincronizar relatório", pendente, erro)
            return { sucesso: false, protocolo: dados.protocolo, erro: erro }
          })
      })

      return Promise.all(promessas).then(function (resultados) {
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
        return resultados
      })
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
