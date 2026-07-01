import { NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { buildVariables, sustituirVariables } from '@/lib/pdf-variables'
import { buildPdfHtml } from '@/lib/pdf-template'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function getPuppeteer() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const chromium = await import('@sparticuz/chromium-min')
    const puppeteer = await import('puppeteer-core')
    return { puppeteer: puppeteer.default, chromium: chromium.default }
  }
  // En local usamos puppeteer completo
  const puppeteer = await import('puppeteer')
  return { puppeteer: puppeteer.default, chromium: null }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ empresaId: string; plantillaId: string }> }
) {
  const { empresaId, plantillaId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [{ data: empresa }, { data: plantilla }, { data: asignacion }] = await Promise.all([
    supabase.from('empresas').select('*').eq('id', empresaId).single(),
    supabase.from('plantillas_documento').select('*').eq('id', plantillaId).single(),
    supabase.from('empresa_plantilla').select('*').eq('empresa_id', empresaId).eq('plantilla_id', plantillaId).single(),
  ])

  if (!empresa || !plantilla) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  // Sustituir variables
  const vars = buildVariables(empresa as Record<string, unknown>)
  const contenidoFinal = sustituirVariables(plantilla.contenido, vars)

  // Generar HTML
  const html = buildPdfHtml({
    titulo: plantilla.titulo,
    contenido: contenidoFinal,
    logoEmpresaUrl: empresa.logo_url ?? null,
  })

  // Generar PDF con Puppeteer
  try {
    const { puppeteer, chromium } = await getPuppeteer()

    let browser
    if (chromium) {
      const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar'
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(CHROMIUM_URL),
        headless: true,
      })
    } else {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    }

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    await browser.close()

    const filename = `${plantilla.titulo.replace(/[^a-z0-9]/gi, '_')}.pdf`

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
