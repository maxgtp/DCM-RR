// Script da página de login - usa funções de config.js
// NÃO declara nenhuma função que já existe nesse arquivo

// Importando as funções necessárias do config.js
var isAuthenticated = window.isAuthenticated
var doLogin = window.doLogin

document.addEventListener("DOMContentLoaded", () => {
  // Verifica se já está autenticado usando função do config.js
  if (isAuthenticated()) {
    window.location.href = "painel.html"
    return
  }

  var form = document.getElementById("login-form")
  var passwordInput = document.getElementById("password")
  var togglePassword = document.getElementById("toggle-password")
  var errorDiv = document.getElementById("login-error")

  // Toggle mostrar/esconder senha
  togglePassword.addEventListener("click", function () {
    var type = passwordInput.type === "password" ? "text" : "password"
    passwordInput.type = type

    // Altera ícone
    var icon = this.querySelector("svg")
    if (type === "text") {
      icon.innerHTML =
        '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/>'
    } else {
      icon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
    }
  })

  // Submit do formulário
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    var password = passwordInput.value

    // Usa doLogin do config.js (já carregado globalmente)
    if (doLogin(password)) {
      window.location.href = "painel.html"
    } else {
      errorDiv.textContent = "Senha incorreta. Tente novamente."
      errorDiv.style.display = "block"
      passwordInput.value = ""
      passwordInput.focus()
    }
  })
})
