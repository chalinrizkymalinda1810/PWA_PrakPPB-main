import { useState, useMemo, useEffect } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  AlertCircle,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  Archive,
  Check,
} from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page with:
 * 1. Pagination (Requirement #1)
 * 2. Soft-delete / Archive (Requirement #6)
 * 3. Share link button via GunCard (Requirement #2)
 * 4. Lazy loading support (Requirement #3)
 */
export default function Catalog({ onNavigate, initialGunId }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 100 })
  const [useLocal, setUseLocal] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Decide data source
  const rawGuns = useMemo(() => {
    if (useLocal || (error && apiGuns.length === 0)) {
      return GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    }
    return apiGuns
  }, [apiGuns, error, useLocal])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // ---- PAGINATION (Requirement #1) ----
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // 6 items per page fits 3-col grid nicely

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeCategory, sortKey, sortOrder, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredGuns.length / pageSize))
  const paginatedGuns = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredGuns.slice(start, start + pageSize)
  }, [filteredGuns, currentPage, pageSize])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // Open initial gun if requested via unique link (Requirement #2)
  useEffect(() => {
    if (initialGunId && rawGuns.length > 0) {
      const match = rawGuns.find((g) => String(g.id) === String(initialGunId))
      if (match) setSelectedGun(match)
    }
  }, [initialGunId, rawGuns])

  // ---- Delete / Archive modals (Requirement #6) ----
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Soft delete / archive
  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return
    try {
      setActionLoading(true)
      await gunService.archiveGun(archiveTarget.id)
      setFeedback(`"${archiveTarget.name}" berhasil diarsipkan (soft delete).`)
      setTimeout(() => setFeedback(''), 4000)
      setArchiveTarget(null)
      refetch()
    } catch (err) {
      alert('Gagal mengarsipkan: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Hard delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setActionLoading(true)
      await gunService.deleteGun(deleteTarget.id)
      setFeedback(`"${deleteTarget.name}" telah dihapus permanen.`)
      setTimeout(() => setFeedback(''), 4000)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    const stockElem = document.getElementById('catalog-stock-list')
    if (stockElem) {
      stockElem.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onArchive={(g) => {
          setSelectedGun(null)
          setArchiveTarget(g)
        }}
        onDelete={(g) => {
          setSelectedGun(null)
          setDeleteTarget(g)
        }}
      />
    )
  }

  return (
    <>
      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section id="catalog-stock-list">
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add Hardware
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => {
            setSortKey(key)
            setSortOrder(order)
          }}
        />

        {/* States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {/* Product grid with Pagination */}
        {filteredGuns.length > 0 && (
          <>
            <ul className="stock">
              {paginatedGuns.map((gun) => (
                <GunCard
                  key={gun.id || gun.name}
                  gun={gun}
                  onSelect={setSelectedGun}
                  onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                  onArchive={(g) => setArchiveTarget(g)}
                  onDelete={(g) => setDeleteTarget(g)}
                />
              ))}
            </ul>

            {/* PAGINATION CONTROLS BAR (Requirement #1) */}
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Showing{' '}
                <strong>
                  {Math.min((currentPage - 1) * pageSize + 1, filteredGuns.length)}–
                  {Math.min(currentPage * pageSize, filteredGuns.length)}
                </strong>{' '}
                of <strong>{filteredGuns.length}</strong> items
              </div>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                  // If lots of pages, show current, first, last, and neighbors
                  if (
                    num === 1 ||
                    num === totalPages ||
                    (num >= currentPage - 1 && num <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={num}
                        type="button"
                        className={`page-num-btn ${num === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(num)}
                      >
                        {num}
                      </button>
                    )
                  }
                  if (num === currentPage - 2 || num === currentPage + 2) {
                    return (
                      <span key={num} className="page-ellipsis">
                        …
                      </span>
                    )
                  }
                  return null
                })}

                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>

              <div className="pagination-size">
                <label htmlFor="page-size-select">Per page:</label>
                <select
                  id="page-size-select"
                  className="page-size-select"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </div>
          </>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setUseLocal(false)
                refetch()
              }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Archive (Soft-delete) Modal */}
      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Arsipkan Senjata (Soft Delete)"
        message={`Apakah Anda ingin mengarsipkan "${archiveTarget?.name}"? Item ini akan dipindahkan ke section Draft & Arsip di Profile, dan dapat di-restore kapan saja.`}
        confirmLabel="Arsipkan"
        danger={false}
        loading={actionLoading}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />

      {/* Permanent Delete Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Permanen"
        message={`Apakah Anda yakin ingin menghapus permanen "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Delete Permanen"
        danger
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
