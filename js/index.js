// Script da página inicial (consulta de CPF)

let supabase // Declare the supabase variable

function formatCPF(val) {
  // Implementação da função formatCPF
  return val.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

function cleanCPF(val) {
  // Implementação da função cleanCPF
  return val.replace(/\D/g, "")
}

function validateCPF(val) {
  // Implementação da função validateCPF
  val = val.replace(/\D/g, "")
  if (val.length !== 11 || /^(\d)\1+$/.test(val)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) sum += Number.parseInt(val.substring(i - 1, i)) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(val.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) sum += Number.parseInt(val.substring(i - 1, i)) * (12 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(val.substring(10, 11))) return false

  return true
}

function initSupabase() {
  // Implementação da função initSupabase
  supabase = window.supabase // Assuming supabase is loaded globally
  return supabase
}

function getStatusClass(status) {
  // Implementação da função getStatusClass
  switch (status) {
    case "Aprovado":
      return "approved"
    case "Reprovado":
      return "rejected"
    default:
      return "pending"
  }
}

function formatDateTime(date) {
  // Implementação da função formatDateTime
  const options = { year: "numeric", month: "long", day: "numeric" }
  return new Date(date).toLocaleDateString("pt-BR", options)
}

document.addEventListener("DOMContentLoaded", () => {
  var cpfInput = document.getElementById("cpf")
  var form = document.getElementById("cpf-form")
  var resultsSection = document.getElementById("results")
  var resultsList = document.getElementById("results-list")
  var noResults = document.getElementById("no-results")
  var errorMessage = document.getElementById("error-message")
  var searchBtn = document.getElementById("search-btn")

  // Formatação automática do CPF
  cpfInput.addEventListener("input", (e) => {
    var value = e.target.value
    e.target.value = formatCPF(value)
  })

  // Busca de relatórios
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    var cpf = cleanCPF(cpfInput.value)

    // Valida CPF
    if (!validateCPF(cpfInput.value)) {
      errorMessage.textContent = "CPF inválido. Verifique o número digitado."
      errorMessage.style.display = "block"
      resultsSection.style.display = "none"
      noResults.style.display = "none"
      return
    }

    errorMessage.style.display = "none"
    searchBtn.disabled = true
    searchBtn.innerHTML = '<span class="spinner"></span> Buscando...'

    try {
      var supabase = initSupabase()
      var response = await supabase
        .from("relatorios")
        .select("*")
        .eq("cpf", cpf)
        .order("created_at", { ascending: false })

      if (response.error) throw response.error

      var data = response.data
      if (data && data.length > 0) {
        renderResults(data)
        resultsSection.style.display = "block"
        noResults.style.display = "none"
      } else {
        resultsSection.style.display = "none"
        noResults.style.display = "flex"
      }
    } catch (err) {
      console.error("Erro ao buscar:", err)
      errorMessage.textContent = "Erro ao buscar relatórios. Tente novamente."
      errorMessage.style.display = "block"
    } finally {
      searchBtn.disabled = false
      searchBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Consultar'
    }
  })

  function renderResults(reports) {
    var html = ""
    for (var i = 0; i < reports.length; i++) {
      var report = reports[i]
      var dados = report.dados_relatorio || {}
      var solicitacao = dados.solicitacao ? dados.solicitacao.join(", ") : "-"

      html +=
        '<div class="result-card">' +
        '<div class="result-card-header">' +
        "<h4>Protocolo: " +
        (report.protocolo || "-") +
        "</h4>" +
        '<span class="status ' +
        getStatusClass(report.status) +
        '">' +
        (report.status || "Pendente") +
        "</span>" +
        "</div>" +
        '<div class="result-card-body">' +
        "<p><strong>Data:</strong> " +
        formatDateTime(report.created_at) +
        "</p>" +
        "<p><strong>Endereço:</strong> " +
        (dados.endereco || "-") +
        ", " +
        (dados.bairro || "-") +
        "</p>" +
        "<p><strong>Tipo:</strong> " +
        solicitacao +
        "</p>" +
        "</div>" +
        '<div class="result-card-actions">' +
        '<button class="btn btn-primary btn-small" onclick="viewReport(\'' +
        report.id +
        "')\">" +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>' +
        " Ver Detalhes" +
        "</button>" +
        "</div>" +
        "</div>"
    }
    resultsList.innerHTML = html
  }
})

// Função global para visualizar relatório
async function viewReport(id) {
  try {
    var supabase = initSupabase()
    var response = await supabase.from("relatorios").select("*").eq("id", id).single()

    if (response.error) throw response.error

    if (response.data && response.data.dados_relatorio) {
      alert("Detalhes do relatório:\n\nProtocolo: " + response.data.protocolo + "\nStatus: " + response.data.status)
    }
  } catch (err) {
    console.error("Erro ao carregar relatório:", err)
    alert("Erro ao carregar o relatório.")
  }
}
