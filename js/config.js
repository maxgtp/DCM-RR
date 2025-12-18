// Configuração do Supabase
// IMPORTANTE: Substitua pelos seus valores reais antes de publicar no GitHub Pages
const SUPABASE_URL = "SUA_SUPABASE_URL_AQUI"
const SUPABASE_ANON_KEY = "SUA_SUPABASE_ANON_KEY_AQUI"

// Senha de acesso do agente
const AGENT_PASSWORD = "dc@pmco"

// Inicializa o cliente Supabase (será inicializado nos scripts que precisam)
let supabase = null

function initSupabase() {
  if (!supabase && typeof window.supabase !== "undefined") {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabase
}
