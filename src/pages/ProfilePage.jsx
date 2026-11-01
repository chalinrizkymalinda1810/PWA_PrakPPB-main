import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  RotateCcw,
  Trash2,
  Edit3,
  MapPin,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Database,
  RefreshCw,
  ExternalLink,
  Award,
  Layers,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import userService from '../services/userService'
import gunService from '../services/gunService'
import { useFavorites } from '../hooks/useFavorites'
import { formatPrice } from '../utils/helpers'
import LazyImage from '../components/common/LazyImage'
import ConfirmModal from '../components/modals/ConfirmModal'
import {
  openAppCache,
  precacheCoreAssets,
  listCachedEntries,
  clearAppCache,
  APP_CACHE_NAME,
} from '../utils/cacheManager'

export default function ProfilePage({ onNavigateEditProfile, onReplaySplash }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { favorites } = useFavorites()

  // Drafts & Archived catalog state
  const [archivedGuns, setArchivedGuns] = useState([])
  const [loadingArchived, setLoadingArchived] = useState(false)
  const [permDeleteTarget, setPermDeleteTarget] = useState(null)
  const [actionInProgress, setActionInProgress] = useState(false)

  // Open Caching state
  const [cacheStatus, setCacheStatus] = useState('checking')
  const [cachedEntriesCount, setCachedEntriesCount] = useState(0)
  const [cachedUrls, setCachedUrls] = useState([])
  const [showCacheList, setShowCacheList] = useState(false)

  // Fetch archived items
  const fetchArchivedGuns = useCallback(async () => {
    try {
      setLoadingArchived(true)
      const res = await gunService.getGuns({ archived: true })
      if (res && res.data) {
        setArchivedGuns(res.data)
      } else {
        setArchivedGuns([])
      }
    } catch {
      setArchivedGuns([])
    } finally {
      setLoadingArchived(false)
    }
  }, [])

  // Check Open Cache status
  const checkCacheInfo = useCallback(async () => {
    try {
      const cache = await openAppCache()
      if (cache) {
        setCacheStatus('Active (caches.open ready)')
        const entries = await listCachedEntries()
        setCachedEntriesCount(entries.length)
        setCachedUrls(entries)
      } else {
        setCacheStatus('Unavailable in this context')
      }
    } catch {
      setCacheStatus('Error accessing CacheStorage')
    }
  }, [])

  useEffect(() => {
    fetchArchivedGuns()
    checkCacheInfo()
  }, [fetchArchivedGuns, checkCacheInfo])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Restore archived gun
  const handleRestore = async (gun) => {
    try {
      setActionInProgress(true)
      await gunService.restoreGun(gun.id)
      setFeedback(`"${gun.name}" restored to active catalog!`)
      setTimeout(() => setFeedback(''), 3500)
      await fetchArchivedGuns()
    } catch (err) {
      setFeedback(`Failed to restore: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  // Permanently delete gun
  const handlePermanentDelete = async () => {
    if (!permDeleteTarget) return
    try {
      setActionInProgress(true)
      await gunService.deleteGun(permDeleteTarget.id)
      setFeedback(`"${permDeleteTarget.name}" deleted permanently.`)
      setTimeout(() => setFeedback(''), 3500)
      setPermDeleteTarget(null)
      await fetchArchivedGuns()
    } catch (err) {
      setFeedback(`Failed to delete: ${err.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  // Pre-cache action
  const handlePrecache = async () => {
    setFeedback('Pre-caching core assets via Cache Storage API…')
    const result = await precacheCoreAssets()
    if (result.success) {
      setFeedback(`Successfully cached ${result.count} core assets!`)
      await checkCacheInfo()
    } else {
      setFeedback(`Cache error: ${result.error || 'Failed'}`)
    }
    setTimeout(() => setFeedback(''), 4000)
  }

  // Clear cache action
  const handleClearCache = async () => {
    const ok = await clearAppCache()
    if (ok) {
      setFeedback('CacheStorage cleared.')
      await checkCacheInfo()
    }
    setTimeout(() => setFeedback(''), 3000)
  }

  return (
    <div className="profile-page">
      {/* Toast feedback */}
      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Profile Header */}
      <section className="profile-hero">
        <div className="profile-hero-main">
          <div className="avatar-wrap large">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={44} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-meta">
            <div className="profile-title-row">
              <h1 className="display">{profile.username || 'Operator Shooter'}</h1>
              <span className="badge badge--brass">Certified Armorer</span>
            </div>

            <div className="profile-id-row">
              <span className="mono-badge">ID: {profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>

            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            {/* Edit Profile Button (Requirement #5) */}
            <div className="profile-cta-row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={onNavigateEditProfile}
              >
                <Edit3 size={16} /> Edit Profile
              </button>

              {onReplaySplash && (
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={onReplaySplash}
                >
                  Replay Intro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{archivedGuns.length}</div>
            <div className="stat-label">Draft / Archived</div>
          </div>
          <div className="stat-item">
            <Database size={20} className="stat-icon" stroke="#4caf50" />
            <div className="stat-val">{cachedEntriesCount}</div>
            <div className="stat-label">Cached Assets</div>
          </div>
        </div>
      </section>

      {/* SECTION 1: DRAFT & ARSIP KATALOG (Requirement #5 & #6) */}
      <section className="profile-section" id="drafts">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Draft &amp; Arsip Katalog</h2>
            <p className="section-subtitle">
              Senjata yang di-soft-delete atau disimpan sebagai draft. Anda dapat memulihkan (restore) ke katalog atau menghapusnya secara permanen.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={fetchArchivedGuns}
            disabled={loadingArchived}
          >
            <RefreshCw size={14} className={loadingArchived ? 'spin' : ''} /> Refresh Drafts
          </button>
        </div>

        {loadingArchived ? (
          <div className="state-box">
            <p>Loading draft and archived items…</p>
          </div>
        ) : archivedGuns.length === 0 ? (
          <div className="draft-empty-card">
            <Layers size={32} stroke="var(--steel)" />
            <h3>Tidak Ada Senjata yang Di-draft-kan atau Diarsip</h3>
            <p>
              Saat Anda mengarsipkan atau melakukan soft-delete pada katalog, item tersebut akan muncul di sini dan dapat di-restore kapan saja.
            </p>
          </div>
        ) : (
          <ul className="archived-grid">
            {archivedGuns.map((gun) => (
              <li key={gun.id} className="archived-card">
                <div className="archived-thumb">
                  <LazyImage
                    src={gun.image_url || gun.image || '/guns/pistol.svg'}
                    alt={gun.name}
                    width={80}
                    height={60}
                  />
                </div>

                <div className="archived-body">
                  <div className="archived-badge">Arsip / Draft</div>
                  <h4 className="archived-name">{gun.name}</h4>
                  <p className="archived-sub">
                    {gun.type || gun.category} · {gun.caliber || 'Standard'}
                  </p>
                  <p className="archived-price">{formatPrice(gun.price)}</p>
                </div>

                <div className="archived-actions">
                  <button
                    type="button"
                    className="btn btn--outline btn--sm btn--restore"
                    onClick={() => handleRestore(gun)}
                    disabled={actionInProgress}
                    title="Restore item back to active catalog"
                  >
                    <RotateCcw size={14} /> Restore
                  </button>

                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => setPermDeleteTarget(gun)}
                    disabled={actionInProgress}
                    title="Permanently remove from database"
                  >
                    <Trash2 size={14} /> Delete Permanen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 2: ABOUT SECTION (Requirement #5 - moved from About page) */}
      <section className="profile-section" id="about">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">About Bore &amp; Barrel</h2>
            <p className="section-subtitle">
              A one-room armory. Hardware, by the spec sheet.
            </p>
          </div>
        </div>

        <div className="about-content-card">
          <div className="about-lead-box">
            <p className="lede">
              Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced from the bench — no markup theatre, no filler.
            </p>
          </div>

          <div className="about-pillars">
            <div className="pillar-item">
              <Award size={24} stroke="var(--brass)" />
              <h4>Hand-Fitted Precision</h4>
              <p>Every firearm is bench-checked, with trigger pull weight, headspace, and extractor tension inspected before listing.</p>
            </div>
            <div className="pillar-item">
              <Shield size={24} stroke="var(--steel)" />
              <h4>Verified Ballistics</h4>
              <p>Raw specifications with verified chambering, barrel twist, and rifling profiles. No exaggerated manufacturer fluff.</p>
            </div>
            <div className="pillar-item">
              <RotateCcw size={24} stroke="var(--brass)" />
              <h4>Lifetime Armorer Support</h4>
              <p>Direct access to our gunsmiths for maintenance schedules, headspace recalibration, and spring replacements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CONTACT SECTION (Requirement #5 - moved from Contact page) */}
      <section className="profile-section" id="contact">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Contact &amp; Depot Range</h2>
            <p className="section-subtitle">
              Come by the shop or dispatch inquiries directly to our armorer.
            </p>
          </div>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <MapPin size={28} stroke="var(--brass)" />
            <h3>Range Depot</h3>
            <p>123 Range Road, Sector 4</p>
            <p className="contact-sub">Full indoor firing line &amp; gunsmithing workshop.</p>
          </div>

          <div className="contact-card">
            <Clock size={28} stroke="var(--steel)" />
            <h3>Armory Hours</h3>
            <p>Tuesday to Saturday: 10:00 — 18:00</p>
            <p className="contact-sub">Sunday &amp; Monday: Range Maintenance</p>
          </div>

          <div className="contact-card highlight-contact">
            <MessageCircle size={28} stroke="#25D366" />
            <h3>WhatsApp Procurement</h3>
            <p><strong>0813-6793-6664</strong></p>
            <a
              href="https://wa.me/6281367936664?text=Hi%20Bore%20%26%20Barrel%2C%20saya%20ingin%20bertanya%20seputar%20katalog."
              target="_blank"
              rel="noreferrer"
              className="btn btn--whatsapp btn--sm"
              style={{ marginTop: '8px' }}
            >
              <MessageCircle size={14} /> Chat WhatsApp <ExternalLink size={12} />
            </a>
          </div>

          <div className="contact-card">
            <Phone size={28} stroke="var(--brass)" />
            <h3>Telephone Line</h3>
            <p>(555) 010-0100</p>
            <p className="contact-sub">Direct station dispatch.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4: OPEN CACHING & PWA STORAGE (Requirement #4) */}
      <section className="profile-section" id="caching">
        <div className="section-head-bar">
          <div>
            <h2 className="section-title">Open Caching &amp; PWA Offline Storage</h2>
            <p className="section-subtitle">
              Implementasi Cache Storage API (<code>caches.open('{APP_CACHE_NAME}')</code>) untuk offline accessibility dan performance caching.
            </p>
          </div>
          <div className="cache-status-badge">
            <Database size={15} /> {cacheStatus}
          </div>
        </div>

        <div className="caching-card">
          <div className="caching-controls">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handlePrecache}
            >
              <Database size={14} /> Pre-cache Core Assets
            </button>

            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowCacheList(!showCacheList)}
            >
              {showCacheList ? 'Hide' : 'Inspect'} Cached Keys ({cachedEntriesCount})
            </button>

            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={handleClearCache}
            >
              Clear Cache
            </button>
          </div>

          {showCacheList && (
            <div className="cached-keys-box">
              <h4>Entries currently stored in <code>{APP_CACHE_NAME}</code>:</h4>
              {cachedUrls.length === 0 ? (
                <p className="empty-cache-note">No URLs cached yet. Click "Pre-cache Core Assets" above.</p>
              ) : (
                <ul className="cache-urls-list">
                  {cachedUrls.map((url, i) => (
                    <li key={i}>
                      <code>{url}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Permanent Delete Modal */}
      <ConfirmModal
        open={Boolean(permDeleteTarget)}
        title="Delete Permanen"
        message={`Apakah Anda yakin ingin MENGHAPUS PERMANEN "${permDeleteTarget?.name}"? Item ini akan dihapus dari database selamanya dan tidak dapat dipulihkan.`}
        confirmLabel="Hapus Permanen"
        danger
        loading={actionInProgress}
        onConfirm={handlePermanentDelete}
        onCancel={() => setPermDeleteTarget(null)}
      />
    </div>
  )
}
