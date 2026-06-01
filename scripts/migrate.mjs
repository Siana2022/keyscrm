/**
 * Script de migración: WordPress (database.sql) → Supabase
 * Ejecutar: node scripts/migrate.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SQL_PATH = '/Users/cavesson/KEYS/wpress_extracted/database.sql'
console.log('Leyendo database.sql...')
const sql = readFileSync(SQL_PATH, 'utf8')
const lines = sql.split('\n')

// ─── Parsers ────────────────────────────────────────────────────────────────

function parseInserts(lines, tableSuffix) {
  const table = `SERVMASK_PREFIX_${tableSuffix}`
  const rows = []
  for (const line of lines) {
    if (!line.startsWith(`INSERT INTO \`${table}\``)) continue
    const match = line.match(/VALUES\s*(.+);?\s*$/)
    if (!match) continue
    const parsed = parseValues(match[1])
    rows.push(...parsed)
  }
  return rows
}

function parseValues(str) {
  const rows = []
  let i = 0
  while (i < str.length) {
    if (str[i] === '(') {
      const [row, end] = parseRow(str, i + 1)
      rows.push(row)
      i = end + 1
    } else {
      i++
    }
  }
  return rows
}

function parseRow(str, start) {
  const fields = []
  let i = start
  let current = ''
  let inStr = false

  while (i < str.length) {
    const ch = str[i]

    if (!inStr && ch === ')') {
      fields.push(parseField(current.trim()))
      return [fields, i]
    }

    if (!inStr && ch === ',') {
      fields.push(parseField(current.trim()))
      current = ''
      i++
      continue
    }

    if (ch === "'" && !inStr) {
      inStr = true
      i++
      continue
    }

    if (inStr) {
      if (ch === '\\' && i + 1 < str.length) {
        const next = str[i + 1]
        if (next === "'") { current += "'"; i += 2; continue }
        if (next === '\\') { current += '\\'; i += 2; continue }
        if (next === 'n') { current += '\n'; i += 2; continue }
        if (next === 'r') { current += '\r'; i += 2; continue }
        if (next === 't') { current += '\t'; i += 2; continue }
        current += ch; i++; continue
      }
      if (ch === "'") {
        if (str[i + 1] === "'") { current += "'"; i += 2; continue }
        inStr = false; i++; continue
      }
      current += ch; i++; continue
    }

    current += ch
    i++
  }

  fields.push(parseField(current.trim()))
  return [fields, i]
}

function parseField(val) {
  if (val === 'NULL') return null
  if (val === "''" || val === '') return ''
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val)
  return val
}

// ─── Extraer datos ───────────────────────────────────────────────────────────

console.log('Extrayendo posts...')
const allPosts = parseInserts(lines, 'posts')
// posts columns: ID, post_author, post_date, post_date_gmt, post_content, post_title,
//                post_excerpt, post_status, comment_status, ping_status, post_password,
//                post_name, to_ping, pinged, post_modified, post_modified_gmt,
//                post_content_filtered, post_parent, guid, menu_order, post_type,
//                post_mime_type, comment_count

const POST_ID = 0, POST_TITLE = 5, POST_STATUS = 7, POST_NAME = 11, POST_TYPE = 20

const empresaPosts = allPosts.filter(r => r[POST_TYPE] === 'empresas' && r[POST_STATUS] === 'publish')
const empleadoPosts = allPosts.filter(r => r[POST_TYPE] === 'empleado' && r[POST_STATUS] === 'publish')
const encargadoPosts = allPosts.filter(r => r[POST_TYPE] === 'encargados_tratamien' && r[POST_STATUS] === 'publish')
const dpoPosts = allPosts.filter(r => r[POST_TYPE] === 'dpo' && r[POST_STATUS] === 'publish')

console.log(`Posts encontrados: ${empresaPosts.length} empresas, ${empleadoPosts.length} empleados, ${encargadoPosts.length} encargados, ${dpoPosts.length} DPOs`)

console.log('Extrayendo postmeta...')
const allMeta = parseInserts(lines, 'postmeta')
// postmeta columns: meta_id, post_id, meta_key, meta_value
const META_POST_ID = 1, META_KEY = 2, META_VALUE = 3

// Índice: postId → { metaKey → metaValue }
const metaByPost = {}
for (const row of allMeta) {
  const pid = String(row[META_POST_ID])
  const key = row[META_KEY]
  const val = row[META_VALUE]
  if (!metaByPost[pid]) metaByPost[pid] = {}
  // Guardar solo la primera ocurrencia (ACF guarda duplicados con _field_key)
  if (!(key in metaByPost[pid])) {
    metaByPost[pid][key] = val
  }
}

function meta(postId, key) {
  return metaByPost[String(postId)]?.[key] ?? null
}

function metaStr(postId, key) {
  const v = meta(postId, key)
  return v ? String(v).trim() || null : null
}

// ─── Usuarios WP ─────────────────────────────────────────────────────────────

console.log('Extrayendo usuarios WP...')
const allUsers = parseInserts(lines, 'users')
// users: ID, user_login, user_pass, user_nicename, user_email, user_url,
//        user_registered, user_activation_key, user_status, display_name
const USER_ID = 0, USER_EMAIL = 4

const allUsermeta = parseInserts(lines, 'usermeta')
// usermeta: umeta_id, user_id, meta_key, meta_value
const UM_USER_ID = 1, UM_KEY = 2, UM_VALUE = 3

const usermetaByUser = {}
for (const row of allUsermeta) {
  const uid = String(row[UM_USER_ID])
  if (!usermetaByUser[uid]) usermetaByUser[uid] = {}
  usermetaByUser[uid][row[UM_KEY]] = row[UM_VALUE]
}

// Empresas asignadas a cada usuario WP
const wpUserEmpresaMap = {}
for (const user of allUsers) {
  const uid = String(user[USER_ID])
  const meta = usermetaByUser[uid] || {}
  // empresas_asignadas puede ser serializado PHP: a:1:{i:0;s:3:"257";}
  const raw = meta['empresas_asignadas'] || meta['empresa_post_id']
  if (!raw) continue
  const ids = extractPhpArrayValues(String(raw))
  if (ids.length) wpUserEmpresaMap[user[USER_EMAIL]] = ids
}

function extractPhpArrayValues(phpSerialized) {
  const ids = []
  const re = /s:\d+:"(\d+)"/g
  let m
  while ((m = re.exec(phpSerialized)) !== null) ids.push(m[1])
  // También puede ser un número directo
  if (!ids.length && /^\d+$/.test(phpSerialized.trim())) ids.push(phpSerialized.trim())
  return ids
}

// ─── Migración ───────────────────────────────────────────────────────────────

// Mapa: wp_post_id (string) → supabase UUID
const empresaIdMap = {}
const encargadoIdMap = {}
const dpoIdMap = {}

async function insertBatch(table, rows, batchSize = 50) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from(table).insert(batch)
    if (error) {
      console.error(`Error insertando en ${table}:`, error.message)
      console.error('Primer registro del batch:', JSON.stringify(batch[0]))
    } else {
      inserted += batch.length
    }
  }
  return inserted
}

// ── 1. DPOs ──────────────────────────────────────────────────────────────────

console.log('\n── Migrando DPOs...')
for (const post of dpoPosts) {
  const wpId = String(post[POST_ID])
  const row = {
    nombre: metaStr(wpId, 'nombre_del_delegado') || String(post[POST_TITLE]) || 'DPO',
    dni: metaStr(wpId, 'dpodni'),
    telefono: metaStr(wpId, 'telefono_de_contacto'),
    email: metaStr(wpId, 'email_de_contacto'),
  }
  const { data, error } = await supabase.from('dpos').insert(row).select('id').single()
  if (error) { console.error('Error DPO:', error.message); continue }
  dpoIdMap[wpId] = data.id
  console.log(`  DPO: ${row.nombre}`)
}

// ── 2. Empresas ───────────────────────────────────────────────────────────────

console.log('\n── Migrando empresas...')
const empresaRows = []
for (const post of empresaPosts) {
  const wpId = String(post[POST_ID])
  const dpoWpId = metaStr(wpId, 'dpo')
  empresaRows.push({
    _wp_id: wpId,
    razon_social: String(post[POST_TITLE]) || 'Sin nombre',
    nombre_comercial: metaStr(wpId, 'nombre_comercial'),
    cifdni: metaStr(wpId, 'cifdni'),
    direccion_fiscal: metaStr(wpId, 'direccion_fiscal'),
    codigo_postal: metaStr(wpId, 'codigo_postal'),
    localidad: metaStr(wpId, 'localidad'),
    provincia: metaStr(wpId, 'provincia'),
    telefono: metaStr(wpId, 'telefono'),
    email_principal: metaStr(wpId, 'email_principal'),
    email_data_manager: metaStr(wpId, 'email_data_manager'),
    nombre_pila_data_manager: metaStr(wpId, 'nombre_de_pila_data_manager'),
    pagina_web: metaStr(wpId, 'pagina_web'),
    lssi_datos_registrales: metaStr(wpId, 'lssi_datos_registrales'),
    grupo_de_empresas: metaStr(wpId, 'grupo_de_empresas'),
    dpo_id: dpoWpId ? dpoIdMap[dpoWpId] || null : null,
  })
}

// Insertar en batches y guardar el mapa wp_id → supabase uuid
for (let i = 0; i < empresaRows.length; i += 50) {
  const batch = empresaRows.slice(i, i + 50)
  const batchForInsert = batch.map(({ _wp_id, ...rest }) => rest)
  const { data, error } = await supabase.from('empresas').insert(batchForInsert).select('id, razon_social')
  if (error) { console.error('Error empresas:', error.message); continue }
  // Emparejar por posición (misma ordenación)
  for (let j = 0; j < batch.length; j++) {
    empresaIdMap[batch[j]._wp_id] = data[j].id
  }
  console.log(`  Empresas insertadas: ${i + batch.length}/${empresaRows.length}`)
}

// ── 3. Empleados ──────────────────────────────────────────────────────────────

console.log('\n── Migrando empleados...')
const empleadoRows = []
for (const post of empleadoPosts) {
  const wpId = String(post[POST_ID])
  const empresaWpId = metaStr(wpId, 'empresa_asignada')
  const empresaSupaId = empresaWpId ? empresaIdMap[empresaWpId] : null
  if (!empresaSupaId) continue // huérfano

  const estadoRaw = metaStr(wpId, 'estado') || 'active'
  const estado = ['active', 'pending', 'baja'].includes(estadoRaw) ? estadoRaw : 'active'

  empleadoRows.push({
    empresa_id: empresaSupaId,
    nombre_completo: String(post[POST_TITLE]) || 'Sin nombre',
    dni: metaStr(wpId, 'dni'),
    cargo: metaStr(wpId, 'cargo_del_usuario'),
    teletrabajo: metaStr(wpId, 'teletrabajo') === '1',
    estado,
  })
}

const empInserted = await insertBatch('empleados', empleadoRows)
console.log(`  Empleados insertados: ${empInserted}/${empleadoRows.length}`)

// ── 4. Encargados de tratamiento ──────────────────────────────────────────────

console.log('\n── Migrando encargados de tratamiento...')
for (const post of encargadoPosts) {
  const wpId = String(post[POST_ID])
  const row = {
    razon_social: metaStr(wpId, 'etrazon_social') || String(post[POST_TITLE]) || 'Sin nombre',
    cif: metaStr(wpId, 'cif') || null,
    nombre_del_servicio: metaStr(wpId, 'nombre_del_servicio') || String(post[POST_TITLE]) || 'Sin nombre',
    direccion: metaStr(wpId, 'etdireccion') || metaStr(wpId, 'direccion'),
    localidad: metaStr(wpId, 'etlocalidad') || metaStr(wpId, 'localidad'),
    codigo_postal: metaStr(wpId, 'etcodigo_postal') || metaStr(wpId, 'codigo_postal'),
    provincia: metaStr(wpId, 'etprovincia') || metaStr(wpId, 'provincia'),
  }
  const { data, error } = await supabase.from('encargados_tratamiento').insert(row).select('id').single()
  if (error) { console.error('Error encargado:', error.message); continue }
  encargadoIdMap[wpId] = data.id
}
console.log(`  Encargados insertados: ${Object.keys(encargadoIdMap).length}`)

// ── 5. Equipos (desde repeater ACF de empresa) ────────────────────────────────

console.log('\n── Migrando equipos...')
const equipoRows = []
for (const post of empresaPosts) {
  const wpId = String(post[POST_ID])
  const empresaSupaId = empresaIdMap[wpId]
  if (!empresaSupaId) continue

  const count = parseInt(meta(wpId, 'equipos') || '0')
  for (let i = 0; i < count; i++) {
    const tipo = metaStr(wpId, `equipos_${i}_tipo_de_equipo`)
    if (!tipo) continue
    const estadoRaw = metaStr(wpId, `equipos_${i}_estado`) || 'active'
    const estado = ['active', 'pending', 'baja'].includes(estadoRaw) ? estadoRaw : 'active'
    equipoRows.push({
      empresa_id: empresaSupaId,
      tipo_de_equipo: tipo,
      codigo_del_equipo: metaStr(wpId, `equipos_${i}_codigo_del_equipo`),
      responsable: metaStr(wpId, `equipos_${i}_responsable`),
      estado,
    })
  }
}

const eqInserted = await insertBatch('equipos', equipoRows)
console.log(`  Equipos insertados: ${eqInserted}/${equipoRows.length}`)

// ── 6. Revisiones (desde repeater ACF de empresa) ─────────────────────────────

console.log('\n── Migrando revisiones...')
const revisionRows = []
for (const post of empresaPosts) {
  const wpId = String(post[POST_ID])
  const empresaSupaId = empresaIdMap[wpId]
  if (!empresaSupaId) continue

  // Revisiones de auditoría
  const audCount = parseInt(meta(wpId, 'revisiones_auditorias') || '0')
  for (let i = 0; i < audCount; i++) {
    const fecha = metaStr(wpId, `revisiones_auditorias_${i}_fecha`)
    if (!fecha) continue
    revisionRows.push({
      empresa_id: empresaSupaId,
      fecha: normalizeDate(fecha),
      tipo: 'auditoria',
      notas: metaStr(wpId, `revisiones_auditorias_${i}_notas`),
    })
  }

  // Revisiones trimestrales
  const trimCount = parseInt(meta(wpId, 'revisiones_trimestral') || '0')
  for (let i = 0; i < trimCount; i++) {
    const fecha = metaStr(wpId, `revisiones_trimestral_${i}_fecha`)
    if (!fecha) continue
    revisionRows.push({
      empresa_id: empresaSupaId,
      fecha: normalizeDate(fecha),
      tipo: 'revision_trimestral',
      notas: metaStr(wpId, `revisiones_trimestral_${i}_notas`),
    })
  }
}

const revInserted = await insertBatch('revisiones', revisionRows)
console.log(`  Revisiones insertadas: ${revInserted}/${revisionRows.length}`)

// ── 7. Vincular encargados a empresas (repeater) ──────────────────────────────

console.log('\n── Vinculando encargados a empresas...')
const vinculos = []
for (const post of empresaPosts) {
  const wpId = String(post[POST_ID])
  const empresaSupaId = empresaIdMap[wpId]
  if (!empresaSupaId) continue

  // Repeater: encargados_de_tratamientodocumentos
  const encCount = parseInt(meta(wpId, 'encargados_de_tratamientodocumentos') || '0')
  for (let i = 0; i < encCount; i++) {
    const encWpId = metaStr(wpId, `encargados_de_tratamientodocumentos_${i}_encargado`)
    if (!encWpId) continue
    const encSupaId = encargadoIdMap[encWpId]
    if (!encSupaId) continue
    const estadoRaw = metaStr(wpId, `encargados_de_tratamientodocumentos_${i}_estado`) || 'active'
    const estado = ['active', 'pending', 'baja'].includes(estadoRaw) ? estadoRaw : 'active'
    vinculos.push({ empresa_id: empresaSupaId, encargado_id: encSupaId, estado, es_servicio_externo: false })
  }

  // Repeater: servicios_externos
  const svcCount = parseInt(meta(wpId, 'servicios_externos') || '0')
  for (let i = 0; i < svcCount; i++) {
    const encWpId = metaStr(wpId, `servicios_externos_${i}_encargado`)
    if (!encWpId) continue
    const encSupaId = encargadoIdMap[encWpId]
    if (!encSupaId) continue
    const estadoRaw = metaStr(wpId, `servicios_externos_${i}_estado`) || 'active'
    const estado = ['active', 'pending', 'baja'].includes(estadoRaw) ? estadoRaw : 'active'
    vinculos.push({ empresa_id: empresaSupaId, encargado_id: encSupaId, estado, es_servicio_externo: true })
  }
}

// Deduplicar por empresa+encargado
const vinculosUniq = []
const seen = new Set()
for (const v of vinculos) {
  const key = `${v.empresa_id}__${v.encargado_id}`
  if (!seen.has(key)) { seen.add(key); vinculosUniq.push(v) }
}

const vinInserted = await insertBatch('empresa_encargado', vinculosUniq)
console.log(`  Vínculos empresa↔encargado: ${vinInserted}/${vinculosUniq.length}`)

// ── Resumen ───────────────────────────────────────────────────────────────────

console.log('\n✓ Migración completada')
console.log(`  DPOs:        ${Object.keys(dpoIdMap).length}`)
console.log(`  Empresas:    ${Object.keys(empresaIdMap).length}`)
console.log(`  Empleados:   ${empInserted}`)
console.log(`  Encargados:  ${Object.keys(encargadoIdMap).length}`)
console.log(`  Equipos:     ${eqInserted}`)
console.log(`  Revisiones:  ${revInserted}`)
console.log(`  Vínculos:    ${vinInserted}`)

// ─── Utils ───────────────────────────────────────────────────────────────────

function normalizeDate(str) {
  if (!str) return null
  // ACF puede guardar fechas como Ymd (20250101) o Y-m-d
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0,4)}-${str.slice(4,6)}-${str.slice(6,8)}`
  }
  return str.slice(0, 10)
}
