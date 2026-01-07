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

  // Logout
  logoutBtn.addEventListener("click", () => {
    doLogout()
  })

  // Carrega estatísticas
  loadStats()

  // Verifica relatórios pendentes de sincronização
  verificarPendentes()

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

  function verificarPendentes() {
    if (!window.SaveManager) return

    var pendentes = window.SaveManager.obterRelatoriosPendentes()
    var syncBtn = document.getElementById("sync-pending-btn")
    var countText = document.getElementById("pending-count-text")

    if (pendentes.length > 0) {
      syncBtn.style.display = "block"
      countText.textContent = pendentes.length + " relatório(s) aguardando sincronização"

      syncBtn.addEventListener("click", (e) => {
        e.preventDefault()
        sincronizarPendentes()
      })
    }
  }

  function sincronizarPendentes() {
    if (!window.SaveManager) return

    window.SaveManager.sincronizarPendentes(supabase).then(() => {
      // Atualiza a interface
      verificarPendentes()
      loadStats()
    })
  }
})
