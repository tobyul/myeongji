import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, categories, safeHtml, themeOptions } from './api.js'

const routeNow = () => `${location.hash || '#/'}`.slice(1) || '/'
const icon = { '음식/카페': '☕', '생활/편의': '🧺', '교육/건강': '🌿', '기타': '✨' }
const date = (value) => value ? new Date(value).toLocaleDateString('ko-KR') : ''
const safeSiteUrl = (value) => /^https?:\/\//i.test(value || '') ? value : ''
const escapeAttribute = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const readAuth = () => ({ token: localStorage.getItem('auth_token'), username: localStorage.getItem('username'), role: localStorage.getItem('role') || 'user' })

function App() {
  const [route, setRoute] = useState(routeNow)
  const [auth, setAuth] = useState(readAuth)
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'spring')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const change = () => setRoute(routeNow())
    addEventListener('hashchange', change)
    return () => removeEventListener('hashchange', change)
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const notify = useCallback((message) => setToast(message), [])
  const go = useCallback((path) => { location.hash = path }, [])
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    setAuth(readAuth())
    go('/')
  }, [go])

  async function changeTheme(value) {
    setTheme(value)
    document.documentElement.dataset.theme = value
    localStorage.setItem('current_theme', value)
    try {
      await api('/api/theme', { method: 'POST', body: JSON.stringify({ theme: value }) })
      notify('테마를 저장했어요.')
    } catch (error) { notify(`화면에는 적용했지만 저장하지 못했어요: ${error.message}`) }
  }

  const page = useMemo(() => {
    if (route === '/') return <Home />
    if (route === '/login') return <Login go={go} notify={notify} onLogin={() => setAuth(readAuth())} />
    if (route === '/register') return <Register />
    if (route === '/dashboard') return <Dashboard auth={auth} go={go} />
    if (route === '/stores') return <StoreList admin go={go} />
    if (route === '/my-stores') return <StoreList go={go} />
    if (route === '/events') return <EventList admin go={go} />
    if (route === '/my-events') return <EventList go={go} />
    if (route === '/users') return <Users notify={notify} />
    if (route === '/store/new' || route.startsWith('/store/')) return <StoreForm route={route} auth={auth} go={go} notify={notify} />
    if (route === '/event/new' || route.startsWith('/event/')) return <EventForm route={route} auth={auth} go={go} notify={notify} />
    return <Home />
  }, [route, auth, go, notify])

  return <>
    <Header auth={auth} theme={theme} onTheme={changeTheme} onLogout={logout} />
    <main className="page-shell">{page}</main>
    <footer className="footer"><a href="#/">이웃점빵</a><span>명지 국제자유방 · 우리 동네 가게를 응원합니다</span><a href="#/login">관리자</a></footer>
    {toast && <div className="toast" role="status">{toast}</div>}
  </>
}

function Header({ auth, theme, onTheme, onLogout }) {
  return <header className="topbar"><a href="#/" className="brand"><img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="" /><span>이웃점빵<small>동네 가게 안내</small></span></a><nav className="nav-links"><a href="#/">가게 찾기</a>{auth.token && <a href="#/dashboard">관리</a>}</nav><div className="nav-actions">{auth.role === 'admin' && <select aria-label="테마 선택" value={theme} onChange={e => onTheme(e.target.value)}>{themeOptions.map(t => <option key={t} value={t}>{({ spring:'봄',summer:'여름',autumn:'가을',winter:'겨울',dark:'다크' })[t]} 테마</option>)}</select>}{auth.token ? <><span className="user-label">{auth.username}</span><button className="button quiet small" onClick={onLogout}>로그아웃</button></> : <a className="button quiet small" href="#/login">로그인</a>}</div></header>
}

