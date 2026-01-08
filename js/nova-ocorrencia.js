document.addEventListener("DOMContentLoaded", () => {
  if (!window.requireAuth()) return

  var supabase = window.initSupabase()
  var form = document.getElementById("ocorrencia-form")
  var telefoneField = document.getElementById("telefone_solicitante")

  var now = new Date()
  document.getElementById("data_ocorrencia").value = now.toISOString().split("T")[0]
  document.getElementById("hora_ocorrencia").value = now.toTimeString().slice(0, 5)
  document.getElementById("protocolo").value = window.generateProtocol()

  if (telefoneField) {
    telefoneField.addEventListener("input", (e) => {
      e.target.value = window.formatPhone(e.target.value)
    })
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      var dados = collectFormData()

      if (!dados.protocolo || !dados.tipo_ocorrencia || !dados.endereco || !dados.descricao) {
        window.showToast("Preencha os campos obrigatórios", "error")
        return
      }

      var submitBtn = form.querySelector('button[type="submit"]')
      submitBtn.disabled = true
      submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Salvando...'

      supabase
        .from("ocorrencias")
        .insert([
          {
            protocolo: dados.protocolo,
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
            nome_agente: dados.nome_agente,
            matricula_agente: dados.matricula_agente,
            status: "Em Andamento",
          },
        ])
        .select()
        .then((response) => {
          if (response.error) throw response.error

          window.showToast("Ocorrência salva com sucesso!", "success")

          setTimeout(() => {
            window.location.href = "ocorrencias.html"
          }, 2000)
        })
        .catch((err) => {
          console.error("Erro ao salvar:", err)
          window.showToast("Erro ao salvar ocorrência", "error")
          submitBtn.disabled = false
          submitBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Ocorrência'
        })
    })
  }

  function collectFormData() {
    var formData = new FormData(form)
    var dados = {}

    var fields = [
      "protocolo",
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
      "nome_agente",
      "matricula_agente",
    ]

    fields.forEach((field) => {
      dados[field] = formData.get(field) || ""
    })

    return dados
  }
})
