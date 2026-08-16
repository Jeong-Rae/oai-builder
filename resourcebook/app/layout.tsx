import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { getAllResources } from '@/lib/queries'
import { buildNavGroups } from '@/lib/resources'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-noto-sans-kr',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'CONTROL Resourcebook',
  description: 'CONTROL Resourcebook — 필드 4종, 오브젝트 4종 리소스 스펙',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const resources = await getAllResources()
  const groups = buildNavGroups(resources)
  const nameBySlug = Object.fromEntries(resources.map((r) => [r.slug, r.name]))

  return (
    <html lang="ko" className={`light bg-background ${notoSansKr.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
          <Sidebar groups={groups} />
          <main className="min-w-0">
            <Topbar nameBySlug={nameBySlug} />
            <div className="mx-auto max-w-[980px] px-5 pb-24 pt-11 md:px-10 md:pt-16">
              {children}
            </div>
          </main>
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
