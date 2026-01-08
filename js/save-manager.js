// ===============================
// GERENCIADOR DE SALVAMENTO (ATUALIZADO / COMPATÍVEL)
// ===============================

var SaveManager = (function () {
  "use strict"

  var STORAGEDB_UNAVAILABLE = "StorageDB indisponível no navegador."
  var PENDING_PREFIX = "pending-report"

  // ===============================
  // UTIL
  // ===============================

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ===============================
  // OFFLINE (StorageDB)
// ===============================

  function salvarOffline(dados) {
    if (!window.StorageDB) {
      throw new Error(STORAGEDB_UNAVAILABLE)
    }

    var record = {
      id: `${PENDING_PREFIX}:${dados.protocolo || Date.now()}`,
      protocol: dados.protocolo,
      nome: dados.nome_cidadao,
      dados,
      savedAt: new Date().toISOString(),
      tipo: dados.fotos?.length ? "Imagem" : "Texto",
    }

    return Promise.resolve(
      window.StorageDB.savePendingReport(record)
    )
  }

  function obterRelatoriosPendentes() {
    if (!window.StorageDB || !window.StorageDB.getPendingReports) {
      return Promise.resolve([])
    }

    try {
      var result = window.StorageDB.getPendingReports()
      return Promise.resolve(result || [])
    } catch (e) {
      return Promise.resolve([])
    }
  }

  function removerRelatorioPendente(id) {
    if (!window.StorageDB || !window.StorageDB.removePendingReport) {
      return Promise.resolve()
    }
    return Promise.resolve(window.StorageDB.removePendingReport(id))
  }

  // ===============================
  // ONLINE
  // ===============================

  async function salvarOnline(dados, supabase) {
    var res = await supabase.from("relatorios").insert({
      protocolo: dados.protocolo,
      cpf: window.cleanCPF?.(dados.cpf),
      nome_cidadao: dados.nome_cidadao,
      dados_relatorio: dados,
      status: dados.status || "Pendente",
    })

    if (res.error) throw res.error
    return res
  }

  // ===============================
  // SINCRONIZAÇÃO (COMPATÍVEL COM PAINEL)
// ===============================

  async function sincronizarPendentes(supabase, options = {}) {
    var {
      onlyIds = null,
      onProgress = null,
      onItemStatusChange = null,
    } = options

    var pendentes = await obterRelatoriosPendentes()

    if (onlyIds && Array.isArray(onlyIds)) {
      pendentes = pendentes.filter(p => onlyIds.includes(p.id))
    }

    var resultados = []
    var total = pendentes.length
    var concluido = 0

    for (var item of pendentes) {
      try {
        onItemStatusChange?.({
          id: item.id,
          status: "syncing",
        })

        await salvarOnline(item.dados, supabase)
        await removerRelatorioPendente(item.id)

        resultados.push({
          id: item.id,
          sucesso: true,
        })

        onItemStatusChange?.({
          id: item.id,
          status: "success",
        })
      } catch (e) {
        resultados.push({
          id: item.id,
          sucesso: false,
          erro: e?.message || "Erro ao sincronizar",
        })

        onItemStatusChange?.({
          id: item.id,
          status: "error",
          message: e?.message || "Erro ao sincronizar",
        })
      }

      concluido++
      onProgress?.({
        percent: Math.round((concluido / total) * 100),
        label: `Sincronizando ${concluido}/${total}`,
      })
    }

    return resultados
  }

  // ===============================
  // API PÚBLICA
  // ===============================

  return {
    salvarOffline,
    obterRelatoriosPendentes,
    removerRelatorioPendente,
    sincronizarPendentes,
  }
})()

window.SaveManager = SaveManager
