const SUPABASE_URL = "https://iehosofgjqxndcluvgym.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaG9zb2ZnanF4bmRjbHV2Z3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODc4NzcsImV4cCI6MjA4MTY2Mzg3N30.jt_n-IgGX6lNbI3AzxaIMw7zLXohpbm-4nDVigmPkpQ"


const AGENT_PASSWORD = "dc@pmco"


let supabase = null

function initSupabase() {
  if (!supabase && typeof window.supabase !== "") {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabase
}
