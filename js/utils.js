// Utilitários gerais

// Formata CPF
function formatCPF(value) {
  const numbers = value.replace(/\D/g, "")
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

// Remove formatação do CPF
function cleanCPF(cpf) {
  return cpf.replace(/\D/g, "")
}

// Valida CPF
function validateCPF(cpf) {
  const cleaned = cleanCPF(cpf)
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== Number.parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== Number.parseInt(cleaned.charAt(10))) return false

  return true
}

// Formata telefone
function formatPhone(value) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2")
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1")
}

// Formata CEP
function formatCEP(value) {
  const numbers = value.replace(/\D/g, "")
  return numbers.replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{3})\d+?$/, "$1")
}

// Formata data para exibição
function formatDate(dateStr) {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR")
}

// Formata data e hora
function formatDateTime(dateStr) {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return (
    date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  )
}

// Exibe toast
function showToast(message, type = "info") {
  const toast = document.getElementById("toast")
  if (!toast) return

  toast.textContent = message
  toast.className = "toast " + type
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

// Gera protocolo único
function generateProtocol() {
  var date = new Date()
  var year = String(date.getFullYear()).slice(2) // Últimos 2 dígitos do ano
  var month = String(date.getMonth() + 1).padStart(2, "0")
  var day = String(date.getDate()).padStart(2, "0")
  var hour = String(date.getHours()).padStart(2, "0")
  var minute = String(date.getMinutes()).padStart(2, "0")
  return "DC" + year + month + day + hour + minute
}

// Converte imagem para base64
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Obtém classe CSS do status
function getStatusClass(status) {
  const statusMap = {
    Pendente: "pendente",
    "Em Análise": "em-analise",
    Concluído: "concluido",
  }
  return statusMap[status] || "pendente"
}
