// Gerador de PDF usando jsPDF

function criarDocumentoPDF(dados, protocolo) {
  var jsPDF = window.jspdf.jsPDF
  var doc = new jsPDF()

  var y = 20
  var margin = 20
  var pageWidth = doc.internal.pageSize.getWidth()
  var contentWidth = pageWidth - margin * 2

  // Função auxiliar para adicionar texto com quebra de linha
  function addText(text, x, yPos, options) {
    options = options || {}
    var fontSize = options.fontSize || 10
    var fontStyle = options.fontStyle || "normal"

    doc.setFontSize(fontSize)
    doc.setFont("helvetica", fontStyle)

    if (options.maxWidth) {
      var lines = doc.splitTextToSize(text, options.maxWidth)
      doc.text(lines, x, yPos)
      return lines.length * (fontSize * 0.4)
    } else {
      doc.text(text, x, yPos)
      return fontSize * 0.4
    }
  }

  // Função para verificar e adicionar nova página se necessário
  function checkPageBreak(neededSpace) {
    if (y + neededSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = 20
    }
  }

  // Função para formatar CPF
  function formatCPFLocal(cpf) {
    if (!cpf || cpf.length !== 11) return cpf || "-"
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  // Cabeçalho
  doc.setFillColor(30, 58, 95)
  doc.rect(0, 0, pageWidth, 40, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("DEFESA CIVIL", pageWidth / 2, 18, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("RELATÓRIO DE VISTORIA TÉCNICA", pageWidth / 2, 28, { align: "center" })

  doc.setFontSize(10)
  doc.text("Protocolo: " + (protocolo || "N/A"), pageWidth / 2, 36, { align: "center" })

  y = 50
  doc.setTextColor(0, 0, 0)

  // Seção 1: Identificação
  checkPageBreak(30)
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("1. IDENTIFICAÇÃO", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Data do Atendimento: " + (dados.data_atendimento || "-"), margin, y)
  doc.text("Hora: " + (dados.hora_atendimento || "-"), margin + 80, y)
  y += 8

  // Seção 2: Demanda
  checkPageBreak(50)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("2. DEMANDA", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  doc.text("Nome: " + (dados.nome_cidadao || "-"), margin, y)
  y += 6
  doc.text("CPF: " + formatCPFLocal(dados.cpf || ""), margin, y)
  doc.text("RG: " + (dados.rg || "-"), margin + 60, y)
  doc.text("Telefone: " + (dados.telefone || "-"), margin + 110, y)
  y += 6
  doc.text("Endereço: " + (dados.endereco || "-"), margin, y)
  y += 6
  doc.text("Bairro: " + (dados.bairro || "-"), margin, y)
  doc.text("Cidade: " + (dados.cidade || "-"), margin + 60, y)
  doc.text("CEP: " + (dados.cep || "-"), margin + 120, y)
  y += 8

  // Seção 3: Solicitação
  checkPageBreak(30)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("3. SOLICITAÇÃO", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var solicitacoes = dados.solicitacao || []
  doc.text("Tipo: " + (solicitacoes.length > 0 ? solicitacoes.join(", ") : "-"), margin, y)
  if (dados.solicitacao_outra) {
    y += 6
    doc.text("Outra: " + dados.solicitacao_outra, margin, y)
  }
  y += 8

  // Seção 4: Tipo de Ocorrência
  checkPageBreak(30)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("4. TIPO DE OCORRÊNCIA", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var ocorrencias = dados.ocorrencia || []
  var ocorrenciasText = ocorrencias.length > 0 ? ocorrencias.join(", ") : "-"
  var ocorrenciasLines = doc.splitTextToSize(ocorrenciasText, contentWidth)
  doc.text(ocorrenciasLines, margin, y)
  y += ocorrenciasLines.length * 5 + 3

  // Seção 5: Descrição da Edificação
  checkPageBreak(50)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("5. DESCRIÇÃO DA EDIFICAÇÃO", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  doc.text("Tipo: " + (dados.tipo_edificacao || "-"), margin, y)
  doc.text("Pavimentos: " + (dados.pavimentos || "-"), margin + 60, y)
  doc.text("Idade: " + (dados.idade_edificacao || "-") + " anos", margin + 110, y)
  y += 6
  doc.text("Área: " + (dados.area_construida || "-") + " m²", margin, y)
  doc.text("Estrutura: " + (dados.tipo_estrutura || "-"), margin + 60, y)
  y += 6
  doc.text("Cobertura: " + (dados.tipo_cobertura || "-"), margin, y)
  doc.text("Ocupação: " + (dados.ocupacao || "-"), margin + 60, y)
  doc.text("Moradores: " + (dados.moradores || "-"), margin + 120, y)
  y += 8

  // Seção 6: Manifestações Patológicas
  checkPageBreak(30)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("6. MANIFESTAÇÕES PATOLÓGICAS", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var patologias = dados.patologia || []
  var patologiasText = patologias.length > 0 ? patologias.join(", ") : "-"
  var patologiasLines = doc.splitTextToSize(patologiasText, contentWidth)
  doc.text(patologiasLines, margin, y)
  y += patologiasLines.length * 5 + 3

  // Seção 7: Localização da Anomalia
  checkPageBreak(30)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("7. LOCALIZAÇÃO DA ANOMALIA", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  var locais = dados.local_anomalia || []
  var locaisText = locais.length > 0 ? locais.join(", ") : "-"
  doc.text(locaisText, margin, y)
  y += 8

  // Seção 8: Relatório de Vistoria
  checkPageBreak(80)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("8. RELATÓRIO DE VISTORIA", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.text("Descrição da Situação:", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  var descricaoLines = doc.splitTextToSize(dados.descricao_situacao || "-", contentWidth)
  doc.text(descricaoLines, margin, y)
  y += descricaoLines.length * 5 + 5

  checkPageBreak(40)
  doc.setFont("helvetica", "bold")
  doc.text("Análise Técnica:", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  var analiseLines = doc.splitTextToSize(dados.analise_tecnica || "-", contentWidth)
  doc.text(analiseLines, margin, y)
  y += analiseLines.length * 5 + 5

  doc.setFont("helvetica", "bold")
  doc.text("Classificação de Risco: " + (dados.classificacao_risco || "-"), margin, y)
  y += 8

  checkPageBreak(40)
  doc.setFont("helvetica", "bold")
  doc.text("Recomendações:", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  var recomendacoesLines = doc.splitTextToSize(dados.recomendacoes || "-", contentWidth)
  doc.text(recomendacoesLines, margin, y)
  y += recomendacoesLines.length * 5 + 5

  checkPageBreak(40)
  doc.setFont("helvetica", "bold")
  doc.text("Parecer Final:", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  var parecerLines = doc.splitTextToSize(dados.parecer_final || "-", contentWidth)
  doc.text(parecerLines, margin, y)
  y += parecerLines.length * 5 + 8

  // Seção 9: Agente Responsável
  checkPageBreak(40)
  y += 5
  doc.setFillColor(234, 88, 12)
  doc.rect(margin, y, contentWidth, 8, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("9. AGENTE RESPONSÁVEL", margin + 3, y + 6)
  y += 12

  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  doc.text("Nome: " + (dados.nome_agente || "-"), margin, y)
  y += 6
  doc.text("Matrícula: " + (dados.matricula_agente || "-"), margin, y)
  doc.text("Cargo: " + (dados.cargo_agente || "-"), margin + 60, y)
  y += 20

  // Linha de assinatura
  checkPageBreak(30)
  doc.line(margin + 30, y, pageWidth - margin - 30, y)
  y += 5
  doc.setFontSize(9)
  doc.text("Assinatura do Agente", pageWidth / 2, y, { align: "center" })
  y += 15

  // Seção 10: Registro Fotográfico
  var fotos = dados.fotos || []
  if (fotos.length > 0) {
    checkPageBreak(50)
    y += 5
    doc.setFillColor(234, 88, 12)
    doc.rect(margin, y, contentWidth, 8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("10. REGISTRO FOTOGRÁFICO", margin + 3, y + 6)
    y += 15

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    var imgWidth = 80
    var imgHeight = 60
    var imgsPerRow = 2
    var imgSpacing = 10

    for (var fotoIndex = 0; fotoIndex < fotos.length; fotoIndex++) {
      var foto = fotos[fotoIndex]
      var col = fotoIndex % imgsPerRow
      var xPos = margin + col * (imgWidth + imgSpacing)

      // Nova linha de imagens
      if (col === 0 && fotoIndex > 0) {
        y += imgHeight + 15
      }

      // Verifica quebra de página
      checkPageBreak(imgHeight + 20)

      try {
        // Adiciona a imagem
        doc.addImage(foto.data, "JPEG", xPos, y, imgWidth, imgHeight)

        // Adiciona legenda da foto
        doc.setFontSize(8)
        doc.text(
          "Foto " + (fotoIndex + 1) + (foto.name ? ": " + foto.name.substring(0, 30) : ""),
          xPos,
          y + imgHeight + 5,
        )
      } catch (e) {
        // Se falhar ao adicionar imagem, mostra placeholder
        doc.setDrawColor(200, 200, 200)
        doc.rect(xPos, y, imgWidth, imgHeight)
        doc.setFontSize(8)
        doc.text("Imagem " + (fotoIndex + 1) + " indisponível", xPos + 10, y + imgHeight / 2)
      }
    }

    // Ajusta y após última linha de imagens
    y += imgHeight + 20
  }

  // Rodapé
  var pageCount = doc.internal.getNumberOfPages()
  for (var pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    doc.setPage(pageIndex)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      "Defesa Civil - Prefeitura Municipal | Página " + pageIndex + " de " + pageCount,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    )
  }

  return doc
}

function generatePDF(dados, protocolo) {
  var doc = criarDocumentoPDF(dados, protocolo)
  doc.output("dataurlnewwindow")
  return doc
}

function downloadPDF(dados, protocolo) {
  var doc = criarDocumentoPDF(dados, protocolo)
  doc.save("relatorio_" + (protocolo || "vistoria") + ".pdf")
}
