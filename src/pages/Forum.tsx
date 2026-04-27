import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { BottomNav } from '../components/layout/BottomNav'
import { HamburgerMenu } from '../components/layout/HamburgerMenu'

type PostType = 'consejo' | 'experiencia'

interface ForumPost {
  id: string
  user_id: string
  type: PostType
  title: string
  content: string
  is_anonymous: boolean
  created_at: string
  profiles: { full_name: string | null } | null
  likesCount: number
  likedByMe: boolean
}

const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export const Forum = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PostType>('consejo')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)

  // Create / edit sheet
  const [showCreate, setShowCreate] = useState(false)
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null)
  const [newType, setNewType] = useState<PostType>('consejo')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Action sheet (edit / delete menu)
  const [actionPost, setActionPost] = useState<ForumPost | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 380)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const loadPosts = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('forum_posts')
      .select('id, user_id, type, title, content, is_anonymous, created_at')
      .eq('type', activeTab)
      .order('created_at', { ascending: false })

    if (debouncedSearch.trim()) {
      query = query.or(
        `title.ilike.%${debouncedSearch.trim()}%,content.ilike.%${debouncedSearch.trim()}%`
      )
    }

    const { data: postsData, error } = await query
    if (error) console.error('forum_posts error:', error)

    if (!postsData || postsData.length === 0) {
      setPosts([])
      setLoading(false)
      return
    }

    // Get unique user IDs that are NOT anonymous
    const visibleUserIds = [...new Set(
      postsData.filter((p) => !p.is_anonymous).map((p) => p.user_id)
    )]

    const postIds = postsData.map((p) => p.id)

    // Fetch profiles and likes in parallel
    const [{ data: profilesData }, { data: likesData }] = await Promise.all([
      visibleUserIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', visibleUserIds)
        : Promise.resolve({ data: [] }),
      supabase.from('forum_likes').select('post_id, user_id').in('post_id', postIds)
    ])

    // Create a map of user_id -> full_name
    const profileMap = new Map<string, string | null>()
    profilesData?.forEach((p) => {
      profileMap.set(p.id, p.full_name)
    })

    const enriched: ForumPost[] = postsData.map((p) => ({
      ...p,
      profiles: { full_name: profileMap.get(p.user_id) ?? null },
      likesCount: likesData?.filter((l) => l.post_id === p.id).length ?? 0,
      likedByMe: likesData?.some((l) => l.post_id === p.id && l.user_id === user.id) ?? false,
    }))

    setPosts(enriched)
    setLoading(false)
  }, [user, activeTab, debouncedSearch])

  useEffect(() => { loadPosts() }, [loadPosts])

  // ── Like ──────────────────────────────────────────────────────────────────

  const toggleLike = async (postId: string) => {
    if (!user) return
    const post = posts.find((p) => p.id === postId)
    if (!post) return

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    )

    if (post.likedByMe) {
      await supabase.from('forum_likes').delete().eq('post_id', postId).eq('user_id', user.id)
    } else {
      await supabase.from('forum_likes').insert({ post_id: postId, user_id: user.id })
    }
  }

  // ── Create / edit sheet ───────────────────────────────────────────────────

  const openCreate = () => {
    setEditingPost(null)
    setNewType('consejo')
    setNewTitle('')
    setNewContent('')
    setIsAnonymous(false)
    setShowCreate(true)
  }

  const openEdit = (post: ForumPost) => {
    setActionPost(null)
    setEditingPost(post)
    setNewType(post.type)
    setNewTitle(post.title)
    setNewContent(post.content)
    setIsAnonymous(post.is_anonymous)
    setShowCreate(true)
  }

  const closeSheet = () => {
    setShowCreate(false)
    setEditingPost(null)
    setNewTitle('')
    setNewContent('')
    setIsAnonymous(false)
  }

  const savePost = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return
    setSubmitting(true)

    if (editingPost) {
      await supabase
        .from('forum_posts')
        .update({
          type: newType,
          title: newTitle.trim(),
          content: newContent.trim(),
          is_anonymous: isAnonymous,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPost.id)
        .eq('user_id', user.id)

      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, type: newType, title: newTitle.trim(), content: newContent.trim(), is_anonymous: isAnonymous }
            : p
        )
      )
    } else {
      await supabase.from('forum_posts').insert({
        user_id: user.id,
        type: newType,
        title: newTitle.trim(),
        content: newContent.trim(),
        is_anonymous: isAnonymous,
      })
      setActiveTab(newType)
      loadPosts()
    }

    closeSheet()
    setSubmitting(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const deletePost = async (postId: string) => {
    if (!user) return
    setActionPost(null)
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    await supabase.from('forum_posts').delete().eq('id', postId).eq('user_id', user.id)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const authorName = (post: ForumPost) => {
    if (post.is_anonymous) return 'Anónima'
    if (post.user_id === user?.id) return 'Tú'
    return post.profiles?.full_name || 'Usuaria'
  }

  return (
    <div className="app-page">
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="diana-topbar">
        <button className="icon-btn" onClick={() => setMenuOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className="diana-topbar-logo" onClick={() => navigate('/home')}>Diana</button>
        <div style={{ width: 40 }} />
      </div>

      <div className="app-content forum-page-content">

        {/* Search */}
        <div className="forum-search-bar">
          <svg className="forum-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className="forum-search-input"
            placeholder="Buscar publicaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="forum-search-clear" onClick={() => setSearch('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="forum-tabs">
          <button
            className={`forum-tab${activeTab === 'consejo' ? ' active' : ''}`}
            onClick={() => setActiveTab('consejo')}
          >
            💡 Consejos
          </button>
          <button
            className={`forum-tab${activeTab === 'experiencia' ? ' active' : ''}`}
            onClick={() => setActiveTab('experiencia')}
          >
            💬 Experiencias
          </button>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="forum-skeletons">
            {[1, 2, 3].map((i) => <div key={i} className="forum-skeleton" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="forum-empty">
            <div className="forum-empty-icon">{activeTab === 'consejo' ? '💡' : '💬'}</div>
            <p className="forum-empty-text">
              {debouncedSearch ? 'Sin resultados' : 'Sé la primera en compartir'}
            </p>
            <p className="forum-empty-sub">
              {debouncedSearch
                ? 'Intenta con otras palabras'
                : `Comparte tu ${activeTab} con la comunidad`}
            </p>
          </div>
        ) : (
          <div className="forum-feed">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                className="forum-post-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045 }}
              >
                <div className="forum-post-header">
                  <span
                    className="forum-post-tag"
                    style={
                      post.type === 'consejo'
                        ? { background: '#FFF3E0', color: '#E07845' }
                        : { background: '#EEE8F8', color: '#8B6DB8' }
                    }
                  >
                    {post.type === 'consejo' ? '💡 Consejo' : '💬 Experiencia'}
                  </span>

                  {post.user_id === user?.id && (
                    <button
                      className="forum-post-menu-btn"
                      onClick={() => setActionPost(actionPost?.id === post.id ? null : post)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>
                  )}
                </div>

                <h3 className="forum-post-title">{post.title}</h3>
                <p className="forum-post-content">{post.content}</p>
                <div className="forum-post-footer">
                  <span className="forum-post-meta">
                    {authorName(post)} · {timeAgo(post.created_at)}
                  </span>
                  <motion.button
                    className={`forum-like-btn${post.likedByMe ? ' liked' : ''}`}
                    onClick={() => toggleLike(post.id)}
                    whileTap={{ scale: 0.82 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={post.likedByMe ? 'currentColor' : 'none'}>
                      <path
                        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {post.likesCount > 0 && <span>{post.likesCount}</span>}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* FAB */}
      <motion.button
        className="forum-fab"
        onClick={openCreate}
        whileTap={{ scale: 0.88 }}
        aria-label="Nueva publicación"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </motion.button>

      {/* Action sheet (edit / delete) */}
      <AnimatePresence>
        {actionPost && (
          <motion.div
            className="forum-action-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActionPost(null)}
          >
            <motion.div
              className="forum-action-sheet"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="forum-action-title" onClick={(e) => e.stopPropagation()}>
                {actionPost.title}
              </div>
              <button className="forum-action-btn" onClick={() => openEdit(actionPost)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Editar publicación
              </button>
              <button className="forum-action-btn danger" onClick={() => deletePost(actionPost.id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Eliminar publicación
              </button>
              <button className="forum-action-cancel" onClick={() => setActionPost(null)}>
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / edit sheet */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="forum-create-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) closeSheet() }}
          >
            <motion.div
              className="forum-create-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="forum-create-handle" />
              <h2 className="forum-create-title">
                {editingPost ? 'Editar publicación' : 'Nueva publicación'}
              </h2>

              <div className="forum-type-selector">
                <button
                  className={`forum-type-btn${newType === 'consejo' ? ' active' : ''}`}
                  onClick={() => setNewType('consejo')}
                >
                  💡 Consejo
                </button>
                <button
                  className={`forum-type-btn${newType === 'experiencia' ? ' active' : ''}`}
                  onClick={() => setNewType('experiencia')}
                >
                  💬 Experiencia
                </button>
              </div>

              <input
                className="forum-input"
                placeholder="Título..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={100}
              />

              <textarea
                className="forum-textarea"
                placeholder={
                  newType === 'consejo'
                    ? 'Comparte tu consejo con la comunidad...'
                    : 'Comparte tu experiencia con la comunidad...'
                }
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                maxLength={800}
              />

              <div className="forum-anon-row">
                <div>
                  <div className="forum-anon-label">Publicar como anónima</div>
                  <div className="forum-anon-sub">Tu nombre no será visible</div>
                </div>
                <button
                  className={`forum-toggle${isAnonymous ? ' on' : ''}`}
                  onClick={() => setIsAnonymous((v) => !v)}
                >
                  <div className="forum-toggle-knob" />
                </button>
              </div>

              <button
                className="forum-submit-btn"
                onClick={savePost}
                disabled={!newTitle.trim() || !newContent.trim() || submitting}
              >
                {submitting
                  ? (editingPost ? 'Guardando...' : 'Publicando...')
                  : (editingPost ? 'Guardar cambios' : 'Publicar')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
