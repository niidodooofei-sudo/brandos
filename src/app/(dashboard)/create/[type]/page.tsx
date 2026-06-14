import { notFound } from 'next/navigation'
import { OUTPUT_TYPES } from '@/types'
import { CreateForm } from '@/components/create/create-form'

interface PageProps {
  params: Promise<{ type: string }>
}

export default async function CreateTypePage({ params }: PageProps) {
  const { type } = await params
  const outputType = OUTPUT_TYPES.find((t) => t.id === type)
  if (!outputType) notFound()

  return <CreateForm outputType={outputType} />
}

export async function generateStaticParams() {
  return OUTPUT_TYPES.map((t) => ({ type: t.id }))
}
