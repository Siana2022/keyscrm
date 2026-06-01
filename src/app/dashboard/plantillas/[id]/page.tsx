import { createClient } from '@/supabase/server'
import { notFound } from 'next/navigation'
import PlantillaEditor from '@/components/dashboard/PlantillaEditor'

export default async function EditarPlantillaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: plantilla } = await supabase.from('plantillas_documento').select('*').eq('id', id).single()
  if (!plantilla) notFound()

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar plantilla</h1>
      <PlantillaEditor plantilla={plantilla} />
    </div>
  )
}