function Home() {
  const [stores, setStores] = useState([]), [events, setEvents] = useState([]), [recent, setRecent] = useState([])
  const [category, setCategory] = useState('전체'), [term, setTerm] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [stats, setStats] = useState(null), [page, setPage] = useState(1)
  const fetchStores = useCallback(async (cat = category, query = term) => {
    setLoading(true); setError(''); setPage(1)
    const path = query.trim() ? `/api/stores/search?term=${encodeURIComponent(query.trim())}` : cat === '전체' ? '/api/stores' : `/api/stores/category?name=${encodeURIComponent(cat)}`
    try { setStores(await api(path)) } catch (e) { setError(e.message); setStores([]) } finally { setLoading(false) }
  }, [category, term])
  useEffect(() => {
    fetchStores('전체', '')
    api('/api/stores/events').then(setEvents).catch(() => setEvents([]))
    api('/api/stores/recent?limit=3').then(setRecent).catch(() => setRecent([]))
    api('/api/visitor/stats').then(setStats).catch(() => {})
    const sessionKey = 'visitorSessionId'
    const last = Number(sessionStorage.getItem('lastActivityTime') || 0)
    let session = sessionStorage.getItem(sessionKey)
    if (!session || Date.now() - last > 30 * 60 * 1000) {
      session = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
      sessionStorage.setItem(sessionKey, session)
      api('/api/visitor/log', { method: 'POST', body: JSON.stringify({ sessionId: session, pageUrl: location.href, userAgent: navigator.userAgent }) }).then(() => api('/api/visitor/stats').then(setStats)).catch(() => {})
    }
    sessionStorage.setItem('lastActivityTime', String(Date.now()))
  }, [])
  const pages = Math.max(1, Math.ceil(stores.length / 12))
  const shown = stores.slice((page - 1) * 12, page * 12)
  return <>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">NEIGHBORHOOD FINDS</span><h1>우리 동네 가게를<br /><em>가까이에서</em> 만나보세요.</h1><p>명지 이웃들의 진짜 가게와 혜택을 모았어요.</p><form className="search" onSubmit={e => { e.preventDefault(); fetchStores(category, term) }}><input value={term} onChange={e => setTerm(e.target.value)} placeholder="가게 이름이나 동네 검색" aria-label="가게 검색" /><button className="button primary">검색 <span>↗</span></button></form></div><div className="hero-art"><div className="sun"></div><div className="art-card art-card-back">이웃 가게를 둘러봐요 <span>♡</span></div><div className="art-card art-card-main"><span className="art-icon">🥐</span><div><b>우리 동네의 발견</b><small>가까운 곳에서 만나는 이웃 가게</small></div><span className="art-arrow">↗</span></div><div className="art-sticker">LOCAL<br />LOVE</div></div></section>
    <section className="section"><div className="section-head"><div><span className="eyebrow">FIND YOUR FAVORITE</span><h2>동네 가게 둘러보기</h2><p>분야별로 살펴보고, 마음에 드는 가게를 찾아보세요.</p></div><span className="result-count">{stores.length}개의 점빵</span></div><div className="filters"><button className={category === '전체' ? 'filter active' : 'filter'} onClick={() => { setCategory('전체'); fetchStores('전체', term) }}>모두 보기</button>{categories.map(c => <button key={c} className={category === c ? 'filter active' : 'filter'} onClick={() => { setCategory(c); fetchStores(c, term) }}>{icon[c]} {c}</button>)}</div>
      {loading ? <div className="empty">가게를 불러오는 중이에요…</div> : error ? <div className="empty error"><b>가게 목록을 불러오지 못했어요</b><span>{error}</span><button className="button quiet" onClick={() => fetchStores()}>다시 시도</button></div> : shown.length ? <div className="store-grid">{shown.map(s => <StoreCard key={s._id} store={s} />)}</div> : <div className="empty"><span className="empty-icon">⌕</span><b>아직 가게가 없어요</b><span>다른 검색어나 카테고리도 살펴보세요.</span></div>}
      {pages > 1 && <div className="pagination">{Array.from({ length: pages }, (_, i) => <button key={i} className={page === i + 1 ? 'page active' : 'page'} onClick={() => { setPage(i + 1); scrollTo({ top: 380, behavior: 'smooth' }) }}>{i + 1}</button>)}</div>}
    </section>
    {!!events.length && <section className="section tinted"><div className="section-head"><div><span className="eyebrow">SPECIAL FOR NEIGHBORS</span><h2>지금 진행 중인 혜택</h2><p>기간 한정 이벤트를 놓치지 마세요.</p></div><a href="#/login" className="text-link">가게 등록 안내 ↗</a></div><div className="store-grid">{events.slice(0, 3).map(e => <EventCard key={`${e._id}-${e.event_id}`} event={e} />)}</div></section>}
    {!!recent.length && <section className="section"><div className="section-head"><div><span className="eyebrow">JUST JOINED</span><h2>새로 만난 이웃점빵</h2><p>새롭게 등록된 가게를 소개해요.</p></div></div><div className="store-grid">{recent.slice(0, 3).map(s => <StoreCard key={s._id} store={s} />)}</div></section>}
    <section className="stats-strip"><div><span>동네와 함께한 방문</span><b>{stats?.total_visits ?? '—'}</b><small>누적 방문</small></div><div><span>오늘의 이웃</span><b>{stats?.unique_visits ?? '—'}</b><small>오늘 방문</small></div><div className="stats-note">좋은 가게를 발견했다면<br /><strong>이웃에게도 알려주세요.</strong></div></section>
  </>
}

