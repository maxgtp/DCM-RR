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

  var y = 10
  var margin = 10
  var pageWidth = doc.internal.pageSize.getWidth()
  var pageHeight = doc.internal.pageSize.getHeight()
  var contentWidth = pageWidth - margin * 2

  // Cores do tema
  var corPrimaria = [30, 58, 95] // Azul escuro
  var corSecundaria = [234, 88, 12] // Laranja
  var corFundo = [248, 248, 248] // Cinza claro

  // Função para formatar CPF
  function formatCPFLocal(cpf) {
    if (!cpf || cpf.length !== 11) return cpf || "-"
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Fundo do cabeçalho
  doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.rect(0, 0, pageWidth, 28, "F")

  // Faixa laranja decorativa
  doc.setFillColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.rect(0, 28, pageWidth, 2, "F")

  // Logo 1 (esquerda)
  if (logos && logos.logo1) {
    try {
      doc.addImage(logos.logo1, "PNG", margin, 3, 22, 22)
    } catch (e) {}
  }

  // Logo 2 (direita)
  if (logos && logos.logo2) {
    try {
      doc.addImage(logos.logo2, "PNG", pageWidth - margin - 22, 3, 22, 22)
    } catch (e) {}
  }

  // Texto central do cabeçalho
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("DEFESA CIVIL - CIDADE OCIDENTAL/GO", pageWidth / 2, 10, { align: "center" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("RELATÓRIO DE VISTORIA TÉCNICA", pageWidth / 2, 16, { align: "center" })

  // Protocolo no cabeçalho
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(pageWidth / 2 - 25, 19, 50, 6, 1, 1, "F")
  doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text("Protocolo: " + (protocolo || "N/A"), pageWidth / 2, 23, { align: "center" })

  y = 33
  doc.setTextColor(0, 0, 0)

  function tituloSecao(numero, titulo) {
    doc.setFillColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F")

    doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
    doc.roundedRect(margin, y, 12, 6, 1, 0, "F")
    doc.rect(margin + 8, y, 4, 6, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text(numero, margin + 6, y + 4.2, { align: "center" })
    doc.text(titulo, margin + 16, y + 4.2)
    y += 8
    doc.setTextColor(0, 0, 0)
  }

  function campoInline(label, valor, x, w) {
    doc.setFontSize(6)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(80, 80, 80)
    doc.text(label + ":", x, y)

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)
    var texto = String(valor || "-").substring(0, Math.floor(w / 2))
    doc.text(texto, x + doc.getTextWidth(label + ": "), y)
  }

  tituloSecao("1", "IDENTIFICAÇÃO")
  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F")
  y += 5
  campoInline("Data", dados.data_atendimento, margin + 2, 35)
  campoInline("Hora", dados.hora_atendimento, margin + 45, 25)
  campoInline("Protocolo", protocolo, margin + 80, 50)
  y += 5

  tituloSecao("2", "DEMANDA")
  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 16, 1, 1, "F")
  y += 5
  campoInline("Nome", dados.nome_cidadao, margin + 2, 120)
  y += 5
  campoInline("CPF", formatCPFLocal(dados.cpf), margin + 2, 35)
  campoInline("RG", dados.rg, margin + 45, 30)
  campoInline("Tel", dados.telefone, margin + 85, 40)
  y += 5
  var enderecoCompleto =
    (dados.endereco || "") +
    " - " +
    (dados.bairro || "") +
    " - " +
    (dados.cidade || "") +
    " - CEP: " +
    (dados.cep || "")
  campoInline("Endereço", enderecoCompleto.substring(0, 100), margin + 2, 180)
  y += 5

  tituloSecao("3", "SOLICITAÇÃO")
  var solicitacoes = dados.solicitacao || []
  var solicitacaoTexto = solicitacoes.length > 0 ? solicitacoes.join(", ") : "-"
  if (dados.solicitacao_outra) solicitacaoTexto += " | " + dados.solicitacao_outra

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F")
  y += 5
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text(solicitacaoTexto.substring(0, 120), margin + 2, y)
  y += 5

  tituloSecao("4", "TIPO DE OCORRÊNCIA")
  var ocorrencias = dados.ocorrencia || []
  var ocorrenciasTexto = ocorrencias.length > 0 ? ocorrencias.join(", ") : "-"
  var ocorrenciasLines = doc.splitTextToSize(ocorrenciasTexto, contentWidth - 4)
  var alturaOcor = Math.max(7, ocorrenciasLines.length * 3.5 + 3)

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, alturaOcor, 1, 1, "F")
  doc.setFontSize(7)
  doc.text(ocorrenciasLines, margin + 2, y + 4)
  y += alturaOcor + 2

  tituloSecao("5", "DESCRIÇÃO DA EDIFICAÇÃO")
  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 16, 1, 1, "F")
  y += 5
  campoInline("Tipo", dados.tipo_edificacao, margin + 2, 35)
  campoInline("Pav.", dados.pavimentos, margin + 50, 15)
  campoInline("Idade", dados.idade_edificacao, margin + 75, 15)
  campoInline("Área m²", dados.area_construida, margin + 105, 25)
  campoInline("Moradores", dados.moradores, margin + 145, 25)
  y += 5
  campoInline("Estrutura", dados.tipo_estrutura, margin + 2, 45)
  campoInline("Cobertura", dados.tipo_cobertura, margin + 60, 45)
  campoInline("Ocupação", dados.ocupacao, margin + 120, 45)
  y += 8

  tituloSecao("6", "MANIFESTAÇÕES PATOLÓGICAS")
  var patologias = dados.patologia || []
  var patologiasTexto = patologias.length > 0 ? patologias.join(", ") : "-"
  var patologiasLines = doc.splitTextToSize(patologiasTexto, contentWidth - 4)
  var alturaPat = Math.max(7, patologiasLines.length * 3.5 + 3)

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, alturaPat, 1, 1, "F")
  doc.setFontSize(7)
  doc.text(patologiasLines, margin + 2, y + 4)
  y += alturaPat + 2

  tituloSecao("7", "LOCALIZAÇÃO DA ANOMALIA")
  var locais = dados.local_anomalia || []
  var locaisTexto = locais.length > 0 ? locais.join(", ") : "-"

  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F")
  doc.setFontSize(7)
  doc.text(locaisTexto.substring(0, 120), margin + 2, y + 4.5)
  y += 9

  tituloSecao("8", "RELATÓRIO DE VISTORIA")

  // Descrição da Situação
  doc.setFontSize(6)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text("Descrição:", margin, y)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var descLines = doc.splitTextToSize(dados.descricao_situacao || "-", contentWidth - 2)
  doc.text(descLines.slice(0, 3), margin + 18, y)
  y += Math.min(descLines.length, 3) * 3 + 3

  // Análise Técnica
  doc.setFont("helvetica", "bold")
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text("Análise:", margin, y)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var analiseLines = doc.splitTextToSize(dados.analise_tecnica || "-", contentWidth - 2)
  doc.text(analiseLines.slice(0, 3), margin + 14, y)
  y += Math.min(analiseLines.length, 3) * 3 + 3

  // Classificação de Risco
  doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.text("CLASSIFICAÇÃO DE RISCO: " + (dados.classificacao_risco || "-").toUpperCase(), pageWidth / 2, y + 4, {
    align: "center",
  })
  y += 9

  // Recomendações
  doc.setFontSize(6)
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text("Recomendações:", margin, y)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var recomLines = doc.splitTextToSize(dados.recomendacoes || "-", contentWidth - 2)
  doc.text(recomLines.slice(0, 3), margin + 26, y)
  y += Math.min(recomLines.length, 3) * 3 + 3

  // Parecer Final
  doc.setFont("helvetica", "bold")
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text("Parecer Final:", margin, y)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var parecerLines = doc.splitTextToSize(dados.parecer_final || "-", contentWidth - 2)
  doc.text(parecerLines.slice(0, 3), margin + 22, y)
  y += Math.min(parecerLines.length, 3) * 3 + 5

  tituloSecao("9", "AGENTE RESPONSÁVEL")
  doc.setFillColor(corFundo[0], corFundo[1], corFundo[2])
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, "F")
  y += 5
  campoInline("Nome", dados.nome_agente, margin + 2, 70)
  campoInline("Matrícula", dados.matricula_agente, margin + 80, 30)
  campoInline("Cargo", dados.cargo_agente, margin + 125, 50)
  y += 8

  // Área de assinatura
  doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
  doc.setLineWidth(0.3)
  doc.line(pageWidth / 2 - 40, y + 8, pageWidth / 2 + 40, y + 8)
  doc.setFontSize(6)
  doc.setTextColor(100, 100, 100)
  doc.text("Assinatura do Agente Responsável", pageWidth / 2, y + 12, { align: "center" })

  var fotos = dados.fotos || []
  if (fotos.length > 0) {
    doc.addPage()
    y = 15

    tituloSecao("10", "REGISTRO FOTOGRÁFICO")
    y += 3

    var imgWidth = 88
    var imgHeight = 66
    var imgsPerRow = 2
    var imgSpacing = 4

    for (var fotoIndex = 0; fotoIndex < fotos.length; fotoIndex++) {
      var foto = fotos[fotoIndex]
      var col = fotoIndex % imgsPerRow
      var xPos = margin + col * (imgWidth + imgSpacing)

      if (col === 0 && fotoIndex > 0) {
        y += imgHeight + 15
      }

      if (y + imgHeight + 20 > pageHeight - 20) {
        doc.addPage()
        y = 15
      }

      try {
        doc.setDrawColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
        doc.setLineWidth(0.5)
        doc.roundedRect(xPos - 1, y - 1, imgWidth + 2, imgHeight + 2, 2, 2, "S")
        doc.addImage(foto.data, "JPEG", xPos, y, imgWidth, imgHeight)

        doc.setFillColor(corPrimaria[0], corPrimaria[1], corPrimaria[2])
        doc.roundedRect(xPos, y + imgHeight + 2, imgWidth, 5, 1, 1, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        var legendaTexto = "Foto " + (fotoIndex + 1) + (foto.name ? ": " + foto.name.substring(0, 20) : "")
        doc.text(legendaTexto, xPos + imgWidth / 2, y + imgHeight + 5.5, { align: "center" })
      } catch (e) {
        doc.setDrawColor(200, 200, 200)
        doc.setFillColor(250, 250, 250)
        doc.roundedRect(xPos, y, imgWidth, imgHeight, 2, 2, "FD")
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.text("Imagem indisponível", xPos + imgWidth / 2, y + imgHeight / 2, { align: "center" })
      }
    }
  }

  var pageCount = doc.internal.getNumberOfPages()
  for (var pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    doc.setPage(pageIndex)

    doc.setDrawColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")
    doc.text("Defesa Civil - Prefeitura Municipal de Cidade Ocidental - GO", margin, pageHeight - 6)
    doc.text("Página " + pageIndex + " de " + pageCount, pageWidth - margin, pageHeight - 6, { align: "right" })
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
