// Script da lista de relatórios
// Usa funções globais de config.js e utils.js

document.addEventListener("DOMContentLoaded", () => {
  // Verifica autenticação
  if (!window.requireAuth()) return

  // Inicializa Supabase
  var supabase = window.initSupabase()

  var searchInput = document.getElementById("search-input")
  var searchBtn = document.getElementById("search-btn")
  var statusFilter = document.getElementById("status-filter") // Adicionando referência ao filtro de status
  var reportsList = document.getElementById("reports-list")
  var loading = document.getElementById("loading")
  var noReports = document.getElementById("no-reports")
  var confirmModal = document.getElementById("confirm-modal")
  var cancelDelete = document.getElementById("cancel-delete")
  var confirmDelete = document.getElementById("confirm-delete")

  var reports = []
  var deleteId = null

  // Carrega relatórios iniciais
  loadReports()

  // Busca
  searchBtn.addEventListener("click", () => {
    filterReports()
  })

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") filterReports()
  })

  statusFilter.addEventListener("change", () => {
    filterReports()
  })

  function loadReports() {
    loading.style.display = "flex"
    reportsList.innerHTML = ""
    noReports.style.display = "none"

    supabase
      .from("relatorios")
      .select("*")
      .order("created_at", { ascending: false })
      .then((response) => {
        if (response.error) throw response.error

        reports = response.data || []
        renderReports(reports)
      })
      .catch((err) => {
        console.error("Erro ao carregar:", err)
        window.showToast("Erro ao carregar relatórios", "error")
      })
      .finally(() => {
        loading.style.display = "none"
      })
  }

  function filterReports() {
    var term = searchInput.value.toLowerCase().trim()
    var statusValue = statusFilter.value // Obtém valor do filtro de status

    var filtered = reports.filter((r) => {
      var cpf = (r.cpf || "").toLowerCase()
      var protocolo = (r.protocolo || "").toLowerCase()
      var nome = (r.nome_cidadao || "").toLowerCase()
      var status = r.status || "Pendente"

      // Filtra por termo de busca
      var matchTerm = !term || cpf.indexOf(term) !== -1 || protocolo.indexOf(term) !== -1 || nome.indexOf(term) !== -1

      var matchStatus = !statusValue || status === statusValue

      return matchTerm && matchStatus
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
    var html = ""

    data.forEach((report) => {
      var dados = report.dados_relatorio || {}
      html += '<div class="report-item">'
      html += '<div class="report-item-header">'
      html += "<h4>" + (report.nome_cidadao || "Sem nome") + "</h4>"
      html +=
        '<span class="status ' + window.getStatusClass(report.status) + '">' + (report.status || "Pendente") + "</span>"
      html += "</div>"
      html += '<div class="report-item-body">'
      html += "<p><strong>Protocolo:</strong> " + (report.protocolo || "-") + "</p>"
      html += "<p><strong>CPF:</strong> " + window.formatCPF(report.cpf || "") + "</p>"
      html += "<p><strong>Data:</strong> " + window.formatDateTime(report.created_at) + "</p>"
      html += "<p><strong>Endereço:</strong> " + (dados.endereco || "-") + ", " + (dados.bairro || "-") + "</p>"
      html += "</div>"
      html += '<div class="report-item-actions">'
      html +=
        '<button class="btn btn-primary btn-small" onclick="downloadReportPDF(\'' +
        report.id +
        "')\">Baixar PDF</button>"
      html += '<button class="btn btn-success btn-small" onclick="editReport(\'' + report.id + "')\">Editar</button>"
      html +=
        '<button class="btn btn-secondary btn-small" onclick="updateStatus(\'' +
        report.id +
        "', '" +
        report.status +
        "')\">Alterar Status</button>"
      html +=
        '<button class="btn btn-danger btn-small" onclick="confirmDeleteReport(\'' + report.id + "')\">Excluir</button>"
      html += "</div>"
      html += "</div>"
    })

    reportsList.innerHTML = html
  }

  // Funções globais
  window.downloadReportPDF = (id) => {
    var report = reports.find((r) => r.id === id)
    if (report) {
      window.downloadPDF(report.dados_relatorio, report.protocolo)
    }
  }

  window.editReport = (id) => {
    window.location.href = "editar-relatorio.html?id=" + id
  }

  window.updateStatus = (id, currentStatus) => {
    var statuses = ["Pendente", "Em Análise", "Concluído"]
    var currentIndex = statuses.indexOf(currentStatus || "Pendente")
    var nextStatus = statuses[(currentIndex + 1) % statuses.length]

    supabase
      .from("relatorios")
      .update({ status: nextStatus })
      .eq("id", id)
      .then((response) => {
        if (response.error) throw response.error

        window.showToast("Status alterado para: " + nextStatus, "success")
        loadReports()
      })
      .catch((err) => {
        console.error("Erro ao atualizar:", err)
        window.showToast("Erro ao atualizar status", "error")
      })
  }

  window.confirmDeleteReport = (id) => {
    deleteId = id
    confirmModal.classList.add("show")
  }

  function deleteReport(id) {
    supabase
      .from("relatorios")
      .delete()
      .eq("id", id)
      .then((response) => {
        if (response.error) throw response.error

        window.showToast("Relatório excluído", "success")
        loadReports()
      })
      .catch((err) => {
        console.error("Erro ao excluir:", err)
        window.showToast("Erro ao excluir relatório", "error")
      })
  }
})