function StoreCard({ store }) {
  const [open, setOpen] = useState(false)
  const thumb = store.description?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]?.replace('/uploads/', '/uploads/thumb/')
  return <article className={`store-card ${open ? 'expanded' : ''}`}><button className="store-summary" onClick={() => setOpen(!open)} aria-expanded={open}><span className={`store-photo c-${categories.indexOf(store.category)}`}>{thumb ? <img className="store-thumb" src={thumb} alt={`${store.name} 사진`} loading="lazy" /> : <span aria-hidden="true">{icon[store.category] || '✦'}</span>}<span className="store-photo-label">{store.category || '이웃 가게'}</span></span><span className="store-title"><b>{store.name}</b><span className="store-owner">{store.nickname}</span>{store.benefit && <span className="store-benefit"><b>이웃 혜택</b> {store.benefit}</span>}{store.address && <span className="store-address">⌖ {store.address}</span>}</span><span className="store-open-label">{open ? '닫기 −' : '자세히 +'}</span></button>{open && <div className="store-detail">{store.description && <div className="rich-content" dangerouslySetInnerHTML={{ __html: safeHtml(store.description) }} />}{store.benefit && <p><b>이웃 혜택</b>{store.benefit}</p>}{store.code && <p><b>혜택 코드</b>{store.code}</p>}{store.contact && <p><b>연락처</b><a href={`tel:${store.contact}`}>{store.contact}</a></p>}{safeSiteUrl(store.site_url) && <p><b>웹사이트</b><a target="_blank" rel="noreferrer" href={safeSiteUrl(store.site_url)}>{store.site_url}</a></p>}{store.address && <p><b>주소</b>{store.address} <a target="_blank" rel="noreferrer" href={`https://map.kakao.com/link/search/${encodeURIComponent(store.address)}`}>지도 보기 ↗</a></p>}</div>}</article>
}

function EventCard({ event }) {
  return <article className="event-card"><div className="event-top"><span className="event-badge">NEIGHBOR EVENT</span><span>↗</span></div><h3>{event.name}</h3><small>{event.nickname}</small>{event.event_content && <div className="rich-content event-copy" dangerouslySetInnerHTML={{ __html: safeHtml(event.event_content) }} />}<div className="event-date">{date(event.start_date)} — {date(event.end_date)}</div>{event.benefit && <div className="benefit">{event.benefit}</div>}</article>
}

