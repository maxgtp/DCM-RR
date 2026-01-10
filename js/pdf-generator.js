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
async function criarDocumentoPDF(dados, protocolo, logos) {
  var jsPDF = window.jspdf.jsPDF
  var doc = new jsPDF("p", "mm", "a4")

  // -------------------------------
  // Layout base
  // -------------------------------
  var margin = 8
  var y = 34
  var rowH = 6
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
    return cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    )
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
    verificarQuebra(8)

    doc.setFillColor(...corSecundaria)
    doc.roundedRect(margin, y, contentWidth, 5, 1.5, 1.5, "F")

    doc.setFillColor(...corPrimaria)
    doc.roundedRect(margin, y, 10, 5, 1.5, 1.5, "F")

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255)

    doc.text(num, margin + 5, y + 3.5, { align: "center" })
    doc.text(titulo, margin + 13, y + 3.5)

    y += 6
    doc.setTextColor(0)
  }

  function campo(label, valor, x, largura) {
    doc.setFontSize(5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(80)
    doc.text(label + ":", x, y + 3.5)

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0)
    doc.text(
      String(valor || "-"),
      x + doc.getTextWidth(label + ": ") + 1,
      y + 3.5,
      { maxWidth: largura }
    )
  }

  // ===============================
  // CABEÇALHO
  // ===============================
  doc.setFillColor(...corPrimaria)
  doc.rect(0, 0, pageWidth, 24, "F")

  doc.setFillColor(...corSecundaria)
  doc.rect(0, 24, pageWidth, 2, "F")

  if (logos.logo1)
    doc.addImage(logos.logo1, "PNG", margin, 3, 18, 18)

  if (logos.logo2)
    doc.addImage(
      logos.logo2,
      "PNG",
      pageWidth - margin - 18,
      3,
      18,
      18
    )

  doc.setTextColor(255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(
    "DEFESA CIVIL – CIDADE OCIDENTAL-GO",
    pageWidth / 2,
    9,
    { align: "center" }
  )

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(
    "RELATÓRIO DE VISTORIA TÉCNICA",
    pageWidth / 2,
    14,
    { align: "center" }
  )

  doc.setFillColor(255)
  doc.roundedRect(pageWidth / 2 - 22, 17, 44, 5, 1.5, 1.5, "F")

  doc.setTextColor(...corPrimaria)
  doc.setFontSize(7)
  doc.text(
    "Protocolo: " + (protocolo || "N/A"),
    pageWidth / 2,
    20.5,
    { align: "center" }
  )

  doc.setTextColor(0)

  // ... (continua exatamente igual ao original)
}
