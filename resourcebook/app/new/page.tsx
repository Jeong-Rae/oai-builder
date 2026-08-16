import type { Metadata } from 'next'
import { NewResourceForm } from '@/components/new-resource-form'

export const metadata: Metadata = {
  title: '새 리소스 추가 · CONTROL Resourcebook',
}

export default function NewResourcePage() {
  return <NewResourceForm />
}
