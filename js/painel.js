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
})
