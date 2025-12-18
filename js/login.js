// Script da página de login

// Senha de acesso do agente
const AGENT_PASSWORD = "dc@pmco"

// Verifica se está autenticado
function isAuthenticated() {
  return localStorage.getItem("dc_agent_auth") === "true"
}

// Realiza login
function login(password) {
  if (password === AGENT_PASSWORD) {
    localStorage.setItem("dc_agent_auth", "true")
    return true
  }
  return false
}

document.addEventListener("DOMContentLoaded", () => {
  // Se já autenticado, redireciona para o painel
  if (isAuthenticated()) {
    window.location.href = "painel.html"
    return
  }

  const form = document.getElementById("login-form")
  const passwordInput = document.getElementById("password")
  const togglePassword = document.getElementById("toggle-password")
  const errorDiv = document.getElementById("login-error")

  // Toggle mostrar/esconder senha
  togglePassword.addEventListener("click", function () {
    const type = passwordInput.type === "password" ? "text" : "password"
    passwordInput.type = type

    // Altera ícone
    const icon = this.querySelector("svg")
    if (type === "text") {
      icon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" x2="23" y1="1" y2="23"/>
            `
    } else {
      icon.innerHTML = `
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
            `
    }
  })

  // Submit do formulário
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    const password = passwordInput.value

    if (login(password)) {
      window.location.href = "painel.html"
    } else {
      errorDiv.textContent = "Senha incorreta. Tente novamente."
      errorDiv.style.display = "block"
      passwordInput.value = ""
      passwordInput.focus()
    }
  })
})
