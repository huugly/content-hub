import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import { MobileTabBar } from '@/components/MobileTabBar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const ownerEmail = process.env.OWNER_EMAIL
  if (ownerEmail && user.email !== ownerEmail) {
    redirect('/login')
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Desktop sidebar */}
      <div
        style={{
          display: 'none',
        }}
        className="md-sidebar"
      >
        <Sidebar email={user.email ?? ''} />
      </div>

      {/* Sidebar shown on md+ via CSS */}
      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: block !important; }
          .mobile-tab-bar { display: none !important; }
          .page-content { padding: 32px 48px !important; }
        }
        @media (max-width: 767px) {
          .page-content { padding: 20px 20px 100px !important; }
        }
      `}</style>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="page-content"
          style={{
            flex: 1,
            maxWidth: '1200px',
            width: '100%',
          }}
        >
          {children}
        </div>
      </main>

      {/* Mobile tab bar */}
      <div className="mobile-tab-bar" style={{ display: 'block' }}>
        <MobileTabBar />
      </div>
    </div>
  )
}
