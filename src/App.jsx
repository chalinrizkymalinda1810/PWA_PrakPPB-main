import { useState, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import { openAppCache } from './utils/cacheManager.js'
import { Loader } from 'lucide-react'
import './App.css'

// ---------------------------------------------------------------------------
// LAZY LOAD IMPLEMENTATION (Requirement #3)
// Dynamic imports with React.lazy and Suspense code splitting
// ---------------------------------------------------------------------------
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))

function PageFallback() {
  return (
    <div className="state-box" style={{ minHeight: '300px' }}>
      <Loader size={32} className="spin" stroke="var(--brass)" />
      <p style={{ marginTop: '12px', color: 'var(--steel)' }}>Loading module…</p>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog') // 'Catalog' | 'Cart' | 'Favorites' | 'Profile'
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'edit-profile'
  const [selectedGun, setSelectedGun] = useState(null)
  const [initialGunId, setInitialGunId] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)

  // -------------------------------------------------------------------------
  // OPEN CACHING (Requirement #4) — Open cache on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    openAppCache().catch((err) => console.warn('[App] OpenCache initialization:', err))
  }, [])

  // -------------------------------------------------------------------------
  // SHARE LINK DEEP LINKING (Requirement #2)
  // Handle unique shared links (e.g. ?gun=123 or #gun-123)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleUrlParams = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const gunParam = searchParams.get('gun')
      const hash = window.location.hash

      let targetId = gunParam
      if (!targetId && hash.startsWith('#gun-')) {
        targetId = hash.replace('#gun-', '')
      }

      if (targetId) {
        setInitialGunId(targetId)
        try {
          const res = await gunService.getGunById(targetId)
          if (res && res.data) {
            setSelectedGun(res.data)
            setMode('detail')
          }
        } catch (err) {
          console.warn('Could not load gun from shared unique link:', err)
        }
      }
    }

    handleUrlParams()
    window.addEventListener('popstate', handleUrlParams)
    return () => window.removeEventListener('popstate', handleUrlParams)
  }, [])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      // Update browser URL with unique share link query parameter
      window.history.pushState(null, '', `?gun=${payload.id}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('edit-profile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.history.pushState(null, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
    window.history.pushState(null, '', window.location.pathname)
  }

  // Soft delete / archive action
  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      setArchiving(true)
      await gunService.archiveGun(archiveTarget.id)
      setArchiveTarget(null)
      handleBackToList()
      setTab('Catalog')
    } catch (err) {
      alert(err.message || 'Failed to archive item.')
    } finally {
      setArchiving(false)
    }
  }

  // Permanent delete action
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await gunService.deleteGun(deleteTarget.id)
      setDeleteTarget(null)
      handleBackToList()
      setTab('Catalog')
    } catch (err) {
      alert(err.message || 'Failed to delete record.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        <Suspense fallback={<PageFallback />}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {/* EDIT PROFILE IN NEW PAGE (Requirement #5) */}
          {mode === 'edit-profile' && (
            <EditProfilePage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Profile')
              }}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onArchive={(g) => setArchiveTarget(g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  initialGunId={initialGunId}
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {/* SHOPPING CART PAGE (Requirement #8) */}
              {tab === 'Cart' && (
                <CartPage
                  onBack={() => setTab('Catalog')}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}
              {/* PROFILE PAGE with About, Contact, Drafts (Requirement #5) */}
              {tab === 'Profile' && (
                <ProfilePage
                  onNavigateEditProfile={() => handleNavigate('EditProfile')}
                  onReplaySplash={() => setShowSplash(true)}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Archive / Soft-delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Arsipkan Senjata (Soft Delete)"
        message={`Apakah Anda yakin ingin mengarsipkan "${archiveTarget?.name}"? Senjata ini akan dipindahkan ke section Draft & Arsip di Profile, dan dapat di-restore kapan saja.`}
        confirmLabel="Arsipkan"
        danger={false}
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      {/* Global Permanent Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Permanen"
        message={`Apakah Anda yakin ingin MENGHAPUS PERMANEN "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Delete Permanen"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
