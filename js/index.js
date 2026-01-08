// Script da página inicial - usa funções de config.js e utils.js
// NÃO declara nenhuma função que já existe nesses arquivos

document.addEventListener("DOMContentLoaded", () => {
  var cpfInput = document.getElementById("cpf")
  var form = document.getElementById("cpf-form")
  var resultsSection = document.getElementById("results")
  var resultsList = document.getElementById("results-list")
  var noResults = document.getElementById("no-results")
  var errorMessage = document.getElementById("error-message")
  var searchBtn = document.getElementById("search-btn")

  // Formatação automática do CPF ao digitar
  cpfInput.addEventListener("input", (e) => {
    var value = e.target.value
    // Usa formatCPF do utils.js (já carregado globalmente)
    e.target.value = window.formatCPF(value)
  })

  // Busca de relatórios
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    var cpfValue = cpfInput.value
    var cpf = window.cleanCPF(cpfValue)

    // Valida CPF usando função do utils.js
    if (!window.validateCPF(cpfValue)) {
      errorMessage.textContent = "CPF inválido. Verifique o número digitado."
      errorMessage.style.display = "block"
      resultsSection.style.display = "none"
      noResults.style.display = "none"
      return
    }

    errorMessage.style.display = "none"
    searchBtn.disabled = true
    searchBtn.innerHTML = '<span class="spinner"></span> Buscando...'

    // Usa initSupabase do config.js (já carregado globalmente)
    var supabaseClient = window.initSupabase()
    supabaseClient
      .from("relatorios")
      .select("*")
      .eq("cpf", cpf)
      .order("created_at", { ascending: false })
      .then((response) => {
        if (response.error) throw response.error

        var data = response.data
        if (data && data.length > 0) {
          // Armazena os dados para uso posterior
          window.reportsData = data
          renderResults(data)
          resultsSection.style.display = "block"
          noResults.style.display = "none"
        } else {
          resultsSection.style.display = "none"
          noResults.style.display = "flex"
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar:", err)
        errorMessage.textContent = "Erro ao buscar relatórios. Tente novamente."
        errorMessage.style.display = "block"
      })
      .finally(() => {
        searchBtn.disabled = false
        searchBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Consultar'
      })
  })

  function renderResults(reports) {
    var html = ""
    for (var i = 0; i < reports.length; i++) {
      var report = reports[i]
      var dados = report.dados_relatorio || {}
      var solicitacao = dados.solicitacao ? dados.solicitacao.join(", ") : "-"
      var statusClass = window.getStatusClass(report.status)
      var dataFormatada = window.formatDateTime(report.created_at)
      var status = report.status || "Pendente"

      html +=
        '<div class="result-card">' +
        '<div class="result-card-header">' +
        "<h4>Protocolo: " +
        (report.protocolo || "-") +
        "</h4>" +
        '<span class="status ' +
        statusClass +
        '">' +
        status +
        "</span>" +
        "</div>" +
        '<div class="result-card-body">' +
        "<p><strong>Data:</strong> " +
        dataFormatada +
        "</p>" +
        "<p><strong>Endereço:</strong> " +
        (dados.endereco || "-") +
        ", " +
        (dados.bairro || "-") +
        "</p>" +
        "<p><strong>Tipo:</strong> " +
        solicitacao +
        "</p>" +
        "</div>"

      if (status === "Concluído") {
        html +=
          '<div class="result-card-actions">' +
          '<button class="btn btn-primary btn-small" onclick="window.baixarRelatorioPDF(\'' +
          report.id +
          "')\">" +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>' +
          " Baixar em PDF" +
          "</button>" +
          "</div>"
      }

      html += "</div>"
    }
    resultsList.innerHTML = html
  }
})

function baixarRelatorioPDF(id) {
  var supabaseClient = window.initSupabase()
  supabaseClient
    .from("relatorios")
    .select("*")
    .eq("id", id)
    .single()
    .then((response) => {
      if (response.error) throw response.error

      if (response.data && response.data.dados_relatorio) {
        // Usa a função downloadPDF do pdf-generator.js que faz download direto
        window.downloadPDF(response.data.dados_relatorio, response.data.protocolo)
      }
    })
    .catch((err) => {
      console.error("Erro ao carregar relatório:", err)
      alert("Erro ao carregar o relatório.")
    })
}
