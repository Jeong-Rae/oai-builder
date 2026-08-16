import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getResourceBySlug } from '@/lib/queries'
import { ResourceView } from '@/components/resource-view'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const resource = await getResourceBySlug(slug)
  if (!resource) return { title: 'CONTROL Resourcebook' }
  return {
    title: `${resource.name} · CONTROL Resourcebook`,
    description: resource.lede,
  }
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const resource = await getResourceBySlug(slug)
  if (!resource) notFound()

  return <ResourceView resource={resource} />
}
