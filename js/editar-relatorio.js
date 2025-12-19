// Script para editar relatório existente
// Usa funções globais de config.js e utils.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] URL completa:", window.location.href)
  console.log("[v0] Search params:", window.location.search)

  // Verifica autenticação
  if (!window.requireAuth()) return

  // Pega o ID do relatório da URL
  var urlParams = new URLSearchParams(window.location.search)
  var reportId = urlParams.get("id")

  console.log("[v0] Report ID obtido:", reportId)

  if (!reportId) {
    alert("ID do relatório não informado")
    window.location.href = "relatorios.html"
    return
  }

  // Inicializa Supabase
  var supabase = window.initSupabase()

  var form = document.getElementById("report-form")
  var loadingEdit = document.getElementById("loading-edit")
  var generatePdfBtn = document.getElementById("generate-pdf-btn")
  var fotoInput = document.getElementById("fotos")
  var fotoPreview = document.getElementById("foto-preview")
  var uploadedPhotos = []
  var originalCPF = "" // CPF original (não pode ser alterado)

  // Carrega dados do relatório
  loadReport()

  function loadReport() {
    loadingEdit.style.display = "flex"
    form.style.display = "none"

    supabase
      .from("relatorios")
      .select("*")
      .eq("id", reportId)
      .single()
      .then((response) => {
        if (response.error) throw response.error

        var report = response.data
        if (!report) {
          alert("Relatório não encontrado")
          window.location.href = "relatorios.html"
          return
        }

        // Preenche o formulário com os dados existentes
        fillForm(report)
        loadingEdit.style.display = "none"
        form.style.display = "block"
      })
      .catch((err) => {
        console.error("Erro ao carregar:", err)
        alert("Erro ao carregar o relatório")
        window.location.href = "relatorios.html"
      })
  }

  function fillForm(report) {
    var dados = report.dados_relatorio || {}

    // Salva o CPF original
    originalCPF = report.cpf

    // Campos de texto simples
    var textFields = [
      "protocolo",
      "data_atendimento",
      "hora_atendimento",
      "nome_cidadao",
      "rg",
      "telefone",
      "endereco",
      "bairro",
      "cidade",
      "cep",
      "solicitacao_outra",
      "ocorrencia_outra",
      "tipo_edificacao",
      "pavimentos",
      "idade_edificacao",
      "area_construida",
      "tipo_estrutura",
      "tipo_cobertura",
      "ocupacao",
      "moradores",
      "patologia_outra",
      "local_anomalia_outro",
      "descricao_situacao",
      "analise_tecnica",
      "classificacao_risco",
      "recomendacoes",
      "parecer_final",
      "nome_agente",
      "matricula_agente",
      "cargo_agente",
    ]

    textFields.forEach((field) => {
      var element = document.getElementById(field)
      if (element && dados[field]) {
        element.value = dados[field]
      }
    })

    // CPF formatado (readonly)
    var cpfField = document.getElementById("cpf")
    if (cpfField) {
      cpfField.value = window.formatCPF(report.cpf || "")
    }

    // Campos checkbox (múltiplos valores)
    var checkboxFields = ["solicitacao", "ocorrencia", "patologia", "local_anomalia"]
    checkboxFields.forEach((fieldName) => {
      var values = dados[fieldName] || []
      var checkboxes = document.querySelectorAll('input[name="' + fieldName + '"]')
      checkboxes.forEach((checkbox) => {
        checkbox.checked = values.indexOf(checkbox.value) !== -1
      })
    })

    // Fotos existentes
    if (dados.fotos && dados.fotos.length > 0) {
      uploadedPhotos = dados.fotos
      renderPhotoPreview()
    }
  }

  function renderPhotoPreview() {
    var html = ""
    uploadedPhotos.forEach((photo, index) => {
      html += '<div class="foto-preview-item">'
      html += '<img src="' + photo.data + '" alt="' + photo.name + '">'
      html += '<button type="button" onclick="removePhoto(' + index + ')">&times;</button>'
      html += "</div>"
    })
    fotoPreview.innerHTML = html
  }

  // Função global para remover foto
  window.removePhoto = (index) => {
    uploadedPhotos.splice(index, 1)
    renderPhotoPreview()
  }

  // Preview de novas fotos
  fotoInput.addEventListener("change", (e) => {
    var files = Array.from(e.target.files)

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        var reader = new FileReader()
        reader.onload = (event) => {
          uploadedPhotos.push({
            name: file.name,
            data: event.target.result,
          })
          renderPhotoPreview()
        }
        reader.readAsDataURL(file)
      }
    })
  })

  // Formatação de telefone
  document.getElementById("telefone").addEventListener("input", (e) => {
    e.target.value = window.formatPhone(e.target.value)
  })

  // Formatação de CEP
  document.getElementById("cep").addEventListener("input", (e) => {
    e.target.value = window.formatCEP(e.target.value)
  })

  // Gerar PDF
  generatePdfBtn.addEventListener("click", () => {
    var dados = collectFormData()
    window.generatePDF(dados, dados.protocolo)
  })

  // Submeter formulário (atualizar)
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    var dados = collectFormData()

    // Validações básicas
    if (!dados.nome_cidadao || !dados.endereco || !dados.descricao_situacao) {
      window.showToast("Preencha os campos obrigatórios", "error")
      return
    }

    var submitBtn = form.querySelector('button[type="submit"]')
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Salvando...'

    // Adiciona fotos aos dados
    dados.fotos = uploadedPhotos

    // Atualiza no Supabase (mantém o CPF original)
    supabase
      .from("relatorios")
      .update({
        nome_cidadao: dados.nome_cidadao,
        dados_relatorio: dados,
        // CPF não é atualizado
      })
      .eq("id", reportId)
      .then((response) => {
        if (response.error) throw response.error

        window.showToast("Relatório atualizado com sucesso!", "success")

        // Redireciona após 2 segundos
        setTimeout(() => {
          window.location.href = "relatorios.html"
        }, 2000)
      })
      .catch((err) => {
        console.error("Erro ao atualizar:", err)
        window.showToast("Erro ao atualizar o relatório", "error")
        submitBtn.disabled = false
        submitBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Alterações'
      })
  })

  function collectFormData() {
    var formData = new FormData(form)
    var dados = {}

    // Campos de texto
    var textFields = [
      "protocolo",
      "data_atendimento",
      "hora_atendimento",
      "nome_cidadao",
      "cpf",
      "rg",
      "telefone",
      "endereco",
      "bairro",
      "cidade",
      "cep",
      "solicitacao_outra",
      "ocorrencia_outra",
      "tipo_edificacao",
      "pavimentos",
      "idade_edificacao",
      "area_construida",
      "tipo_estrutura",
      "tipo_cobertura",
      "ocupacao",
      "moradores",
      "patologia_outra",
      "local_anomalia_outro",
      "descricao_situacao",
      "analise_tecnica",
      "classificacao_risco",
      "recomendacoes",
      "parecer_final",
      "nome_agente",
      "matricula_agente",
      "cargo_agente",
    ]

    textFields.forEach((field) => {
      dados[field] = formData.get(field) || ""
    })

    // Campos checkbox (múltiplos valores)
    dados.solicitacao = formData.getAll("solicitacao")
    dados.ocorrencia = formData.getAll("ocorrencia")
    dados.patologia = formData.getAll("patologia")
    dados.local_anomalia = formData.getAll("local_anomalia")

    return dados
  }
})
