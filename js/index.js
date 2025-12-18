// Script da página inicial (consulta de CPF)
// Importações necessárias
import { initSupabase } from "./utils.js"
import { formatCPF, cleanCPF, validateCPF, getStatusClass, formatDateTime, generatePDF } from "./config.js"

document.addEventListener("DOMContentLoaded", () => {
  const supabase = initSupabase()
  const cpfInput = document.getElementById("cpf")
  const form = document.getElementById("cpf-form")
  const resultsSection = document.getElementById("results")
  const resultsList = document.getElementById("results-list")
  const noResults = document.getElementById("no-results")
  const errorMessage = document.getElementById("error-message")
  const searchBtn = document.getElementById("search-btn")

  // Formatação automática do CPF
  cpfInput.addEventListener("input", (e) => {
    e.target.value = formatCPF(e.target.value)
  })

  // Busca de relatórios
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const cpf = cleanCPF(cpfInput.value)

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
      const { data, error } = await supabase
        .from("relatorios")
        .select("*")
        .eq("cpf", cpf)
        .order("created_at", { ascending: false })

      if (error) throw error

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
      searchBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                </svg>
                Consultar
            `
    }
  })

  function renderResults(reports) {
    resultsList.innerHTML = reports
      .map((report) => {
        const dados = report.dados_relatorio || {}
        return `
                <div class="result-card">
                    <div class="result-card-header">
                        <h4>Protocolo: ${report.protocolo || "-"}</h4>
                        <span class="status ${getStatusClass(report.status)}">${report.status || "Pendente"}</span>
                    </div>
                    <div class="result-card-body">
                        <p><strong>Data:</strong> ${formatDateTime(report.created_at)}</p>
                        <p><strong>Endereço:</strong> ${dados.endereco || "-"}, ${dados.bairro || "-"}</p>
                        <p><strong>Tipo:</strong> ${dados.solicitacao ? dados.solicitacao.join(", ") : "-"}</p>
                    </div>
                    <div class="result-card-actions">
                        <button class="btn btn-primary btn-small" onclick="viewReport('${report.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Ver Detalhes
                        </button>
                    </div>
                </div>
            `
      })
      .join("")
  }
})

// Função global para visualizar relatório
async function viewReport(id) {
  const supabase = initSupabase()

  try {
    const { data, error } = await supabase.from("relatorios").select("*").eq("id", id).single()

    if (error) throw error

    if (data && data.dados_relatorio) {
      generatePDF(data.dados_relatorio, data.protocolo)
    }
  } catch (err) {
    console.error("Erro ao carregar relatório:", err)
    alert("Erro ao carregar o relatório.")
  }
}