function PageTitle({ eyebrow, title, text, action }) { return <div className="page-title-row"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</div> }
function Login({ go, notify, onLogin }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); const data = new FormData(e.currentTarget); try { const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: data.get('username'), password: data.get('password') }) }); localStorage.setItem('auth_token', result.token); localStorage.setItem('username', result.username); localStorage.setItem('role', result.role); onLogin(); go('/dashboard') } catch (err) { setError(err.message); notify('로그인할 수 없습니다.') } finally { setBusy(false) } }
  return <div className="auth-layout"><div className="auth-aside"><span className="eyebrow">WELCOME BACK</span><h1>이웃의 가게를<br />함께 키워가요.</h1><p>가게와 이벤트 정보를 편리하게 관리할 수 있어요.</p><span className="auth-emoji">🏡</span></div><form className="form-card auth-card" onSubmit={submit}><span className="eyebrow">MEMBER ACCESS</span><h2>로그인</h2><Field label="아이디"><input name="username" autoComplete="username" required /></Field><Field label="비밀번호"><input name="password" type="password" autoComplete="current-password" required /></Field>{error && <p className="form-error">{error}</p>}<button className="button primary wide" disabled={busy}>{busy ? '확인 중…' : '로그인하기'}</button><p className="form-note">아직 계정이 없으신가요? <a href="#/register">가입 신청</a></p></form></div>
}
function Register() {
  const [error, setError] = useState(''), [success, setSuccess] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e) { e.preventDefault(); setError(''); setSuccess(''); const d = new FormData(e.currentTarget); if (d.get('password') !== d.get('confirm')) { setError('비밀번호가 일치하지 않습니다.'); return } setBusy(true); try { const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username: d.get('username'), password: d.get('password'), intro: d.get('intro') }) }); setSuccess(r.message || '가입 신청이 완료되었습니다. 관리자 승인 후 이용할 수 있어요.'); e.currentTarget.reset() } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <div className="form-page"><div className="form-card"><span className="eyebrow">JOIN YOUR NEIGHBORS</span><h1>회원가입</h1><p className="muted">점빵을 운영하거나 이웃으로 함께해 주세요.</p><form onSubmit={submit}><Field label="아이디"><input name="username" minLength="4" maxLength="50" required /></Field><Field label="비밀번호"><input name="password" type="password" minLength="6" required /></Field><Field label="비밀번호 확인"><input name="confirm" type="password" required /></Field><Field label="간단한 소개"><textarea name="intro" rows="3" maxLength="500" placeholder="예: OO점빵 사장입니다." /></Field>{error && <p className="form-error">{error}</p>}{success && <p className="form-success">{success}</p>}<button className="button primary wide" disabled={busy}>{busy ? '신청 중…' : '가입 신청'}</button></form><p className="form-note">이미 회원이신가요? <a href="#/login">로그인</a></p></div></div>
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
function HtmlEditor({ name, initialValue = '', placeholder }) {
  const editor = useRef(null), hidden = useRef(null), picker = useRef(null)
  const [uploading, setUploading] = useState(false), [error, setError] = useState('')
  const format = (command, value) => { editor.current?.focus(); document.execCommand(command, false, value); if (hidden.current) hidden.current.value = editor.current?.innerHTML || '' }
  async function upload(file) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true); setError('')
    try {
      const body = new FormData(); body.append('image', file)
      const result = await api('/api/upload/image', { method: 'POST', body })
      const src = safeSiteUrl(result.url)
      if (!src) throw new Error('서버가 올바른 이미지 주소를 반환하지 않았습니다.')
      editor.current?.focus()
      document.execCommand('insertHTML', false, `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(file.name)}">`)
      if (hidden.current) hidden.current.value = editor.current?.innerHTML || ''
    } catch (e) { setError(`이미지를 올리지 못했어요: ${e.message}`) } finally { setUploading(false); if (picker.current) picker.current.value = '' }
  }
  return <div className="rich-editor-wrap"><div className="editor-toolbar"><button type="button" onClick={() => format('bold') } aria-label="굵게"><b>B</b></button><button type="button" onClick={() => format('italic')} aria-label="기울임"><i>I</i></button><button type="button" onClick={() => format('insertUnorderedList')} aria-label="목록">• 목록</button><button type="button" onClick={() => format('formatBlock', 'blockquote')} aria-label="인용">인용</button><button type="button" onClick={() => picker.current?.click()} disabled={uploading}>{uploading ? '이미지 업로드 중…' : '이미지 추가'}</button><input ref={picker} className="file-picker" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => upload(e.target.files?.[0])} /></div><div ref={editor} className="rich-editor" contentEditable role="textbox" aria-multiline="true" data-placeholder={placeholder} suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: safeHtml(initialValue) }} onInput={e => { if (hidden.current) hidden.current.value = e.currentTarget.innerHTML }} /><input ref={hidden} type="hidden" name={name} defaultValue={initialValue} />{error && <small className="form-error">{error}</small>}</div>
}
function Dashboard({ auth, go }) {
  const links = auth.role === 'admin' ? [['가게 목록', '모든 점빵을 관리해요', '🏪', '/stores'], ['이벤트 관리', '전체 이벤트를 살펴봐요', '🎉', '/events'], ['회원 승인', '가입과 가게 권한을 관리해요', '👋', '/users']] : [['내 점빵', '내 가게 정보를 관리해요', '🏪', '/my-stores'], ['내 이벤트', '가게 이벤트를 관리해요', '🎉', '/my-events']]
  return <><PageTitle eyebrow="MY NEIGHBORHOOD" title={`${auth.username || '이웃'}님, 반가워요`} text="이웃점빵 운영 메뉴를 선택해 주세요." /><div className="dashboard-grid">{links.map(([t,d,i,path]) => <button className="dashboard-card" key={path} onClick={() => go(path)}><span>{i}</span><b>{t}</b><small>{d}</small><i>↗</i></button>)}</div></>
}
function StoreList({ admin = false, go }) {
  const [rows, setRows] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const load = useCallback(() => { setLoading(true); api(admin ? '/api/storesAll' : '/api/my/stores').then(setRows).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [admin])
  useEffect(load, [load])
  return <><PageTitle eyebrow={admin ? 'ADMIN / STORES' : 'MY STORES'} title={admin ? '가게 관리' : '내 점빵'} text="가게 정보를 확인하고 수정할 수 있어요." action={admin && <button className="button primary" onClick={() => go('/store/new')}>＋ 점빵 등록</button>} />{error ? <div className="empty error">{error}</div> : loading ? <div className="empty">불러오는 중…</div> : !rows.length ? <div className="empty">등록된 가게가 없어요.</div> : <div className="table-wrap"><table><thead><tr><th>가게명</th><th>분야</th><th>운영자</th>{admin && <th>공개</th>}<th></th></tr></thead><tbody>{rows.map(s => <tr key={s._id}><td><b>{s.name}</b></td><td>{s.category}</td><td>{s.nickname}</td>{admin && <td>{s.isUsed}</td>}<td><button className="button quiet small" onClick={() => go(`/store/${s._id}`)}>수정 ↗</button></td></tr>)}</tbody></table></div>}</>
}
function EventList({ admin = false, go }) {
  const [rows, setRows] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const load = useCallback(() => { setLoading(true); api(admin ? '/api/events' : '/api/my/events').then(setRows).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [admin])
  useEffect(load, [load])
  return <><PageTitle eyebrow={admin ? 'ADMIN / EVENTS' : 'MY EVENTS'} title={admin ? '이벤트 관리' : '내 이벤트'} text="이웃과 나눌 행사와 혜택을 관리해요." action={<button className="button primary" onClick={() => go('/event/new')}>＋ 이벤트 등록</button>} />{error ? <div className="empty error">{error}</div> : loading ? <div className="empty">불러오는 중…</div> : !rows.length ? <div className="empty">등록된 이벤트가 없어요.</div> : <div className="table-wrap"><table><thead><tr><th>가게</th><th>기간</th><th>상태</th><th></th></tr></thead><tbody>{rows.map(e => <tr key={e.event_id}><td><b>{e.store_name || `가게 #${e.store_id}`}</b></td><td>{date(e.start_date)} — {date(e.end_date)}</td><td><span className="status">{e.event_status || '등록됨'}</span></td><td><button className="button quiet small" onClick={() => go(`/event/${e.event_id}`)}>수정 ↗</button></td></tr>)}</tbody></table></div>}</>
}
function Users({ notify }) {
  const [rows, setRows] = useState([]), [error, setError] = useState('')
  const load = useCallback(() => api('/api/admin/users/all').then(setRows).catch(e => setError(e.message)), [])
  useEffect(load, [load])
  async function setStatus(id, status) { try { await api(`/api/admin/users/${id}/approve`, { method: 'POST', body: JSON.stringify({ status }) }); notify('회원 상태를 변경했어요.'); load() } catch (e) { notify(e.message) } }
  return <><PageTitle eyebrow="ADMIN / MEMBERS" title="회원 관리" text="가입 신청을 확인하고 회원 상태를 관리해요." />{error ? <div className="empty error">{error}</div> : <div className="table-wrap"><table><thead><tr><th>아이디</th><th>소개</th><th>상태</th><th>가입일</th><th>처리</th></tr></thead><tbody>{rows.map(u => <tr key={u.id}><td><b>{u.username}</b></td><td>{u.intro}</td><td><span className="status">{u.status}</span></td><td>{date(u.created_at)}</td><td className="button-row"><button className="button quiet small" onClick={() => setStatus(u.id, 'approved')}>승인</button><button className="button quiet small" onClick={() => setStatus(u.id, 'rejected')}>반려</button><button className="button quiet small" onClick={() => setStatus(u.id, 'suspended')}>정지</button></td></tr>)}</tbody></table></div>}</>
}
function StoreForm({ route, auth, go, notify }) {
  const id = route === '/store/new' ? null : route.split('/')[2]
  const [initial, setInitial] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { if (!id) return; api(`/api/stores/${id}`).then(setInitial).catch(e => setError(e.message)) }, [id])
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); const d = new FormData(e.currentTarget); const payload = Object.fromEntries(['category','name','nickname','description','benefit','code','contact','address','site_url','isUsed'].map(k => [k, d.get(k) || ''])); if (auth.role !== 'admin') delete payload.isUsed; try { await api(id ? `/api/stores/${id}` : '/api/stores', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }); notify('점빵 정보를 저장했어요.'); go(auth.role === 'admin' ? '/stores' : '/my-stores') } catch (e) { setError(e.message) } finally { setBusy(false) } }
  return <div className="form-page"><div className="form-card wide-form"><span className="eyebrow">STORE PROFILE</span><h1>{id ? '점빵 정보 수정' : '새 점빵 등록'}</h1>{error && <p className="form-error">{error}</p>}{id && !initial ? <div className="empty">가게 정보를 불러오는 중…</div> : <form onSubmit={submit}><div className="form-grid"><Field label="분야"><select name="category" defaultValue={initial?.category || categories[0]}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field><Field label="가게명"><input name="name" defaultValue={initial?.name} required /></Field><Field label="운영자 / 별칭"><input name="nickname" defaultValue={initial?.nickname} required /></Field><Field label="연락처"><input name="contact" defaultValue={initial?.contact} /></Field><Field label="웹사이트"><input name="site_url" type="url" defaultValue={initial?.site_url} placeholder="https://" /></Field><Field label="주소"><input name="address" defaultValue={initial?.address} /></Field><Field label="이웃 혜택"><textarea name="benefit" rows="2" defaultValue={initial?.benefit} /></Field><Field label="혜택 코드"><input name="code" defaultValue={initial?.code} /></Field><Field label="가게 소개"><HtmlEditor name="description" initialValue={initial?.description} placeholder="가게를 소개해 주세요." /></Field>{auth.role === 'admin' && <Field label="공개 상태"><select name="isUsed" defaultValue={initial?.isUsed || 'Y'}><option value="Y">공개</option><option value="N">숨김</option></select></Field>}</div><p className="form-note">공개 화면에는 허용된 HTML 태그만 표시됩니다.</p><div className="form-actions"><button type="button" className="button quiet" onClick={() => go(auth.role === 'admin' ? '/stores' : '/my-stores')}>취소</button><button className="button primary" disabled={busy}>{busy ? '저장 중…' : '저장하기'}</button></div></form>}</div></div>
}
function EventForm({ route, auth, go, notify }) {
  const id = route === '/event/new' ? null : route.split('/')[2]
  const [event, setEvent] = useState(null), [stores, setStores] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { const listPath = auth.role === 'admin' ? '/api/storesAll' : '/api/my/stores'; api(listPath).then(setStores).catch(e => setError(e.message)); if (id) api(`/api/events/${id}`).then(setEvent).catch(e => setError(e.message)) }, [id, auth.role])
  async function submit(e) { e.preventDefault(); setBusy(true); const d = new FormData(e.currentTarget); const payload = Object.fromEntries(['store_id','event_content','start_date','end_date'].map(k => [k, d.get(k)])); try { await api(id ? `/api/events/${id}` : '/api/events', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }); notify('이벤트를 저장했어요.'); go(auth.role === 'admin' ? '/events' : '/my-events') } catch (e) { setError(e.message) } finally { setBusy(false) } }
  return <div className="form-page"><div className="form-card wide-form"><span className="eyebrow">NEIGHBOR EVENT</span><h1>{id ? '이벤트 수정' : '이벤트 등록'}</h1>{error && <p className="form-error">{error}</p>}{id && !event ? <div className="empty">이벤트를 불러오는 중…</div> : <form onSubmit={submit}><div className="form-grid"><Field label="가게"><select name="store_id" defaultValue={event?.store_id || ''} required><option value="">가게를 선택하세요</option>{stores.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field><Field label="시작 일시"><input type="datetime-local" name="start_date" defaultValue={event?.start_date?.slice(0,16)} required /></Field><Field label="종료 일시"><input type="datetime-local" name="end_date" defaultValue={event?.end_date?.slice(0,16)} required /></Field><Field label="이벤트 내용"><HtmlEditor name="event_content" initialValue={event?.event_content} placeholder="이벤트 내용을 입력하세요." /></Field></div><div className="form-actions"><button type="button" className="button quiet" onClick={() => go(auth.role === 'admin' ? '/events' : '/my-events')}>취소</button><button className="button primary" disabled={busy}>{busy ? '저장 중…' : '저장하기'}</button></div></form>}</div></div>
}

export default App
