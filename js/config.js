// Configuração do Supabase
const SUPABASE_URL = "https://iehosofgjqxndcluvgym.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaG9zb2ZnanF4bmRjbHV2Z3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODc4NzcsImV4cCI6MjA4MTY2Mzg3N30.jt_n-IgGX6lNbI3AzxaIMw7zLXohpbm-4nDVigmPkpQ"

// Senha de acesso do agente
const AGENT_PASSWORD = "dc@pmco"

// Cliente Supabase (será inicializado quando necessário)
let supabaseClient = null

function initSupabase() {
  if (!supabaseClient && typeof window !== "undefined" && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabaseClient
}

// Funções de autenticação
function isAuthenticated() {
  return localStorage.getItem("dc_agent_auth") === "true"
}

function doLogin(password) {
  if (password === AGENT_PASSWORD) {
    localStorage.setItem("dc_agent_auth", "true")
    return true
  }
  return false
}

function doLogout() {
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
