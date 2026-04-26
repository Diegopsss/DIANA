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
  const [showCreate, setShowCreate] = useState(false)
  const [newType, setNewType] = useState<PostType>('consejo')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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

    const postIds = postsData.map((p) => p.id)
    const visibleUserIds = [...new Set(
      postsData.filter((p) => !p.is_anonymous).map((p) => p.user_id)
    )]

    const [{ data: likesData }, { data: profilesData }] = await Promise.all([
      supabase.from('forum_likes').select('post_id, user_id').in('post_id', postIds),
      visibleUserIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', visibleUserIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p.full_name]))

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

  const createPost = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return
    setSubmitting(true)
    await supabase.from('forum_posts').insert({
      user_id: user.id,
      type: newType,
      title: newTitle.trim(),
      content: newContent.trim(),
      is_anonymous: isAnonymous,
    })
    setShowCreate(false)
    setNewTitle('')
    setNewContent('')
    setIsAnonymous(false)
    setSubmitting(false)
    setActiveTab(newType)
    loadPosts()
  }

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
        onClick={() => setShowCreate(true)}
        whileTap={{ scale: 0.88 }}
        aria-label="Nueva publicación"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </motion.button>

      {/* Create sheet */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="forum-create-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
          >
            <motion.div
              className="forum-create-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="forum-create-handle" />
              <h2 className="forum-create-title">Nueva publicación</h2>

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
                onClick={createPost}
                disabled={!newTitle.trim() || !newContent.trim() || submitting}
              >
                {submitting ? 'Publicando...' : 'Publicar'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
