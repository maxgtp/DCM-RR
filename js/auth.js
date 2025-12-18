// Autenticação simples com localStorage

const AGENT_PASSWORD = "dc@pmco"

function isAuthenticated() {
  return localStorage.getItem("dc_agent_auth") === "true"
}

function login(password) {
  if (password === AGENT_PASSWORD) {
    localStorage.setItem("dc_agent_auth", "true")
    return true
  }
  return false
}

function logout() {
  localStorage.removeItem("dc_agent_auth")
  window.location.href = "index.html"
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "login.html"
    return false
  }
  return true
}
