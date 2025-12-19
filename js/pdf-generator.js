// Gerador de PDF usando jsPDF

// URLs das logos
var LOGO1_URL = "https://maxgtp.github.io/DCM-RR/public/images/logo1.png"
var LOGO2_URL = "https://maxgtp.github.io/DCM-RR/public/images/logo2.png"

// Cache das logos em base64
var logosCarregadas = {
  logo1: null,
  logo2: null,
  carregado: false,
}

// Função para carregar imagem como base64
function carregarImagemBase64(url) {
  return new Promise((resolve, reject) => {
    var img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      var canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      var ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)
      var dataURL = canvas.toDataURL("image/png")
      resolve(dataURL)
    }
    img.onerror = () => {
      resolve(null)
    }
    img.src = url
  })
}

// Carrega as logos uma vez
function carregarLogos() {
  if (logosCarregadas.carregado) {
    return Promise.resolve(logosCarregadas)
  }

  return Promise.all([carregarImagemBase64(LOGO1_URL), carregarImagemBase64(LOGO2_URL)]).then((results) => {
    logosCarregadas.logo1 = results[0]
    logosCarregadas.logo2 = results[1]
    logosCarregadas.carregado = true
    return logosCarregadas
  })
}

function criarDocumentoPDF(dados, protocolo, logos) {
  var jsPDF = window.jspdf.jsPDF
  var doc = new jsPDF()

  var y = 20
  var margin = 15
  var pageWidth = doc.internal.pageSize.getWidth()
  var pageHeight = doc.internal.pageSize.getHeight()
  var contentWidth = pageWidth - margin * 2

  // Cores do tema
  var corPrimaria = [30, 58, 95] // Azul escuro
  var corSecundaria = [234, 88, 12] // Laranja
  var corFundo = [245, 245, 245] // Cinza claro

  // Função para verificar e adicionar nova página se necessário
  function checkPageBreak(neededSpace) {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage()
      y = 20
    }
  }

  // Função para formatar CPF
  function formatCPFLocal(cpf) {
    if (!cpf || cpf.length !== 11) return cpf || "-"
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Função para desenhar cabeçalho de seção com design melhorado
  function desenharCabecalhoSecao(numero, titulo) {
    checkPageBreak(20)

    // Fundo da seção com gradiente simulado
    doc.setFillColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F")

    // Número da seção em destaque
    doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
    doc.roundedRect(margin, y, 25, 10, 2, 0, "F")
    doc.rect(margin + 15, y, 10, 10, "F") // Preenche canto

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(numero + ".", margin + 8, y + 7)

    doc.text(titulo, margin + 30, y + 7)
    y += 14

    doc.setTextColor(0, 0, 0)
  }

  // Função para desenhar campo com label
  function desenharCampo(label, valor, x, largura) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(100, 100, 100)
    doc.text(label, x, y)

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    doc.text(valor || "-", x, y + 4)
  }

  // ==================== CABEÇALHO ====================
  // Fundo do cabeçalho
  doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.rect(0, 0, pageWidth, 45, "F")

  // Faixa laranja decorativa
  doc.setFillColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.rect(0, 45, pageWidth, 3, "F")

  // Logo 1 (esquerda) - SMSPT
  if (logos && logos.logo1) {
    try {
      doc.addImage(logos.logo1, "PNG", margin, 5, 28, 30)
    } catch (e) {
      console.log("Erro ao adicionar logo1")
    }
  }

  // Logo 2 (direita) - Defesa Civil
  if (logos && logos.logo2) {
    try {
      doc.addImage(logos.logo2, "PNG", pageWidth - margin - 28, 5, 28, 30)
    } catch (e) {
      console.log("Erro ao adicionar logo2")
    }
  }

  // Texto central do cabeçalho
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("DEFESA CIVIL", pageWidth / 2, 16, { align: "center" })

  doc.setFontSize(10)
  doc.text("CIDADE OCIDENTAL - GO", pageWidth / 2, 23, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("RELATÓRIO DE VISTORIA TÉCNICA", pageWidth / 2, 32, { align: "center" })

  // Box do protocolo
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(pageWidth / 2 - 30, 35, 60, 8, 1, 1, "F")
  doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Protocolo: " + (protocolo || "N/A"), pageWidth / 2, 40.5, { align: "center" })

  y = 55
  doc.setTextColor(0, 0, 0)

  // ==================== SEÇÃO 1: IDENTIFICAÇÃO ====================
  desenharCabecalhoSecao("1", "IDENTIFICAÇÃO")

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, "F")
  y += 3

  desenharCampo("Data do Atendimento", dados.data_atendimento, margin + 3, 50)
  desenharCampo("Hora", dados.hora_atendimento, margin + 60, 30)
  desenharCampo("Protocolo", protocolo, margin + 100, 50)
  y += 14

  // ==================== SEÇÃO 2: DEMANDA ====================
  desenharCabecalhoSecao("2", "DEMANDA")

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 28, 1, 1, "F")
  y += 3

  desenharCampo("Nome Completo", dados.nome_cidadao, margin + 3, 100)
  y += 10

  desenharCampo("CPF", formatCPFLocal(dados.cpf), margin + 3, 40)
  desenharCampo("RG", dados.rg, margin + 50, 40)
  desenharCampo("Telefone", dados.telefone, margin + 100, 50)
  y += 10

  desenharCampo(
    "Endereço",
    dados.endereco + " - " + (dados.bairro || "") + " - " + (dados.cidade || "") + " - CEP: " + (dados.cep || ""),
    margin + 3,
    contentWidth - 6,
  )
  y += 14

  // ==================== SEÇÃO 3: SOLICITAÇÃO ====================
  desenharCabecalhoSecao("3", "SOLICITAÇÃO")

  var solicitacoes = dados.solicitacao || []
  var solicitacaoTexto = solicitacoes.length > 0 ? solicitacoes.join(", ") : "-"
  if (dados.solicitacao_outra) {
    solicitacaoTexto += " | Outra: " + dados.solicitacao_outra
  }

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, "F")
  y += 3
  desenharCampo("Tipo de Solicitação", solicitacaoTexto, margin + 3, contentWidth - 6)
  y += 14

  // ==================== SEÇÃO 4: TIPO DE OCORRÊNCIA ====================
  desenharCabecalhoSecao("4", "TIPO DE OCORRÊNCIA")

  var ocorrencias = dados.ocorrencia || []
  var ocorrenciasTexto = ocorrencias.length > 0 ? ocorrencias.join(", ") : "-"
  var ocorrenciasLines = doc.splitTextToSize(ocorrenciasTexto, contentWidth - 10)
  var alturaOcorrencias = Math.max(12, ocorrenciasLines.length * 5 + 6)

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, alturaOcorrencias, 1, 1, "F")

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(ocorrenciasLines, margin + 3, y + 6)
  y += alturaOcorrencias + 4

  // ==================== SEÇÃO 5: DESCRIÇÃO DA EDIFICAÇÃO ====================
  checkPageBreak(50)
  desenharCabecalhoSecao("5", "DESCRIÇÃO DA EDIFICAÇÃO")

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 28, 1, 1, "F")
  y += 3

  desenharCampo("Tipo", dados.tipo_edificacao, margin + 3, 40)
  desenharCampo("Pavimentos", dados.pavimentos, margin + 45, 25)
  desenharCampo("Idade (anos)", dados.idade_edificacao, margin + 80, 25)
  desenharCampo("Área (m²)", dados.area_construida, margin + 115, 30)
  y += 10

  desenharCampo("Estrutura", dados.tipo_estrutura, margin + 3, 50)
  desenharCampo("Cobertura", dados.tipo_cobertura, margin + 55, 50)
  y += 10

  desenharCampo("Ocupação", dados.ocupacao, margin + 3, 50)
  desenharCampo("Nº de Moradores", dados.moradores, margin + 55, 30)
  y += 14

  // ==================== SEÇÃO 6: MANIFESTAÇÕES PATOLÓGICAS ====================
  checkPageBreak(30)
  desenharCabecalhoSecao("6", "MANIFESTAÇÕES PATOLÓGICAS")

  var patologias = dados.patologia || []
  var patologiasTexto = patologias.length > 0 ? patologias.join(", ") : "-"
  var patologiasLines = doc.splitTextToSize(patologiasTexto, contentWidth - 10)
  var alturaPatologias = Math.max(12, patologiasLines.length * 5 + 6)

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, alturaPatologias, 1, 1, "F")

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(patologiasLines, margin + 3, y + 6)
  y += alturaPatologias + 4

  // ==================== SEÇÃO 7: LOCALIZAÇÃO DA ANOMALIA ====================
  checkPageBreak(25)
  desenharCabecalhoSecao("7", "LOCALIZAÇÃO DA ANOMALIA")

  var locais = dados.local_anomalia || []
  var locaisTexto = locais.length > 0 ? locais.join(", ") : "-"

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, "F")

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(locaisTexto, margin + 3, y + 7)
  y += 16

  // ==================== SEÇÃO 8: RELATÓRIO DE VISTORIA ====================
  checkPageBreak(80)
  desenharCabecalhoSecao("8", "RELATÓRIO DE VISTORIA")

  // Descrição da Situação
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text("Descrição da Situação:", margin, y)
  y += 4

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var descricaoLines = doc.splitTextToSize(dados.descricao_situacao || "-", contentWidth)
  doc.text(descricaoLines, margin, y)
  y += descricaoLines.length * 4 + 6

  // Análise Técnica
  checkPageBreak(40)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text("Análise Técnica:", margin, y)
  y += 4

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var analiseLines = doc.splitTextToSize(dados.analise_tecnica || "-", contentWidth)
  doc.text(analiseLines, margin, y)
  y += analiseLines.length * 4 + 6

  // Classificação de Risco
  checkPageBreak(20)
  doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("CLASSIFICAÇÃO DE RISCO: " + (dados.classificacao_risco || "-").toUpperCase(), pageWidth / 2, y + 7, {
    align: "center",
  })
  y += 14

  // Recomendações
  checkPageBreak(40)
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.setFontSize(9)
  doc.text("Recomendações:", margin, y)
  y += 4

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var recomendacoesLines = doc.splitTextToSize(dados.recomendacoes || "-", contentWidth)
  doc.text(recomendacoesLines, margin, y)
  y += recomendacoesLines.length * 4 + 6

  // Parecer Final
  checkPageBreak(40)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text("Parecer Final:", margin, y)
  y += 4

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var parecerLines = doc.splitTextToSize(dados.parecer_final || "-", contentWidth)
  doc.text(parecerLines, margin, y)
  y += parecerLines.length * 4 + 10

  // ==================== SEÇÃO 9: AGENTE RESPONSÁVEL ====================
  checkPageBreak(50)
  desenharCabecalhoSecao("9", "AGENTE RESPONSÁVEL")

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 18, 1, 1, "F")
  y += 3

  desenharCampo("Nome do Agente", dados.nome_agente, margin + 3, 80)
  y += 10
  desenharCampo("Matrícula", dados.matricula_agente, margin + 3, 40)
  desenharCampo("Cargo/Função", dados.cargo_agente, margin + 60, 60)
  y += 18

  // Área de assinatura
  checkPageBreak(35)
  doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.setLineWidth(0.5)
  doc.line(pageWidth / 2 - 50, y + 15, pageWidth / 2 + 50, y + 15)

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text("Assinatura do Agente Responsável", pageWidth / 2, y + 20, { align: "center" })
  y += 30

  // ==================== SEÇÃO 10: REGISTRO FOTOGRÁFICO (NOVA PÁGINA) ====================
  var fotos = dados.fotos || []
  if (fotos.length > 0) {
    doc.addPage()
    y = 20

    desenharCabecalhoSecao("10", "REGISTRO FOTOGRÁFICO")
    y += 5

    var imgWidth = 85
    var imgHeight = 65
    var imgsPerRow = 2
    var imgSpacing = 5

    for (var fotoIndex = 0; fotoIndex < fotos.length; fotoIndex++) {
      var foto = fotos[fotoIndex]
      var col = fotoIndex % imgsPerRow
      var xPos = margin + col * (imgWidth + imgSpacing)

      if (col === 0 && fotoIndex > 0) {
        y += imgHeight + 20
      }

      if (y + imgHeight + 25 > pageHeight - 25) {
        doc.addPage()
        y = 20
      }

      try {
        // Borda da imagem
        doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
        doc.setLineWidth(0.5)
        doc.roundedRect(xPos - 1, y - 1, imgWidth + 2, imgHeight + 2, 2, 2, "S")

        doc.addImage(foto.data, "JPEG", xPos, y, imgWidth, imgHeight)

        // Legenda
        doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
        doc.roundedRect(xPos, y + imgHeight + 2, imgWidth, 6, 1, 1, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        var legendaTexto = "Foto " + (fotoIndex + 1) + (foto.name ? ": " + foto.name.substring(0, 25) : "")
        doc.text(legendaTexto, xPos + imgWidth / 2, y + imgHeight + 6, { align: "center" })
      } catch (e) {
        doc.setDrawColor(200, 200, 200)
        doc.setFillColor(250, 250, 250)
        doc.roundedRect(xPos, y, imgWidth, imgHeight, 2, 2, "FD")
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(10)
        doc.text("Imagem " + (fotoIndex + 1), xPos + imgWidth / 2, y + imgHeight / 2, { align: "center" })
        doc.text("indisponível", xPos + imgWidth / 2, y + imgHeight / 2 + 5, { align: "center" })
      }
    }
  }

  // ==================== RODAPÉ EM TODAS AS PÁGINAS ====================
  var pageCount = doc.internal.getNumberOfPages()
  for (var pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    doc.setPage(pageIndex)

    // Linha decorativa do rodapé
    doc.setDrawColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
    doc.setLineWidth(1)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")
    doc.text("Defesa Civil - Prefeitura Municipal de Cidade Ocidental - GO", margin, pageHeight - 8)
    doc.text("Página " + pageIndex + " de " + pageCount, pageWidth - margin, pageHeight - 8, { align: "right" })
  }

  return doc
}

function generatePDF(dados, protocolo) {
  carregarLogos().then((logos) => {
    var doc = criarDocumentoPDF(dados, protocolo, logos)
    doc.output("dataurlnewwindow")
  })
}

function downloadPDF(dados, protocolo) {
  carregarLogos().then((logos) => {
    var doc = criarDocumentoPDF(dados, protocolo, logos)
    doc.save("relatorio_" + (protocolo || "vistoria") + ".pdf")
  })
}
