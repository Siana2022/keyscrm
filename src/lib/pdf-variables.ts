// Extrae todas las variables {{nombre}} de un template
export function extraerVariables(contenido: string): string[] {
  const matches = contenido.matchAll(/\{\{([^}]+)\}\}/g)
  return [...new Set([...matches].map(m => m[1].trim()))]
}

// Sustituye {{variable}} por su valor en el mapa
export function sustituirVariables(contenido: string, vars: Record<string, string>): string {
  return contenido.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key.trim()] ?? `{{${key.trim()}}}`)
}

// Construye el mapa de variables a partir de los datos de empresa + empleado (si aplica)
export function buildVariables(empresa: Record<string, unknown>, extras: Record<string, string> = {}): Record<string, string> {
  const str = (v: unknown) => (v != null ? String(v) : '')
  return {
    // Empresa
    razon_social: str(empresa.razon_social),
    nombre_comercial: str(empresa.nombre_comercial),
    cif: str(empresa.cifdni),
    cifdni: str(empresa.cifdni),
    domicilio: str(empresa.domicilio),
    localidad: str(empresa.localidad),
    codigo_postal: str(empresa.codigo_postal),
    provincia: str(empresa.provincia),
    email_principal: str(empresa.email_principal),
    telefono: str(empresa.telefono),
    web: str(empresa.web),
    // Data Manager
    nombre_data_manager: str(empresa.nombre_data_manager),
    apellidos_data_manager: str(empresa.apellidos_data_manager),
    dni_data_manager: str(empresa.dni_data_manager),
    nombre_completo_data_manager: [str(empresa.nombre_data_manager), str(empresa.apellidos_data_manager)].filter(Boolean).join(' '),
    // Extras (empleado, encargado, etc.)
    ...extras,
  }
}
