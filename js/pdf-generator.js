// ===============================
// GERADOR DE PDF – DEFESA CIVIL
// ===============================

// URLs das logos
var LOGO1_URL = "https://maxgtp.github.io/DCM-RR/public/images/logo1.png"
var LOGO2_URL = "https://maxgtp.github.io/DCM-RR/public/images/logo2.png"

// Cache das logos
var logosCarregadas = {
  logo1: null,
  logo2: null,
  carregado: false,
}

// -------------------------------
// Carregar imagem base64
// -------------------------------
function carregarImagemBase64(url) {
  return new Promise((resolve) => {
    var img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      var canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext("2d").drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// -------------------------------
// Carregar logos
// -------------------------------
function carregarLogos() {
  if (logosCarregadas.carregado) return Promise.resolve(logosCarregadas)

  return Promise.all([
    carregarImagemBase64(LOGO1_URL),
    carregarImagemBase64(LOGO2_URL),
  ]).then((res) => {
    logosCarregadas.logo1 = res[0]
    logosCarregadas.logo2 = res[1]
    logosCarregadas.carregado = true
    return logosCarregadas
  })
}

// ===============================
// CRIAÇÃO DO PDF
// ===============================
function criarDocumentoPDF(dados, protocolo, logos) {
  var jsPDF = window.jspdf.jsPDF
  var doc = new jsPDF("p", "mm", "a4")

  // -------------------------------
  // Layout base
  // -------------------------------
  var margin = 8
  var y = 34
  var rowH = 7

  var pageWidth = doc.internal.pageSize.getWidth()
  var pageHeight = doc.internal.pageSize.getHeight()
  var contentWidth = pageWidth - margin * 2

  // Cores
  var corPrimaria = [30, 58, 95]
  var corSecundaria = [234, 88, 12]
  var corFundo = [245, 245, 245]

  // -------------------------------
  // Utilitários
  // -------------------------------
  function formatCPF(cpf) {
    if (!cpf || cpf.length !== 11) return cpf || "-"
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  function verificarQuebra(altura) {
    if (y + altura > pageHeight - 18) {
      doc.addPage()
      y = 20
    }
  }

  function blocoFundo(altura) {
    verificarQuebra(altura)
    doc.setFillColor(...corFundo)
    doc.roundedRect(margin, y, contentWidth, altura, 1.5, 1.5, "F")
  }

  function tituloSecao(num, titulo) {
    verificarQuebra(10)
    doc.setFillColor(...corSecundaria)
    doc.roundedRect(margin, y, contentWidth, 6, 1.5, 1.5, "F")

    doc.setFillColor(...corPrimaria)
    doc.roundedRect(margin, y, 12, 6, 1.5, 1.5, "F")

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255)
    doc.text(num, margin + 6, y + 4.2, { align: "center" })
    doc.text(titulo, margin + 16, y + 4.2)

    y += 8
    doc.setTextColor(0)
  }

  function campo(label, valor, x, largura) {
    doc.setFontSize(6)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(80)
    doc.text(label + ":", x, y + 4)

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0)
    doc.text(String(valor || "-"), x + doc.getTextWidth(label + ": ") + 1, y + 4, {
      maxWidth: largura,
    })
  }

  // ===============================
  // CABEÇALHO
  // ===============================
  doc.setFillColor(...corPrimaria)
  doc.rect(0, 0, pageWidth, 28, "F")

  doc.setFillColor(...corSecundaria)
  doc.rect(0, 28, pageWidth, 2, "F")

  if (logos.logo1) doc.addImage(logos.logo1, "PNG", margin, 3, 22, 22)
  if (logos.logo2) doc.addImage(logos.logo2, "PNG", pageWidth - margin - 22, 3, 22, 22)

  doc.setTextColor(255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("DEFESA CIVIL – CIDADE OCIDENTAL/GO", pageWidth / 2, 11, { align: "center" })

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("RELATÓRIO DE VISTORIA TÉCNICA", pageWidth / 2, 17, { align: "center" })

  doc.setFillColor(255)
  doc.roundedRect(pageWidth / 2 - 25, 20, 50, 6, 1.5, 1.5, "F")
  doc.setTextColor(...corPrimaria)
  doc.setFontSize(7)
  doc.text("Protocolo: " + (protocolo || "N/A"), pageWidth / 2, 24, { align: "center" })

  doc.setTextColor(0)

  // ===============================
  // SEÇÕES (ORDEM ORIGINAL)
  // ===============================
  tituloSecao("1", "IDENTIFICAÇÃO")
  blocoFundo(rowH)
  campo("Data", dados.data_atendimento, margin + 2, 30)
  campo("Hora", dados.hora_atendimento, margin + 40, 20)
  campo("Protocolo", protocolo, margin + 70, 40)
  y += rowH + 3

  tituloSecao("2", "DEMANDA")
  blocoFundo(rowH)
  campo("Nome", dados.nome_cidadao, margin + 2, contentWidth)
  y += rowH + 2

  blocoFundo(rowH)
  campo("CPF", formatCPF(dados.cpf), margin + 2, 35)
  campo("RG", dados.rg, margin + 45, 25)
  campo("Telefone", dados.telefone, margin + 75, 40)
  y += rowH + 2

  blocoFundo(rowH)
  campo(
    "Endereço",
    `${dados.endereco || ""} - ${dados.bairro || ""} - ${dados.cidade || ""} CEP ${dados.cep || ""}`,
    margin + 2,
    contentWidth
  )
  y += rowH + 4

  tituloSecao("3", "SOLICITAÇÃO")
  var solicitacao = (dados.solicitacao || []).join(", ")
  if (dados.solicitacao_outra) solicitacao += " | " + dados.solicitacao_outra
  blocoFundo(rowH)
  doc.setFontSize(7)
  doc.text(solicitacao || "-", margin + 2, y + 4)
  y += rowH + 4

  tituloSecao("4", "TIPO DE OCORRÊNCIA")
  var ocorr = (dados.ocorrencia || []).join(", ")
  var ocorrLines = doc.splitTextToSize(ocorr || "-", contentWidth - 4)
  var ocorrAlt = ocorrLines.length * 4 + 4
  blocoFundo(ocorrAlt)
  doc.text(ocorrLines, margin + 2, y + 4)
  y += ocorrAlt + 4

  tituloSecao("5", "DESCRIÇÃO DA EDIFICAÇÃO")
  blocoFundo(rowH * 2)
  campo("Tipo", dados.tipo_edificacao, margin + 2, 30)
  campo("Pav.", dados.pavimentos, margin + 38, 10)
  campo("Idade", dados.idade_edificacao, margin + 52, 10)
  campo("Área m²", dados.area_construida, margin + 66, 20)
  campo("Moradores", dados.moradores, margin + 90, 20)
  y += rowH
  campo("Estrutura", dados.tipo_estrutura, margin + 2, 40)
  campo("Cobertura", dados.tipo_cobertura, margin + 50, 40)
  campo("Ocupação", dados.ocupacao, margin + 100, 40)
  y += rowH + 4

  tituloSecao("6", "MANIFESTAÇÕES PATOLÓGICAS")
  var pat = (dados.patologia || []).join(", ")
  var patLines = doc.splitTextToSize(pat || "-", contentWidth - 4)
  var patAlt = patLines.length * 4 + 4
  blocoFundo(patAlt)
  doc.text(patLines, margin + 2, y + 4)
  y += patAlt + 4

  tituloSecao("7", "LOCALIZAÇÃO DA ANOMALIA")
  blocoFundo(rowH)
  doc.text((dados.local_anomalia || []).join(", ") || "-", margin + 2, y + 4)
  y += rowH + 4

tituloSecao("8", "RELATÓRIO DE VISTORIA")

function blocoTextoRotulado(rotulo, conteudo) {
  verificarQuebra(12)
  y += 3
  // Rótulo
  doc.setFontSize(6)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(corSecundaria[0], corSecundaria[1], corSecundaria[2])
  doc.text(rotulo, margin, y)

  // Conteúdo
  var linhas = doc.splitTextToSize(conteudo || "-", contentWidth - 4)
  var altura = linhas.length * 3 + 3

  blocoFundo(altura)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0)
  doc.text(linhas, margin + 2, y + 4)

  y += altura + 3
}

blocoTextoRotulado("DESCRIÇÃO DA SITUAÇÃO", dados.descricao_situacao)
blocoTextoRotulado("ANÁLISE TÉCNICA", dados.analise_tecnica)
blocoTextoRotulado("RECOMENDAÇÕES", dados.recomendacoes)
blocoTextoRotulado("PARECER FINAL", dados.parecer_final)


  tituloSecao("9", "AGENTE RESPONSÁVEL")
  blocoFundo(rowH)
  campo("Nome", dados.nome_agente, margin + 2, 60)
  campo("Matrícula", dados.matricula_agente, margin + 70, 30)
  campo("Cargo", dados.cargo_agente, margin + 105, 40)
  y += rowH + 10

  doc.line(pageWidth / 2 - 45, y, pageWidth / 2 + 45, y)
  doc.setFontSize(6)
  doc.text("Assinatura do Agente Responsável", pageWidth / 2, y + 4, { align: "center" })

  // ===============================
  // REGISTRO FOTOGRÁFICO (INALTERADO)
  // ===============================
  if ((dados.fotos || []).length > 0) {
    doc.addPage()
    y = 12

    tituloSecao("10", "REGISTRO FOTOGRÁFICO")
    
    var imgW = 88
    var imgH = 66
    var gap = 4

    dados.fotos.forEach((foto, i) => {
      var col = i % 2
      var x = margin + col * (imgW + gap)

      if (col === 0 && i > 0) y += imgH + 14
      if (y + imgH > pageHeight - 20) {
        doc.addPage()
        y = 10
      }

      doc.roundedRect(x - 1, y - 1, imgW + 2, imgH + 2, 2, 2)
      doc.addImage(foto.data, "JPEG", x, y, imgW, imgH)
    })
  }

  // ===============================
  // RODAPÉ
  // ===============================
  var total = doc.internal.getNumberOfPages()
  for (var p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)
    doc.setFontSize(6)
    doc.text("Defesa Civil – Prefeitura Municipal de Cidade Ocidental – GO", margin, pageHeight - 6)
    doc.text(`Página ${p} de ${total}`, pageWidth - margin, pageHeight - 6, { align: "right" })
  }

  return doc
}

// ===============================
// EXPORTAÇÃO
// ===============================
function generatePDF(dados, protocolo) {
  carregarLogos().then((logos) => criarDocumentoPDF(dados, protocolo, logos).output("dataurlnewwindow"))
}

function downloadPDF(dados, protocolo) {
  carregarLogos().then((logos) =>
    criarDocumentoPDF(dados, protocolo, logos).save(`relatorio_${protocolo || "vistoria"}.pdf`)
  )
}
