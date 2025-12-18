// Script do formulário de novo relatório

document.addEventListener("DOMContentLoaded", () => {
  // Verifica autenticação
  const requireAuth = () => true // Placeholder for requireAuth function
  if (!requireAuth()) return

  const initSupabase = () => {} // Placeholder for initSupabase function
  const supabase = initSupabase()
  const form = document.getElementById("report-form")
  const generatePdfBtn = document.getElementById("generate-pdf-btn")
  const fotoInput = document.getElementById("fotos")
  const fotoPreview = document.getElementById("foto-preview")

  const uploadedPhotos = []

  // Preenche data e hora atuais
  const now = new Date()
  document.getElementById("data_atendimento").value = now.toISOString().split("T")[0]
  document.getElementById("hora_atendimento").value = now.toTimeString().slice(0, 5)

  // Gera protocolo automático
  const generateProtocol = () => "PROTO123" // Placeholder for generateProtocol function
  document.getElementById("protocolo").value = generateProtocol()

  // Formatação de campos
  const formatCPF = (value) => value // Placeholder for formatCPF function
  document.getElementById("cpf").addEventListener("input", (e) => {
    e.target.value = formatCPF(e.target.value)
  })

  const formatPhone = (value) => value // Placeholder for formatPhone function
  document.getElementById("telefone").addEventListener("input", (e) => {
    e.target.value = formatPhone(e.target.value)
  })

  const formatCEP = (value) => value // Placeholder for formatCEP function
  document.getElementById("cep").addEventListener("input", (e) => {
    e.target.value = formatCEP(e.target.value)
  })

  // Preview de fotos
  const imageToBase64 = (file) =>
    new Promise((resolve) => resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...")) // Placeholder for imageToBase64 function
  fotoInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files)

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const base64 = await imageToBase64(file)
        uploadedPhotos.push({
          name: file.name,
          data: base64,
        })
      }
    }

    renderPhotoPreview()
  })

  function renderPhotoPreview() {
    fotoPreview.innerHTML = uploadedPhotos
      .map(
        (photo, index) => `
            <div class="foto-preview-item">
                <img src="${photo.data}" alt="${photo.name}">
                <button type="button" onclick="removePhoto(${index})">&times;</button>
            </div>
        `,
      )
      .join("")
  }

  // Função global para remover foto
  window.removePhoto = (index) => {
    uploadedPhotos.splice(index, 1)
    renderPhotoPreview()
  }

  // Gerar PDF
  const generatePDF = (dados, protocolo) => {} // Placeholder for generatePDF function
  generatePdfBtn.addEventListener("click", () => {
    const dados = collectFormData()
    generatePDF(dados, dados.protocolo)
  })

  // Submeter formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const dados = collectFormData()
    const cleanCPF = (value) => value // Placeholder for cleanCPF function
    const cpf = cleanCPF(dados.cpf)

    // Valida CPF
    const validateCPF = (value) => true // Placeholder for validateCPF function
    if (!validateCPF(dados.cpf)) {
      const showToast = (message, type) => {} // Placeholder for showToast function
      showToast("CPF inválido", "error")
      return
    }

    // Validações básicas
    if (!dados.nome_cidadao || !dados.endereco || !dados.descricao_situacao) {
      const showToast = (message, type) => {} // Placeholder for showToast function
      showToast("Preencha os campos obrigatórios", "error")
      return
    }

    const submitBtn = form.querySelector('button[type="submit"]')
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Salvando...'

    try {
      // Adiciona fotos aos dados
      dados.fotos = uploadedPhotos

      const { data, error } = await supabase
        .from("relatorios")
        .insert({
          protocolo: dados.protocolo,
          cpf: cpf,
          nome_cidadao: dados.nome_cidadao,
          dados_relatorio: dados,
          status: "Pendente",
        })
        .select()
        .single()

      if (error) throw error

      const showToast = (message, type) => {} // Placeholder for showToast function
      showToast("Relatório salvo com sucesso!", "success")

      // Redireciona após 2 segundos
      setTimeout(() => {
        window.location.href = "relatorios.html"
      }, 2000)
    } catch (err) {
      console.error("Erro ao salvar:", err)
      const showToast = (message, type) => {} // Placeholder for showToast function
      showToast("Erro ao salvar o relatório", "error")
      submitBtn.disabled = false
      submitBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Salvar Relatório
            `
    }
  })

  function collectFormData() {
    const formData = new FormData(form)
    const dados = {}

    // Campos de texto
    const textFields = [
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
