// ===============================
// GERENCIADOR DE SALVAMENTO
// ===============================

// Gerencia salvamento com barra de progresso, retry e fallback local

var SaveManager = (function () {
  var CACHE_KEY_PREFIX = "relatorio_pendente_"
  var PDF_CACHE_PREFIX = "pdf_pendente_"

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

  function criarModalErro(erro, dados, protocolo) {
    var modal = document.createElement("div")
    modal.id = "save-error-modal"
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content error-modal">
        <div class="error-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Erro ao Salvar</h3>
        </div>
        <div class="error-message">
          <p><strong>Não foi possível salvar o relatório online.</strong></p>
          <p class="error-detail">${erro}</p>
          <p>Escolha uma das opções abaixo:</p>
        </div>
        <div class="error-actions">
          <button class="btn btn-primary" id="btn-retry">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Tentar Novamente
          </button>
          <button class="btn btn-secondary" id="btn-save-local">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Salvar Localmente
          </button>
        </div>
        <div class="error-info">
          <small>💾 Ao salvar localmente, o PDF será baixado e os dados ficarão salvos no cache para sincronização posterior.</small>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    // Event listeners
    document.getElementById("btn-retry").addEventListener("click", function () {
      fecharModalErro()
      // Retorna true para indicar retry
      modal.retryCallback && modal.retryCallback()
    })

    document.getElementById("btn-save-local").addEventListener("click", function () {
      fecharModalErro()
      salvarLocalmente(dados, protocolo)
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

  // ===============================
  // SALVAMENTO LOCAL
  // ===============================
  function salvarLocalmente(dados, protocolo) {
    try {
      // Salva dados no localStorage
      var cacheKey = CACHE_KEY_PREFIX + protocolo
      localStorage.setItem(cacheKey, JSON.stringify(dados))

      // Gera e baixa o PDF
      atualizarProgresso(50, "Gerando PDF...", "")
      
      window.carregarLogos().then(function (logos) {
        var doc = window.criarDocumentoPDF(dados, protocolo, logos)
        atualizarProgresso(80, "Salvando PDF...", "")
        
        // Salva PDF como base64 no localStorage
        var pdfData = doc.output("datauristring")
        var pdfKey = PDF_CACHE_PREFIX + protocolo
        try {
          localStorage.setItem(pdfKey, pdfData)
        } catch (e) {
          console.warn("PDF muito grande para cache, apenas baixando")
        }

        // Baixa o PDF
        doc.save("relatorio_" + protocolo + ".pdf")
        
        atualizarProgresso(100, "Salvo localmente!", "")

        setTimeout(function () {
          fecharModalProgresso()
          window.showToast("✅ Relatório salvo localmente! Os dados serão sincronizados quando houver conexão.", "success")
          
          // Mostra notificação de pendências
          mostrarNotificacaoPendencias()
          
          setTimeout(function () {
            window.location.href = "relatorios.html"
          }, 2000)
        }, 1000)
      })
    } catch (err) {
      console.error("Erro ao salvar localmente:", err)
      fecharModalProgresso()
      window.showToast("❌ Erro ao salvar localmente", "error")
    }
  }

  function mostrarNotificacaoPendencias() {
    var pendentes = obterRelatoriosPendentes()
    if (pendentes.length > 0) {
      var msg = "📋 Você tem " + pendentes.length + " relatório(s) pendente(s) de sincronização."
      window.showToast(msg, "info")
    }
  }

  function obterRelatoriosPendentes() {
    var pendentes = []
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i)
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          var dados = JSON.parse(localStorage.getItem(key))
          pendentes.push({
            protocolo: dados.protocolo,
            nome: dados.nome_cidadao,
            data: dados.data_atendimento,
            key: key,
          })
        } catch (e) {
          console.error("Erro ao ler pendente:", e)
        }
      }
    }
    return pendentes
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
          // Atualização
          operacao = supabase
            .from("relatorios")
            .update({
              nome_cidadao: dados.nome_cidadao,
              dados_relatorio: dados,
            })
            .eq("id", reportId)
        } else {
          // Inserção
          operacao = supabase
            .from("relatorios")
            .insert({
              protocolo: dados.protocolo,
              cpf: cpfLimpo,
              nome_cidadao: dados.nome_cidadao,
              dados_relatorio: dados,
              status: "Pendente",
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

            // Determina o tipo de erro
            var mensagemErro = "Erro desconhecido"
            if (!navigator.onLine) {
              mensagemErro = "Sem conexão com a internet"
            } else if (err.message) {
              mensagemErro = err.message
            }

            // Mostra modal de erro com opções
            var errorModal = criarModalErro(mensagemErro, dados, dados.protocolo)
            errorModal.retryCallback = function () {
              salvarComProgresso(dados, supabase, isUpdate, reportId)
                .then(resolve)
                .catch(reject)
            }

            reject(err)
          })
      }, 500)
    })
  }

  // ===============================
  // SINCRONIZAÇÃO DE PENDENTES
  // ===============================
  function sincronizarPendentes(supabase) {
    var pendentes = obterRelatoriosPendentes()
    if (pendentes.length === 0) {
      window.showToast("✅ Nenhum relatório pendente", "info")
      return Promise.resolve()
    }

    window.showToast("🔄 Sincronizando " + pendentes.length + " relatório(s)...", "info")

    var promessas = pendentes.map(function (pendente) {
      return new Promise(function (resolve) {
        var dados = JSON.parse(localStorage.getItem(pendente.key))
        var cpfLimpo = window.cleanCPF(dados.cpf)

        supabase
          .from("relatorios")
          .insert({
            protocolo: dados.protocolo,
            cpf: cpfLimpo,
            nome_cidadao: dados.nome_cidadao,
            dados_relatorio: dados,
            status: "Pendente",
          })
          .select()
          .single()
          .then(function (response) {
            if (!response.error) {
              // Remove do cache após sucesso
              localStorage.removeItem(pendente.key)
              localStorage.removeItem(PDF_CACHE_PREFIX + pendente.protocolo)
              resolve({ sucesso: true, protocolo: pendente.protocolo })
            } else {
              resolve({ sucesso: false, protocolo: pendente.protocolo, erro: response.error })
            }
          })
          .catch(function () {
            resolve({ sucesso: false, protocolo: pendente.protocolo })
          })
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

      return resultados
    })
  }

  // ===============================
  // API PÚBLICA
  // ===============================
  return {
    salvarComProgresso: salvarComProgresso,
    salvarLocalmente: salvarLocalmente,
    obterRelatoriosPendentes: obterRelatoriosPendentes,
    sincronizarPendentes: sincronizarPendentes,
    mostrarNotificacaoPendencias: mostrarNotificacaoPendencias,
  }
})()

// Exporta globalmente
window.SaveManager = SaveManager
