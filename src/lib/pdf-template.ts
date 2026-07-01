import fs from 'fs'
import path from 'path'

function logoBase64(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), 'public', 'keys', filename)
    const buf = fs.readFileSync(filePath)
    const ext = filename.split('.').pop()?.toLowerCase()
    const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

export function buildPdfHtml(opts: {
  titulo: string
  contenido: string
  logoEmpresaUrl?: string | null
}): string {
  const logoSafe = logoBase64('logo-safe.png')
  const logoEmpresa = opts.logoEmpresaUrl ?? ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
    }

    /* ── Cabecera fija ── */
    .header {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      border-bottom: 2px solid #e5e5e5;
      background: #fff;
    }
    .header img.logo-safe {
      height: 48px;
      object-fit: contain;
    }
    .header .titulo {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.3;
      max-width: 340px;
      color: #1a1a1a;
    }
    .header .logo-empresa {
      height: 48px;
      max-width: 120px;
      object-fit: contain;
    }
    .header .logo-empresa-placeholder {
      width: 120px;
    }

    /* ── Pie fijo ── */
    .footer {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 40px;
      border-top: 1px solid #e5e5e5;
      background: #fff;
    }
    .footer .page-num {
      font-size: 9pt;
      color: #888;
    }

    /* ── Cuerpo ── */
    .content {
      margin-top: 92px;
      margin-bottom: 52px;
      padding: 0 40px;
      line-height: 1.6;
    }
    .content p { margin-bottom: 10px; }
    .content ul { margin: 8px 0 10px 24px; }
    .content li { margin-bottom: 6px; }
    .content strong, .content b { font-weight: bold; }
    .content h1, .content h2, .content h3 {
      margin: 16px 0 8px;
      font-weight: bold;
    }
    .content h1 { font-size: 14pt; }
    .content h2 { font-size: 12pt; }
    .content h3 { font-size: 11pt; }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 10pt;
    }
    .content table th, .content table td {
      border: 1px solid #ccc;
      padding: 6px 10px;
      text-align: left;
    }
    .content table th { background: #f5f5f5; font-weight: bold; }
  </style>
</head>
<body>

  <div class="header">
    ${logoSafe ? `<img class="logo-safe" src="${logoSafe}" alt="Safe-LOPD" />` : '<div style="width:60px"></div>'}
    <div class="titulo">${opts.titulo}</div>
    ${logoEmpresa
      ? `<img class="logo-empresa" src="${logoEmpresa}" alt="Logo empresa" />`
      : '<div class="logo-empresa-placeholder"></div>'
    }
  </div>

  <div class="footer">
    <span class="page-num">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
  </div>

  <div class="content">
    ${opts.contenido}
  </div>

</body>
</html>`
}
