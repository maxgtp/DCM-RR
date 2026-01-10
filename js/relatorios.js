// Script da lista de relatórios
// Usa funções globais de config.js e utils.js

document.addEventListener("DOMContentLoaded", () => {
  // Verifica autenticação
  if (!window.requireAuth()) return

  // Inicializa Supabase
  var supabase = window.initSupabase()

  if (window.SaveManager && window.SaveManager.mostrarNotificacaoPendencias) {
    window.SaveManager.mostrarNotificacaoPendencias()
  }

  var searchInput = document.getElementById("search-input")
  var searchBtn = document.getElementById("search-btn")
  var filterBtn = document.getElementById("filter-btn")
  var filterDropdown = document.getElementById("filter-dropdown")
  var statusFilter = document.getElementById("status-filter")
  var riscoFilter = document.getElementById("risco-filter")
  var applyFilters = document.getElementById("apply-filters")
  var clearFilters = document.getElementById("clear-filters")
  var reportsList = document.getElementById("reports-list")
  var loading = document.getElementById("loading")
  var noReports = document.getElementById("no-reports")
  var confirmModal = document.getElementById("confirm-modal")
  var cancelDelete = document.getElementById("cancel-delete")
  var confirmDelete = document.getElementById("confirm-delete")

  var statusModal = document.getElementById("status-modal")
  var cancelStatus = document.getElementById("cancel-status")
  var confirmStatus = document.getElementById("confirm-status")

  var reports = []
  var deleteId = null
  var statusChangeId = null

  // Carrega relatórios iniciais
  loadReports()

  function toggleFilter(e) {
    e.preventDefault()
    e.stopPropagation()
    if (filterDropdown.style.display === "none" || filterDropdown.style.display === "") {
      filterDropdown.style.display = "flex"
    } else {
      filterDropdown.style.display = "none"
    }
  }

  filterBtn.addEventListener("click", toggleFilter)
  filterBtn.addEventListener("touchend", toggleFilter)

  // Busca
  searchBtn.addEventListener("click", () => {
    filterReports()
  })

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") filterReports()
  })

  applyFilters.addEventListener("click", () => {
    filterReports()
    filterDropdown.style.display = "none"
  })

  clearFilters.addEventListener("click", () => {
    statusFilter.value = ""
    riscoFilter.value = ""
    searchInput.value = ""
    filterReports()
    filterDropdown.style.display = "none"
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
    var statusValue = statusFilter.value
    var riscoValue = riscoFilter.value

    var filtered = reports.filter((r) => {
      var cpf = (r.cpf || "").toLowerCase()
      var protocolo = (r.protocolo || "").toLowerCase()
      var nome = (r.nome_cidadao || "").toLowerCase()
      var status = r.status || "Pendente"
      var dados = r.dados_relatorio || {}
      var classificacao = dados.classificacao_risco || ""

      var matchTerm = !term || cpf.indexOf(term) !== -1 || protocolo.indexOf(term) !== -1 || nome.indexOf(term) !== -1
      var matchStatus = !statusValue || status === statusValue
      var matchRisco = !riscoValue || classificacao === riscoValue

      return matchTerm && matchStatus && matchRisco
    })

    renderReports(filtered)
  }

  function getRiscoClass(risco) {
    switch (risco) {
      case "Baixo":
        return "risco-baixo"
      case "Médio":
        return "risco-medio"
      case "Alto":
        return "risco-alto"
      case "Crítico":
        return "risco-critico"
      default:
        return "risco-indefinido"
    }
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
      var classificacao = dados.classificacao_risco || "Não definido"

      html += '<div class="report-item">'
      html += '<div class="report-item-header">'
      html += "<h4>" + (report.nome_cidadao || "Sem nome") + "</h4>"
      html +=
        '<span class="status ' + window.getStatusClass(report.status) + '">' + (report.status || "Pendente") + "</span>"
      html += "</div>"
      html += '<div class="report-item-body">'
      html += "<p><strong>Protocolo:</strong> " + (report.protocolo || "-") + "</p>"
      html +=
        '<p><strong>Risco:</strong> <span class="risco-badge ' +
        getRiscoClass(classificacao) +
        '">' +
        classificacao +
        "</span></p>"
      html += "<p><strong>Data:</strong> " + window.formatDateTime(report.created_at) + "</p>"
      html += "<p><strong>Endereço:</strong> " + (dados.endereco || "-") + ", " + (dados.bairro || "-") + "</p>"
      html += "</div>"
      html += '<div class="report-item-actions">'
      html +=
        '<button class="btn btn-primary btn-small" onclick="viewReportPDF(\'' +
        report.id +
        "')\">Ver PDF</button>"
      html += '<button class="btn btn-success btn-small" onclick="editReport(\'' + report.id + "')\">Editar</button>"
      html +=
        '<button class="btn btn-secondary btn-small" onclick="openStatusModal(\'' +
        report.id +
        "', '" +
        (report.status || "Pendente") +
        "')\">Alterar Status</button>"
      html +=
        '<button class="btn btn-danger btn-small" onclick="confirmDeleteReport(\'' + report.id + "')\">Excluir</button>"
      html += "</div>"
      html += "</div>"
    })

    reportsList.innerHTML = html
  }

  // Funções globais
  window.viewReportPDF = (id) => {
    var report = reports.find((r) => r.id === id)
    if (report) {
      window.openPDFInNewWindow(report.dados_relatorio, report.protocolo)
    }
  }

  window.editReport = (id) => {
    window.location.href = "editar-relatorio.html?id=" + encodeURIComponent(id)
  }

  window.openStatusModal = (id, currentStatus) => {
    statusChangeId = id
    // Marca o status atual como selecionado
    var radios = document.querySelectorAll('input[name="new-status"]')
    radios.forEach((radio) => {
      radio.checked = radio.value === currentStatus
    })
    statusModal.classList.add("show")
  }

  cancelStatus.addEventListener("click", () => {
    statusModal.classList.remove("show")
    statusChangeId = null
  })

  confirmStatus.addEventListener("click", () => {
    if (!statusChangeId) return

    var selectedRadio = document.querySelector('input[name="new-status"]:checked')
    if (!selectedRadio) {
      window.showToast("Selecione um status", "error")
      return
    }

    var newStatus = selectedRadio.value

    supabase
      .from("relatorios")
      .update({ status: newStatus })
      .eq("id", statusChangeId)
      .then((response) => {
        if (response.error) throw response.error

        window.showToast("Status alterado para: " + newStatus, "success")
        loadReports()
      })
      .catch((err) => {
        console.error("Erro ao atualizar:", err)
        window.showToast("Erro ao atualizar status", "error")
      })
      .finally(() => {
        statusModal.classList.remove("show")
        statusChangeId = null
      })
  })

  window.confirmDeleteReport = (id) => {
    deleteId = id
    confirmModal.classList.add("show")
  }

  cancelDelete.addEventListener("click", () => {
    confirmModal.classList.remove("show")
    deleteId = null
  })

  confirmDelete.addEventListener("click", () => {
    if (deleteId) {
      supabase
        .from("relatorios")
        .delete()
        .eq("id", deleteId)
        .then((response) => {
          if (response.error) throw response.error

          window.showToast("Relatório excluído", "success")
          loadReports()
        })
        .catch((err) => {
          console.error("Erro ao excluir:", err)
          window.showToast("Erro ao excluir relatório", "error")
        })
        .finally(() => {
          confirmModal.classList.remove("show")
          deleteId = null
        })
    }
  })
})
