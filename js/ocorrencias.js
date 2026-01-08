document.addEventListener("DOMContentLoaded", () => {
  if (!window.requireAuth()) return

  var supabase = window.initSupabase()

  var searchInput = document.getElementById("search-input")
  var searchBtn = document.getElementById("search-btn")
  var filterBtn = document.getElementById("filter-btn")
  var filterDropdown = document.getElementById("filter-dropdown")
  var statusFilter = document.getElementById("status-filter")
  var tipoFilter = document.getElementById("tipo-filter")
  var applyFilters = document.getElementById("apply-filters")
  var clearFilters = document.getElementById("clear-filters")
  var ocorrenciasList = document.getElementById("ocorrencias-list")
  var loading = document.getElementById("loading")
  var noOcorrencias = document.getElementById("no-ocorrencias")
  var confirmModal = document.getElementById("confirm-modal")
  var cancelDelete = document.getElementById("cancel-delete")
  var confirmDelete = document.getElementById("confirm-delete")
  var finalizarModal = document.getElementById("finalizar-modal")
  var cancelFinalizar = document.getElementById("cancel-finalizar")
  var confirmFinalizar = document.getElementById("confirm-finalizar")

  var ocorrencias = []
  var deleteId = null
  var finalizarId = null

  loadOcorrencias()

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

  searchBtn.addEventListener("click", () => {
    filterOcorrencias()
  })

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") filterOcorrencias()
  })

  applyFilters.addEventListener("click", () => {
    filterOcorrencias()
    filterDropdown.style.display = "none"
  })

  clearFilters.addEventListener("click", () => {
    statusFilter.value = ""
    tipoFilter.value = ""
    searchInput.value = ""
    filterOcorrencias()
    filterDropdown.style.display = "none"
  })

  function loadOcorrencias() {
    loading.style.display = "flex"
    ocorrenciasList.innerHTML = ""
    noOcorrencias.style.display = "none"

    supabase
      .from("ocorrencias")
      .select("*")
      .order("created_at", { ascending: false })
      .then((response) => {
        if (response.error) throw response.error

        ocorrencias = response.data || []
        renderOcorrencias(ocorrencias)
        updateStats()
      })
      .catch((err) => {
        console.error("Erro ao carregar:", err)
        window.showToast("Erro ao carregar ocorrências", "error")
      })
      .finally(() => {
        loading.style.display = "none"
      })
  }

  function filterOcorrencias() {
    var term = searchInput.value.toLowerCase().trim()
    var statusValue = statusFilter.value
    var tipoValue = tipoFilter.value

    var filtered = ocorrencias.filter((o) => {
      var protocolo = (o.protocolo || "").toLowerCase()
      var descricao = (o.descricao || "").toLowerCase()
      var status = o.status || "Em Andamento"
      var tipo = o.tipo_ocorrencia || ""

      var matchTerm = !term || protocolo.indexOf(term) !== -1 || descricao.indexOf(term) !== -1
      var matchStatus = !statusValue || status === statusValue
      var matchTipo = !tipoValue || tipo === tipoValue

      return matchTerm && matchStatus && matchTipo
    })

    renderOcorrencias(filtered)
  }

  function getGravidadeClass(gravidade) {
    switch (gravidade) {
      case "Baixa":
        return "risco-baixo"
      case "Média":
        return "risco-medio"
      case "Alta":
        return "risco-alto"
      case "Crítica":
        return "risco-critico"
      default:
        return "risco-indefinido"
    }
  }

  function renderOcorrencias(data) {
    if (data.length === 0) {
      ocorrenciasList.innerHTML = ""
      noOcorrencias.style.display = "flex"
      return
    }

    noOcorrencias.style.display = "none"
    var html = ""

    data.forEach((ocorrencia) => {
      var status = ocorrencia.status || "Em Andamento"
      var statusClass = status === "Concluída" ? "concluido" : "em-analise"

      html += '<div class="report-item">'
      html += '<div class="report-item-header">'
      html += "<h4>" + (ocorrencia.tipo_ocorrencia || "Sem tipo") + "</h4>"
      html += '<span class="status ' + statusClass + '">' + status + "</span>"
      html += "</div>"
      html += '<div class="report-item-body">'
      html += "<p><strong>Protocolo:</strong> " + (ocorrencia.protocolo || "-") + "</p>"
      html +=
        '<p><strong>Gravidade:</strong> <span class="risco-badge ' +
        getGravidadeClass(ocorrencia.gravidade) +
        '">' +
        (ocorrencia.gravidade || "Não definida") +
        "</span></p>"
      html += "<p><strong>Data:</strong> " + window.formatDateTime(ocorrencia.created_at) + "</p>"
      html += "<p><strong>Endereço:</strong> " + (ocorrencia.endereco || "-") + ", " + (ocorrencia.bairro || "-") + "</p>"
      html += "</div>"
      html += '<div class="report-item-actions">'

      if (status === "Em Andamento") {
        html +=
          '<button class="btn btn-success btn-small" onclick="openFinalizarModal(\'' +
          ocorrencia.id +
          "')\">Finalizar</button>"
      }

      html +=
        '<button class="btn btn-secondary btn-small" onclick="editOcorrencia(\'' +
        ocorrencia.id +
        "')\">Editar</button>"
      html +=
        '<button class="btn btn-danger btn-small" onclick="confirmDeleteOcorrencia(\'' +
        ocorrencia.id +
        "')\">Excluir</button>"
      html += "</div>"
      html += "</div>"
    })

    ocorrenciasList.innerHTML = html
  }

  function updateStats() {
    var total = ocorrencias.length
    var andamento = ocorrencias.filter((o) => o.status === "Em Andamento").length
    var concluidas = ocorrencias.filter((o) => o.status === "Concluída").length

    document.getElementById("total-ocorrencias").textContent = total
    document.getElementById("andamento-ocorrencias").textContent = andamento
    document.getElementById("concluidas-ocorrencias").textContent = concluidas
  }

  window.editOcorrencia = (id) => {
    window.location.href = "editar-ocorrencia.html?id=" + encodeURIComponent(id)
  }

  window.openFinalizarModal = (id) => {
    finalizarId = id
    finalizarModal.classList.add("show")
  }

  cancelFinalizar.addEventListener("click", () => {
    finalizarModal.classList.remove("show")
    finalizarId = null
  })

  confirmFinalizar.addEventListener("click", () => {
    if (finalizarId) {
      supabase
        .from("ocorrencias")
        .update({ status: "Concluída" })
        .eq("id", finalizarId)
        .then((response) => {
          if (response.error) throw response.error

          window.showToast("Ocorrência finalizada com sucesso", "success")
          loadOcorrencias()
        })
        .catch((err) => {
          console.error("Erro ao finalizar:", err)
          window.showToast("Erro ao finalizar ocorrência", "error")
        })
        .finally(() => {
          finalizarModal.classList.remove("show")
          finalizarId = null
        })
    }
  })

  window.confirmDeleteOcorrencia = (id) => {
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
        .from("ocorrencias")
        .delete()
        .eq("id", deleteId)
        .then((response) => {
          if (response.error) throw response.error

          window.showToast("Ocorrência excluída", "success")
          loadOcorrencias()
        })
        .catch((err) => {
          console.error("Erro ao excluir:", err)
          window.showToast("Erro ao excluir ocorrência", "error")
        })
        .finally(() => {
          confirmModal.classList.remove("show")
          deleteId = null
        })
    }
  })
})
