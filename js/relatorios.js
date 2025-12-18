// Script da lista de relatórios

document.addEventListener("DOMContentLoaded", async () => {
  // Verifica autenticação
  const requireAuth = () => true // Placeholder for requireAuth function
  if (!requireAuth()) return

  const supabase = {} // Placeholder for supabase initialization
  const initSupabase = () => {} // Placeholder for initSupabase function
  const searchInput = document.getElementById("search-input")
  const searchBtn = document.getElementById("search-btn")
  const reportsList = document.getElementById("reports-list")
  const loading = document.getElementById("loading")
  const noReports = document.getElementById("no-reports")
  const confirmModal = document.getElementById("confirm-modal")
  const cancelDelete = document.getElementById("cancel-delete")
  const confirmDelete = document.getElementById("confirm-delete")

  const showToast = (message, type) => {
    console.log(`${type}: ${message}`)
  } // Placeholder for showToast function

  const getStatusClass = (status) => {
    return status.toLowerCase()
  } // Placeholder for getStatusClass function

  const formatCPF = (cpf) => {
    return cpf // Placeholder for CPF formatting logic
  } // Placeholder for formatCPF function

  const formatDateTime = (date) => {
    return date // Placeholder for date formatting logic
  } // Placeholder for formatDateTime function

  const generatePDF = (data, protocolo) => {
    console.log(`Generating PDF for protocolo: ${protocolo}`) // Placeholder for PDF generation logic
  } // Placeholder for generatePDF function

  let reports = []
  let deleteId = null

  // Carrega relatórios iniciais
  await loadReports()

  // Busca
  searchBtn.addEventListener("click", () => filterReports())
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") filterReports()
  })

  // Modal de confirmação
  cancelDelete.addEventListener("click", () => {
    confirmModal.classList.remove("show")
    deleteId = null
  })

  confirmDelete.addEventListener("click", async () => {
    if (deleteId) {
      await deleteReport(deleteId)
      confirmModal.classList.remove("show")
      deleteId = null
    }
  })

  async function loadReports() {
    loading.style.display = "flex"
    reportsList.innerHTML = ""
    noReports.style.display = "none"

    try {
      const { data, error } = await supabase.from("relatorios").select("*").order("created_at", { ascending: false })

      if (error) throw error

      reports = data || []
      renderReports(reports)
    } catch (err) {
      console.error("Erro ao carregar:", err)
      showToast("Erro ao carregar relatórios", "error")
    } finally {
      loading.style.display = "none"
    }
  }

  function filterReports() {
    const term = searchInput.value.toLowerCase().trim()

    if (!term) {
      renderReports(reports)
      return
    }

    const filtered = reports.filter((r) => {
      const cpf = (r.cpf || "").toLowerCase()
      const protocolo = (r.protocolo || "").toLowerCase()
      const nome = (r.nome_cidadao || "").toLowerCase()

      return cpf.includes(term) || protocolo.includes(term) || nome.includes(term)
    })

    renderReports(filtered)
  }

  function renderReports(data) {
    if (data.length === 0) {
      reportsList.innerHTML = ""
      noReports.style.display = "flex"
      return
    }

    noReports.style.display = "none"
    reportsList.innerHTML = data
      .map((report) => {
        const dados = report.dados_relatorio || {}
        return `
                <div class="report-item">
                    <div class="report-item-header">
                        <h4>${report.nome_cidadao || "Sem nome"}</h4>
                        <span class="status ${getStatusClass(report.status)}">${report.status || "Pendente"}</span>
                    </div>
                    <div class="report-item-body">
                        <p><strong>Protocolo:</strong> ${report.protocolo || "-"}</p>
                        <p><strong>CPF:</strong> ${formatCPF(report.cpf || "")}</p>
                        <p><strong>Data:</strong> ${formatDateTime(report.created_at)}</p>
                        <p><strong>Endereço:</strong> ${dados.endereco || "-"}, ${dados.bairro || "-"}</p>
                    </div>
                    <div class="report-item-actions">
                        <button class="btn btn-primary btn-small" onclick="viewReportDetails('${report.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Ver PDF
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="updateStatus('${report.id}', '${report.status}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                            </svg>
                            Alterar Status
                        </button>
                        <button class="btn btn-danger btn-small" onclick="confirmDeleteReport('${report.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            Excluir
                        </button>
                    </div>
                </div>
            `
      })
      .join("")
  }

  // Funções globais
  window.viewReportDetails = async (id) => {
    const report = reports.find((r) => r.id === id)
    if (report) {
      generatePDF(report.dados_relatorio, report.protocolo)
    }
  }

  window.updateStatus = async (id, currentStatus) => {
    const statuses = ["Pendente", "Em Análise", "Concluído"]
    const currentIndex = statuses.indexOf(currentStatus || "Pendente")
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]

    try {
      const { error } = await supabase.from("relatorios").update({ status: nextStatus }).eq("id", id)

      if (error) throw error

      showToast(`Status alterado para: ${nextStatus}`, "success")
      await loadReports()
    } catch (err) {
      console.error("Erro ao atualizar:", err)
      showToast("Erro ao atualizar status", "error")
    }
  }

  window.confirmDeleteReport = (id) => {
    deleteId = id
    confirmModal.classList.add("show")
  }

  async function deleteReport(id) {
    try {
      const { error } = await supabase.from("relatorios").delete().eq("id", id)

      if (error) throw error

      showToast("Relatório excluído", "success")
      await loadReports()
    } catch (err) {
      console.error("Erro ao excluir:", err)
      showToast("Erro ao excluir relatório", "error")
    }
  }
})
