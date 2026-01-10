// Configuração do Supabase
const SUPABASE_URL = "https://iehosofgjqxndcluvgym.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaG9zb2ZnanF4bmRjbHV2Z3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODc4NzcsImV4cCI6MjA4MTY2Mzg3N30.jt_n-IgGX6lNbI3AzxaIMw7zLXohpbm-4nDVigmPkpQ"

// Bucket para armazenar imagens no Supabase (crie o bucket 'reports' no painel)
const SUPABASE_BUCKET = "reports"

// Usar Signed URLs (privado) em produção. Se true, URLs geradas expiram após SUPABASE_SIGNED_URL_EXPIRATION segundos.
const SUPABASE_USE_SIGNED_URLS = true
const SUPABASE_SIGNED_URL_EXPIRATION = 60 * 60 // 1 hora

// Senha de acesso do agente
const AGENT_PASSWORD = "dc@pmco"

// Recupera URL de arquivo do Storage: signed ou pública dependendo da configuração
async function getStorageFileUrl(path) {
  if (!path) return null
  var supabase = initSupabase()
  if (!supabase) return null

  if (SUPABASE_USE_SIGNED_URLS) {
    try {
      var res = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(path, SUPABASE_SIGNED_URL_EXPIRATION)
      // retorno pode variar de acordo com versão da SDK
      if (res && res.data) return res.data.signedUrl || res.data.signedURL || res.data.signedurl || null
      if (res && res.signedURL) return res.signedURL
      return null
    } catch (e) {
      console.error('Erro criando Signed URL:', e)
      return null
    }
  } else {
    try {
      var pub = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path)
      if (pub && pub.data) return pub.data.publicUrl || pub.data.publicURL || null
      if (pub && pub.publicURL) return pub.publicURL
      return null
    } catch (e) {
      console.error('Erro obtendo public URL:', e)
      return null
    }
  }
}

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
