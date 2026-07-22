const { createClient } = require('@supabase/supabase-js')

const url = 'https://iocoxwtayipqqkesrvlp.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvY294d3RheWlwcXFrZXNydmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDYzMTcsImV4cCI6MjEwMDI4MjMxN30.VYySKG_YraIECUDzHT5vd0yQ4f_Z-Mjh3NhpHJlqCKk'

const supabase = createClient(url, key)

async function main() {
  console.log('Project ref from key:', JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString()).ref)
  for (const t of ['players', 'sessions', 'meta']) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (error) {
      console.log(`❌ ${t}:`, error.message)
    } else {
      console.log(`✅ ${t}: 表存在 (sample rows: ${data.length})`)
    }
  }
}
main().then(() => process.exit(0))
