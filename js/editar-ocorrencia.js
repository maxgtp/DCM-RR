document.addEventListener("DOMContentLoaded", () => {
  if (!window.requireAuth()) return

  var supabase = window.initSupabase()
  var form = document.getElementById("ocorrencia-form")
  var loading = document.getElementById("loading")
  var telefoneField = document.getElementById("telefone_solicitante")

  var urlParams = new URLSearchParams(window.location.search)
  var ocorrenciaId = urlParams.get("id")

  if (!ocorrenciaId) {
    window.showToast("ID da ocorrência não encontrado", "error")
    setTimeout(() => {
      window.location.href = "ocorrencias.html"
    }, 2000)
    return
  }

  loadOcorrencia()

  if (telefoneField) {
    telefoneField.addEventListener("input", (e) => {
      e.target.value = window.formatPhone(e.target.value)
    })
  }

  function loadOcorrencia() {
    loading.style.display = "flex"
    form.style.display = "none"

    supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", ocorrenciaId)
      .single()
      .then((response) => {
        if (response.error) throw response.error

        var ocorrencia = response.data
        populateForm(ocorrencia)
        form.style.display = "block"
      })
      .catch((err) => {
        console.error("Erro ao carregar:", err)
        window.showToast("Erro ao carregar ocorrência", "error")
        setTimeout(() => {
          window.location.href = "ocorrencias.html"
        }, 2000)
      })
      .finally(() => {
        loading.style.display = "none"
      })
  }

  function populateForm(ocorrencia) {
    document.getElementById("protocolo").value = ocorrencia.protocolo || ""
    document.getElementById("data_ocorrencia").value = ocorrencia.data_ocorrencia || ""
    document.getElementById("hora_ocorrencia").value = ocorrencia.hora_ocorrencia || ""
    document.getElementById("tipo_ocorrencia").value = ocorrencia.tipo_ocorrencia || ""
    document.getElementById("tipo_outro").value = ocorrencia.tipo_outro || ""
    document.getElementById("endereco").value = ocorrencia.endereco || ""
    document.getElementById("bairro").value = ocorrencia.bairro || ""
    document.getElementById("referencia").value = ocorrencia.referencia || ""
    document.getElementById("descricao").value = ocorrencia.descricao || ""
    document.getElementById("gravidade").value = ocorrencia.gravidade || ""
    document.getElementById("nome_solicitante").value = ocorrencia.nome_solicitante || ""
    document.getElementById("telefone_solicitante").value = ocorrencia.telefone_solicitante || ""
    document.getElementById("cpf_solicitante").value = ocorrencia.cpf_solicitante || ""
    document.getElementById("nome_agente").value = ocorrencia.nome_agente || ""
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      var dados = collectFormData()

      if (!dados.tipo_ocorrencia || !dados.endereco || !dados.descricao) {
        window.showToast("Preencha os campos obrigatórios", "error")
        return
      }

      var submitBtn = form.querySelector('button[type="submit"]')
      submitBtn.disabled = true
      submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Atualizando...'

      supabase
        .from("ocorrencias")
        .update({
          data_ocorrencia: dados.data_ocorrencia,
          hora_ocorrencia: dados.hora_ocorrencia,
          tipo_ocorrencia: dados.tipo_ocorrencia,
          tipo_outro: dados.tipo_outro,
          endereco: dados.endereco,
          bairro: dados.bairro,
          referencia: dados.referencia,
          descricao: dados.descricao,
          gravidade: dados.gravidade,
          nome_solicitante: dados.nome_solicitante,
          telefone_solicitante: dados.telefone_solicitante,
          cpf_solicitante: dados.cpf_solicitante,
          nome_agente: dados.nome_agente,
        })
        .eq("id", ocorrenciaId)
        .then((response) => {
          if (response.error) throw response.error

          window.showToast("Ocorrência atualizada com sucesso!", "success")

          setTimeout(() => {
            window.location.href = "ocorrencias.html"
          }, 2000)
        })
        .catch((err) => {
          console.error("Erro ao atualizar:", err)
          window.showToast("Erro ao atualizar ocorrência", "error")
          submitBtn.disabled = false
          submitBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Atualizar Ocorrência'
        })
    })
  }

  function collectFormData() {
    var formData = new FormData(form)
    var dados = {}

    var fields = [
      "data_ocorrencia",
      "hora_ocorrencia",
      "tipo_ocorrencia",
      "tipo_outro",
      "endereco",
      "bairro",
      "referencia",
      "descricao",
      "gravidade",
      "nome_solicitante",
      "telefone_solicitante",
      "cpf_solicitante",
      "nome_agente",
    ]

    fields.forEach((field) => {
      dados[field] = formData.get(field) || ""
    })

    return dados
  }
})
