import { redirect } from 'next/navigation'
import { getAllResources } from '@/lib/queries'
import { firstSlug } from '@/lib/resources'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const resources = await getAllResources()
  const slug = firstSlug(resources)
  redirect(slug ? `/${slug}` : '/new')
}
