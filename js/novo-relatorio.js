// Script do formulário de novo relatório
// Usa funções globais de config.js e utils.js

document.addEventListener("DOMContentLoaded", () => {
  // Importações necessárias
  var requireAuth = window.requireAuth
  var initSupabase = window.initSupabase
  var generateProtocol = window.generateProtocol
  var formatCPF = window.formatCPF
  var formatPhone = window.formatPhone
  var formatCEP = window.formatCEP
  var cleanCPF = window.cleanCPF
  var validateCPF = window.validateCPF
  var showToast = window.showToast

  // Verifica autenticação
  if (!requireAuth()) return

  // Inicializa Supabase
  var supabase = initSupabase()

  var form = document.getElementById("report-form")
  var fotoInput = document.getElementById("fotos")
  var fotoPreview = document.getElementById("foto-preview")
  var uploadedPhotos = []

  // Preenche data e hora atuais
  var now = new Date()
  document.getElementById("data_atendimento").value = now.toISOString().split("T")[0]
  document.getElementById("hora_atendimento").value = now.toTimeString().slice(0, 5)

  // Gera protocolo automático
  document.getElementById("protocolo").value = generateProtocol()

  // Formatação de CPF
  var cpfField = document.getElementById("cpf")
  if (cpfField) {
    cpfField.addEventListener("input", (e) => {
      e.target.value = formatCPF(e.target.value)
    })
  }

  // Formatação de telefone
  var telefoneField = document.getElementById("telefone")
  if (telefoneField) {
    telefoneField.addEventListener("input", (e) => {
      e.target.value = formatPhone(e.target.value)
    })
  }

  // Formatação de CEP
  var cepField = document.getElementById("cep")
  if (cepField) {
    cepField.addEventListener("input", (e) => {
      e.target.value = formatCEP(e.target.value)
    })
  }

  // Preview de fotos
  if (fotoInput) {
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
  }

  function renderPhotoPreview() {
    var html = ""
    uploadedPhotos.forEach((photo, index) => {
      html += '<div class="foto-preview-item">'
      html += '<img src="' + photo.data + '" alt="' + photo.name + '">'
      html += '<button type="button" onclick="removePhoto(' + index + ')">&times;</button>'
      html += "</div>"
    })
    if (fotoPreview) {
      fotoPreview.innerHTML = html
    }
  }

  // Função global para remover foto
  window.removePhoto = (index) => {
    uploadedPhotos.splice(index, 1)
    renderPhotoPreview()
  }

  // Submeter formulário
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      var dados = collectFormData()
      var cpfLimpo = cleanCPF(dados.cpf)

      // Valida CPF
      if (!validateCPF(dados.cpf)) {
        showToast("CPF inválido", "error")
        return
      }

      // Validações básicas
      if (!dados.nome_cidadao || !dados.endereco || !dados.descricao_situacao) {
        showToast("Preencha os campos obrigatórios", "error")
        return
      }

      var submitBtn = form.querySelector('button[type="submit"]')
      submitBtn.disabled = true
      submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Salvando...'

      // Adiciona fotos aos dados
      dados.fotos = uploadedPhotos

      // Usa o SaveManager para salvar com progresso
      window.SaveManager.salvarComProgresso(dados, supabase, false, null)
        .then((response) => {
          showToast("Relatório salvo com sucesso!", "success")

          // Redireciona após 2 segundos
          setTimeout(() => {
            window.location.href = "relatorios.html"
          }, 2000)
        })
        .catch((err) => {
          console.error("Erro ao salvar:", err)
          submitBtn.disabled = false
          submitBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Relatório'
        })
    })
  }

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
