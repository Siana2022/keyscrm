import { createClient } from '@/supabase/server'
import GuiaForm from './GuiaForm'

export default async function GuiasPage() {
  const supabase = await createClient()
  const { data: guias } = await supabase
    .from('guias')
    .select('*')
    .order('tipo')
    .order('orden')

  const dataManager = guias?.filter(g => g.tipo === 'data_manager') ?? []
  const usuarios = guias?.filter(g => g.tipo === 'usuario') ?? []

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Guías y manuales</h1>
          <p className="text-sm text-gray-500 mt-0.5">Se muestran al final de la ficha de cada empresa</p>
        </div>
        <GuiaForm mode="create" />
      </div>

      {/* Data Manager */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Para el Data Manager
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {dataManager.map(g => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-sm font-bold w-8" style={{ color: '#FF2F92' }}>{g.codigo}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{g.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {g.archivo_url
                    ? <a href={g.archivo_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver archivo</a>
                    : 'Sin archivo enlazado'}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${g.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {g.activo ? 'Activa' : 'Inactiva'}
              </span>
              <GuiaForm mode="edit" guia={g} />
            </div>
          ))}
          {!dataManager.length && (
            <p className="px-5 py-4 text-sm text-gray-400">Sin guías para Data Manager</p>
          )}
        </div>
      </div>

      {/* Usuarios */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Para usuarios
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {usuarios.map(g => (
            <div key={g.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-sm font-bold w-8" style={{ color: '#FF2F92' }}>{g.codigo}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{g.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {g.archivo_url
                    ? <a href={g.archivo_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver archivo</a>
                    : 'Sin archivo enlazado'}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${g.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {g.activo ? 'Activa' : 'Inactiva'}
              </span>
              <GuiaForm mode="edit" guia={g} />
            </div>
          ))}
          {!usuarios.length && (
            <p className="px-5 py-4 text-sm text-gray-400">Sin guías para usuarios</p>
          )}
        </div>
      </div>
    </div>
  )
}
