import { useState, useRef, useEffect } from 'react'
import Toast from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useAutoSave } from '../hooks/useAutoSave'
import ExportOverlay from '../components/ui/ExportOverlay'
import PageActionBar from '../components/ui/PageActionBar'
import { useExport } from '../hooks/useExport'
import PreviewModal from '../components/ui/PreviewModal'
import { checkAndImportFromUrl, generateShareUrl } from '../hooks/useUrlImport'
import ShareModal from '../components/ui/ShareModal'

/* ── Imagens (substituir pelos arquivos reais em src/assets/images/) ── */
import tesouImg from '../assets/images/tesou.jpg'
import facImg   from '../assets/images/fac.jpg'
import vidaImg  from '../assets/images/vida.jpg'

const LS_KEY = 'viministerio_v2'

const getInitialData = () => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/* ─── Seção colapsável ────────────────────────────────── */
function Section({ id, className, headerClass, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`editor-section ${className}${open ? '' : ' collapsed'}`} id={id}>
      <div
        className={`editor-section-header ${headerClass}`}
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div className="sec-icon" />
        <span className="sec-name">{title}</span>
        <span className="chevron" aria-hidden="true">▾</span>
      </div>
      {open && <div className="editor-section-body">{children}</div>}
    </div>
  )
}

/* ─── Campo simples ───────────────────────────────────── */
function Field({ label, id, placeholder, value, onChange, type = 'text', min, max }) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <input
        type={type} id={id} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)}
        min={min} max={max}
      />
    </div>
  )
}

/* ─── Card dinâmico Faça seu Melhor ──────────────────── */
function FacCard({ item, idx, onUpdate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const tipos = ['Iniciando Conversas','Cultivando o Interesse','Explicando suas Crenças','Fazendo Discípulos','Discurso']
  const tempos = ['1 min','2 min','3 min','4 min','5 min','6 min','7 min','8 min']
  return (
    <div
      className="dyn-card"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={e => { e.preventDefault(); onDrop() }}
    >
      <div className="dyn-card-header">
        <span className="drag-handle" aria-hidden="true">⠿</span>
        <span className="card-idx">Parte do Ministério — {idx}</span>
        <button className="btn-remove" onClick={onRemove}>✕ Remover</button>
      </div>
      <div className="field-row">
        <div className="field-group">
          <label>Tipo</label>
          <select value={item.tipo} onChange={e => onUpdate({ ...item, tipo: e.target.value })}>
            {tipos.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="field-group narrow">
          <label>Tempo</label>
          <select value={item.tempo} onChange={e => onUpdate({ ...item, tempo: e.target.value })}>
            {tempos.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field-group">
          <label>Estudante</label>
          <input type="text" placeholder="Nome" value={item.est}
            onChange={e => onUpdate({ ...item, est: e.target.value })} />
        </div>
        <div className="field-group">
          <label>Ajudante</label>
          <input type="text" placeholder="Nome" value={item.aju}
            onChange={e => onUpdate({ ...item, aju: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

/* ─── Card dinâmico Nossa Vida Cristã ────────────────── */
function VidaCard({ item, idx, onUpdate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const tempos = ['4 min','5 min','6 min','7 min','8 min','9 min','10 min','15 min']
  return (
    <div
      className="dyn-card"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={e => { e.preventDefault(); onDrop() }}
    >
      <div className="dyn-card-header">
        <span className="drag-handle" aria-hidden="true">⠿</span>
        <span className="card-idx">Parte da Vida Cristã — {idx}</span>
        <button className="btn-remove" onClick={onRemove}>✕ Remover</button>
      </div>
      <div className="field-row">
        <div className="field-group">
          <label>Tema</label>
          <input type="text" placeholder="Título" value={item.tema}
            onChange={e => onUpdate({ ...item, tema: e.target.value })} />
        </div>
        <div className="field-group narrow">
          <label>Tempo</label>
          <select value={item.tempo} onChange={e => onUpdate({ ...item, tempo: e.target.value })}>
            {tempos.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="field-group">
        <label>Responsável</label>
        <input type="text" placeholder="Nome" value={item.resp}
          onChange={e => onUpdate({ ...item, resp: e.target.value })} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function VidaMinisterio() {
  const toastRef        = useRef()
  const previewRef      = useRef()
  const skipAutoSaveRef = useRef(false)

  const importedRef = useRef(false)
  if (!importedRef.current) {
    if (checkAndImportFromUrl(LS_KEY)) {
      importedRef.current = true
    }
  }

  const initialData = getInitialData()

  /* ── Estado geral ────────────────────────── */
  const [unsaved,          setUnsaved]          = useState(false)
  const [overlay,          setOverlay]          = useState({ visible: false, msg: '' })
  const [confirmOpen,      setConfirmOpen]      = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [congregacao, setCongregacao] = useState(initialData?.congregacao || '')
  const [semana,      setSemana]      = useState(initialData?.semana || '')
  const [presidente,  setPresidente]  = useState(initialData?.presidente || '')
  const [oracao,      setOracao]      = useState(initialData?.oracao || '')
  const [cantico1,    setCantico1]    = useState(initialData?.cantico1 || '')
  const [visitaSS,    setVisitaSS]    = useState(!!initialData?.visitaSS)

  /* Tesouros */
  const [tes1Tema, setTes1Tema] = useState(initialData?.tes1Tema || '')
  const [tes1Resp, setTes1Resp] = useState(initialData?.tes1Resp || '')
  const [tes2Resp, setTes2Resp] = useState(initialData?.tes2Resp || '')
  const [tes3Est,  setTes3Est]  = useState(initialData?.tes3Est || '')

  /* Faça seu Melhor */
  const [facItems, setFacItems] = useState(initialData?.facItems || [
    { id: 1, tipo: 'Iniciando Conversas', tempo: '1 min', est: '', aju: '' }
  ])
  const facSeedRef = useRef(initialData?._facSeed || (initialData?.facItems ? 0 : 1))
  const facDragSrc = useRef(null)

  /* Nossa Vida Cristã */
  const [cantico2,    setCantico2]    = useState(initialData?.cantico2 || '')
  const [vidaItems,   setVidaItems]   = useState(initialData?.vidaItems || [
    { id: 1, tema: '', tempo: '5 min', resp: '' }
  ])
  const [ebcDir,      setEbcDir]      = useState(initialData?.ebcDir || '')
  const [ebcLei,      setEbcLei]      = useState(initialData?.ebcLei || '')
  const [vssTema,     setVssTema]     = useState(initialData?.vssTema || '')
  const [vssResp,     setVssResp]     = useState(initialData?.vssResp || '')
  const [vssTempo,    setVssTempo]    = useState(initialData?.vssTempo || '30 min')
  const vidaSeedRef = useRef(initialData?._vidaSeed || (initialData?.vidaItems ? 0 : 1))
  const vidaDragSrc = useRef(null)

  /* Encerramento */
  const [cantico3,    setCantico3]    = useState(initialData?.cantico3 || '')
  const [oracaoFinal, setOracaoFinal] = useState(initialData?.oracaoFinal || '')

  const [showPreview, setShowPreview] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (importedRef.current) {
      toastRef.current?.show('📂 Dados importados via link!', 'info')
    }
  }, [])

  const mark = () => setUnsaved(true)

  /* ── Wrappers de setter que marcam unsaved ── */
  const set = fn => v => { fn(v); mark() }

  /* ── Export hook ─────────────────────────── */
  const { exportPDF, exportIMG, printPreview, openPreview } = useExport(previewRef, {
    onStart: msg => setOverlay({ visible: true, msg }),
    onEnd:   (msg, type) => {
      setOverlay({ visible: false, msg: '' })
      toastRef.current?.show(msg, type)
    },
    onError: msg => toastRef.current?.show(msg, 'error'),
    onOpenPreview: () => setShowPreview(true),
    filename: 'vida-e-ministerio',
  })

  /* ── Salvar / Carregar ───────────────────── */
  function saveData() {
    const d = {
      congregacao, semana, presidente, oracao, cantico1, visitaSS,
      tes1Tema, tes1Resp, tes2Resp, tes3Est,
      cantico2, facItems, ebcDir, ebcLei, vssTema, vssResp, vssTempo,
      vidaItems, cantico3, oracaoFinal,
      _facSeed: facSeedRef.current, _vidaSeed: vidaSeedRef.current,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(d))
    setUnsaved(false)
    toastRef.current?.show('✔ Dados salvos com sucesso!', 'success')
  }

  /* Auto-save silencioso — sem toast */
  function saveDataSilent() {
    if (skipAutoSaveRef.current) { skipAutoSaveRef.current = false; return }
    if (skipAutoSaveRef.current) {
      localStorage.removeItem(LS_KEY)
      skipAutoSaveRef.current = false
      setUnsaved(false)
      return
    }
    const d = {
      congregacao, semana, presidente, oracao, cantico1, visitaSS,
      tes1Tema, tes1Resp, tes2Resp, tes3Est,
      cantico2, facItems, ebcDir, ebcLei, vssTema, vssResp, vssTempo,
      vidaItems, cantico3, oracaoFinal,
      _facSeed: facSeedRef.current, _vidaSeed: vidaSeedRef.current,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(d))
    setUnsaved(false)
  }

  function loadData() {
    if (unsaved) { setConfirmOpen(true); return }
    loadDataConfirmed()
  }
  function loadDataConfirmed() {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) { toastRef.current?.show('Nenhum dado salvo encontrado.', 'warning'); return }
    const d = JSON.parse(raw)
    setCongregacao(d.congregacao || '')
    setSemana(d.semana || '')
    setPresidente(d.presidente || '')
    setOracao(d.oracao || '')
    setCantico1(d.cantico1 || '')
    setVisitaSS(!!d.visitaSS)
    setTes1Tema(d.tes1Tema || '')
    setTes1Resp(d.tes1Resp || '')
    setTes2Resp(d.tes2Resp || '')
    setTes3Est(d.tes3Est || '')
    setCantico2(d.cantico2 || '')
    setFacItems(d.facItems || [])
    setEbcDir(d.ebcDir || '')
    setEbcLei(d.ebcLei || '')
    setVssTema(d.vssTema || '')
    setVssResp(d.vssResp || '')
    setVssTempo(d.vssTempo || '30 min')
    setVidaItems(d.vidaItems || [])
    setCantico3(d.cantico3 || '')
    setOracaoFinal(d.oracaoFinal || '')
    facSeedRef.current  = d._facSeed  || 0
    vidaSeedRef.current = d._vidaSeed || 0
    setUnsaved(false)
    toastRef.current?.show('📂 Dados carregados!', 'info')
  }

  function limparFormulario() {
    skipAutoSaveRef.current = true
    localStorage.removeItem(LS_KEY)
    setCongregacao('')
    setSemana('')
    setPresidente('')
    setOracao('')
    setCantico1('')
    setVisitaSS(false)
    setTes1Tema('')
    setTes1Resp('')
    setTes2Resp('')
    setTes3Est('')
    setCantico2('')
    setFacItems([])
    setEbcDir('')
    setEbcLei('')
    setVssTema('')
    setVssResp('')
    setVssTempo('30 min')
    setVidaItems([])
    setCantico3('')
    setOracaoFinal('')
    facSeedRef.current  = 0
    vidaSeedRef.current = 0
    setUnsaved(false)
    setClearConfirmOpen(false)
    toastRef.current?.show('Formulário e histórico limpos.', 'success')
  }



  /* Aviso ao fechar aba */
  useEffect(() => {
    const fn = e => { if (unsaved) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', fn)
    return () => window.removeEventListener('beforeunload', fn)
  }, [unsaved])

  /* ── Fac items ───────────────────────────── */
  function addFacItem() {
    const id = ++facSeedRef.current
    setFacItems(prev => [...prev, { id, tipo: 'Iniciando Conversas', tempo: '1 min', est: '', aju: '' }])
    mark()
  }
  function removeFacItem(id) { setFacItems(prev => prev.filter(i => i.id !== id)); mark() }
  function updateFacItem(item) { setFacItems(prev => prev.map(i => i.id === item.id ? item : i)); mark() }

  /* drag fac */
  function facDragStart(id) { facDragSrc.current = id }
  function facDrop(targetId) {
    const src = facDragSrc.current
    if (src === targetId) return
    setFacItems(prev => {
      const next = [...prev]
      const si = next.findIndex(i => i.id === src)
      const di = next.findIndex(i => i.id === targetId)
      const [m] = next.splice(si, 1)
      next.splice(di, 0, m)
      return next
    })
    mark()
  }

  /* ── Vida items ──────────────────────────── */
  function addVidaItem() {
    const id = ++vidaSeedRef.current
    setVidaItems(prev => [...prev, { id, tema: '', tempo: '5 min', resp: '' }])
    mark()
  }
  function removeVidaItem(id) { setVidaItems(prev => prev.filter(i => i.id !== id)); mark() }
  function updateVidaItem(item) { setVidaItems(prev => prev.map(i => i.id === item.id ? item : i)); mark() }

  /* drag vida */
  function vidaDragStart(id) { vidaDragSrc.current = id }
  function vidaDrop(targetId) {
    const src = vidaDragSrc.current
    if (src === targetId) return
    setVidaItems(prev => {
      const next = [...prev]
      const si = next.findIndex(i => i.id === src)
      const di = next.findIndex(i => i.id === targetId)
      const [m] = next.splice(si, 1)
      next.splice(di, 0, m)
      return next
    })
    mark()
  }

  /* ── Auto-save com debounce de 2s ──────────── */
  useAutoSave(saveDataSilent, [
    congregacao, semana, presidente, oracao, cantico1, visitaSS,
    tes1Tema, tes1Resp, tes2Resp, tes3Est,
    cantico2, facItems, ebcDir, ebcLei, vssTema, vssResp, vssTempo,
    vidaItems, cantico3, oracaoFinal,
  ])

  /* ── Índices dinâmicos ───────────────────── */
  let idx = 4
  const facIdxMap  = {}
  facItems.forEach(i => { facIdxMap[i.id]  = idx++ })
  const vidaIdxMap = {}
  vidaItems.forEach(i => { vidaIdxMap[i.id] = idx++ })
  const ebcIdx = idx

  function abrirCompartilhamento() {
    const dadosParaSalvar = {
      congregacao, semana, presidente, oracao, cantico1, visitaSS,
      tes1Tema, tes1Resp, tes2Resp, tes3Est,
      cantico2, facItems, ebcDir, ebcLei, vssTema, vssResp, vssTempo,
      vidaItems, cantico3, oracaoFinal,
      _facSeed: facSeedRef.current, _vidaSeed: vidaSeedRef.current,
    }
    const url = generateShareUrl(dadosParaSalvar)
    setShareUrl(url)
    setShareOpen(true)
  }

  /* ── Ações da barra ──────────────────────── */
  const actions = [
    { id: 'salvar',   icon: 'fa-cloud-arrow-up',   label: 'Salvar',         onClick: saveData    },
    { id: 'carregar', icon: 'fa-cloud-arrow-down',  label: 'Carregar',       onClick: loadData    },
    { id: 'share',    icon: 'fa-share-nodes',       label: 'Compartilhar',   onClick: abrirCompartilhamento },
    { id: 'preview',  icon: 'fa-eye',               label: 'Pré-Visualizar', onClick: openPreview },
    { id: 'imprimir', icon: 'fa-print',             label: 'Imprimir',       onClick: printPreview },
    { id: 'pdf',      icon: 'fa-file-pdf',           label: 'Baixar PDF',     onClick: () => exportPDF('Gerando PDF…')  },
    { id: 'foto',     icon: 'fa-image',              label: 'Baixar Foto',    onClick: () => exportIMG('Gerando imagem…') },
    { id: 'limpar',   icon: 'fa-trash-can',        label: 'Limpar',         onClick: () => setClearConfirmOpen(true) },
  ]

  /* ── PV helper ───────────────────────────── */
  const pv = (val, emp = '—') => val || emp

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{VM_STYLES}</style>
      <ExportOverlay visible={overlay.visible} msg={overlay.msg} />
      <Toast ref={toastRef} />

      {showPreview && (
        <PreviewModal
          previewRef={previewRef}
          onClose={() => setShowPreview(false)}
          title="Vida e Ministério"
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Substituir dados?"
        message="Você tem alterações não salvas. Ao carregar, elas serão perdidas."
        confirmLabel="Carregar mesmo assim"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => { setConfirmOpen(false); loadDataConfirmed() }}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={clearConfirmOpen}
        title="Limpar tudo?"
        message="Isso vai apagar todo o formulário e o histórico salvo desta página."
        confirmLabel="Limpar tudo"
        cancelLabel="Cancelar"
        danger
        onConfirm={limparFormulario}
        onCancel={() => setClearConfirmOpen(false)}
      />
      <ShareModal
        open={shareOpen}
        shareUrl={shareUrl}
        onClose={() => setShareOpen(false)}
      />
      <PageActionBar actions={actions} unsaved={unsaved} />
      <div className="page-wrap">

      <PageHeader
        icon="fa-book"
        title="Vida e Ministério"
        subtitle="Reunião de meio de semana"
        color="#0e097f"
      />

      <div className="vm-layout">
        {/* ── EDITOR ─────────────────────────────────────────── */}
        <div id="vi-editor">

          {/* GERAL */}
          <Section id="sec-geral" className="sec-geral" headerClass="" title="Informações Gerais">
            <Field label="Congregação"       id="f-congregacao" placeholder="Nome da congregação" value={congregacao} onChange={set(setCongregacao)} />
            <Field label="Semana | Leitura Bíblica" id="f-semana" placeholder="Ex: 10–16 fev | Gênesis 1" value={semana} onChange={set(setSemana)} />
            <div className="field-row">
              <Field label="Presidente"  id="f-presidente" placeholder="Nome" value={presidente} onChange={set(setPresidente)} />
              <Field label="Oração inicial" id="f-oracao" placeholder="Nome" value={oracao} onChange={set(setOracao)} />
            </div>
            <div className="field-row" style={{ alignItems: 'flex-end' }}>
              <div className="field-group narrow">
                <label htmlFor="f-cantico1">Cântico inicial</label>
                <input type="number" id="f-cantico1" placeholder="Nº" min="1" max="151" inputMode="numeric"
                  value={cantico1} onChange={e => { setCantico1(e.target.value); mark() }} />
              </div>
              <div className="field-group" style={{ display:'flex', alignItems:'flex-end', justifyContent:'flex-end', paddingBottom:2 }}>
                <label className="visita-ss-toggle" htmlFor="f-visita-ss" title="Substitui o EBC pela Visita do SC">
                  <input type="checkbox" id="f-visita-ss" checked={visitaSS}
                    onChange={e => { setVisitaSS(e.target.checked); mark() }} />
                  <span className="vss-box" />
                  <span className="vss-label">Visita SC</span>
                </label>
              </div>
            </div>
          </Section>

          {/* TESOUROS */}
          <Section id="sec-tes" className="sec-tes" title="Tesouros da Palavra de Deus">
            <div className="sub-label">1 · Discurso (10 min)</div>
            <Field label="Tema"         id="f-tes1-tema" placeholder="Título do discurso" value={tes1Tema} onChange={set(setTes1Tema)} />
            <Field label="Responsável"  id="f-tes1-resp" placeholder="Nome"               value={tes1Resp} onChange={set(setTes1Resp)} />
            <div className="sub-label">2 · Joias Espirituais (10 min)</div>
            <Field label="Responsável"  id="f-tes2-resp" placeholder="Nome"               value={tes2Resp} onChange={set(setTes2Resp)} />
            <div className="sub-label">3 · Leitura da Bíblia (4 min)</div>
            <Field label="Estudante"    id="f-tes3-est"  placeholder="Nome"               value={tes3Est}  onChange={set(setTes3Est)}  />
          </Section>

          {/* FAÇ SEU MELHOR */}
          <Section id="sec-fac" className="sec-fac" title="Faça Seu Melhor no Ministério">
            {facItems.map(item => (
              <FacCard key={item.id} item={item} idx={facIdxMap[item.id]}
                onUpdate={updateFacItem}
                onRemove={() => removeFacItem(item.id)}
                onDragStart={() => facDragStart(item.id)}
                onDragEnd={() => {}}
                onDragOver={() => {}}
                onDrop={() => facDrop(item.id)}
              />
            ))}
            <button className="btn-add-item" onClick={addFacItem}>＋ Adicionar parte do ministério</button>
          </Section>

          {/* NOSSA VIDA CRISTÃ */}
          <Section id="sec-vida" className="sec-vida" title="Nossa Vida Cristã">
            <div className="field-row">
              <div className="field-group narrow">
                <label htmlFor="f-cantico2">Cântico</label>
                <input type="number" id="f-cantico2" placeholder="Nº" min="1" max="151" inputMode="numeric"
                  value={cantico2} onChange={e => { setCantico2(e.target.value); mark() }} />
              </div>
            </div>

            {vidaItems.map(item => (
              <VidaCard key={item.id} item={item} idx={vidaIdxMap[item.id]}
                onUpdate={updateVidaItem}
                onRemove={() => removeVidaItem(item.id)}
                onDragStart={() => vidaDragStart(item.id)}
                onDragEnd={() => {}}
                onDragOver={() => {}}
                onDrop={() => vidaDrop(item.id)}
              />
            ))}

            {/* EBC padrão */}
            {!visitaSS && (
              <div id="bloco-ebc">
                <div className="sub-label" id="vida-ebc-label">{ebcIdx} · Estudo Bíblico de Congregação (30 min)</div>
                <div className="field-row">
                  <Field label="Dirigente" id="f-vida-ebc-dir" placeholder="Nome" value={ebcDir} onChange={set(setEbcDir)} />
                  <Field label="Leitor"    id="f-vida-ebc-lei" placeholder="Nome" value={ebcLei} onChange={set(setEbcLei)} />
                </div>
              </div>
            )}

            {/* Visita SC */}
            {visitaSS && (
              <div id="bloco-vss">
                <div className="sub-label vss-sub-label">{ebcIdx} · Visita do Superintendente de Circuito</div>
                <Field label="Tema" id="f-vss-tema" placeholder="Título da parte" value={vssTema} onChange={set(setVssTema)} />
                <div className="field-row">
                  <Field label="Responsável" id="f-vss-resp" placeholder="Nome" value={vssResp} onChange={set(setVssResp)} />
                  <div className="field-group narrow">
                    <label htmlFor="f-vss-tempo">Tempo</label>
                    <select id="f-vss-tempo" value={vssTempo} onChange={e => { setVssTempo(e.target.value); mark() }}>
                      {['15 min','20 min','30 min','45 min'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button className="btn-add-item" onClick={addVidaItem}>＋ Adicionar parte da vida cristã</button>
          </Section>

          {/* ENCERRAMENTO */}
          <Section id="sec-final" className="sec-final" title="Encerramento">
            <div className="field-row">
              <div className="field-group narrow">
                <label htmlFor="f-cantico3">Cântico final</label>
                <input type="number" id="f-cantico3" placeholder="Nº" min="1" max="151" inputMode="numeric"
                  value={cantico3} onChange={e => { setCantico3(e.target.value); mark() }} />
              </div>
              <Field label="Oração final" id="f-oracao-final" placeholder="Nome" value={oracaoFinal} onChange={set(setOracaoFinal)} />
            </div>
          </Section>
        </div>

        {/* ── PREVIEW (fora da tela em mobile, visível em desktop) ── */}
        <article id="vi-previsu" className="vi-previsu" ref={previewRef} aria-label="Pré-visualização da programação">
          <section className="cabe-topo">
            <div className="con-titu">
              <span className={`pv-congregacao${!congregacao ? ' pv-empty' : ''}`}>{pv(congregacao, 'Congregação')}</span>
              <p>Programação Reunião Meio de Semana</p>
            </div>
            <hr id="um" /><hr id="dois" />
          </section>

          <section className="introducao">
            <div className="sm-ds">
              <span className={`pv-semana${!semana ? ' pv-empty' : ''}`}>{pv(semana, 'Semana | Leitura')}</span>
              <div className="ds">
                <span>Presidente: <span className={!presidente ? 'pv-empty' : ''}>{pv(presidente)}</span></span>
                <span>Oração: <span className={!oracao ? 'pv-empty' : ''}>{pv(oracao)}</span></span>
              </div>
            </div>
            <div className="fixo-a">
              <span>• Cântico: <span className={!cantico1 ? 'pv-empty' : ''}>{pv(cantico1)}</span></span>
              <span>• Comentários Iniciais (1 min)</span>
            </div>
          </section>

          <section className="tespade">
            <div className="topo tes">
              {/*<img src={tesouImg} alt="Tesouros" />*/}
              <p style={{marginLeft: '15px'}}>TESOUROS DA PALAVRA DE DEUS</p>
            </div>
            <div className="bloco">
              <div className="des-res">
                <div className="des"><span className="indice">1. </span><span className={!tes1Tema ? 'pv-empty' : ''}>{pv(tes1Tema,'Tema')}</span><span> (10 min)</span></div>
                <div className="resp"><span className={!tes1Resp ? 'pv-empty' : ''}>{pv(tes1Resp)}</span></div>
              </div>
            </div>
            <div className="bloco">
              <div className="des-res">
                <div className="des"><span className="indice">2. </span><span>Joias espirituais (10 min)</span></div>
                <div className="resp"><span className={!tes2Resp ? 'pv-empty' : ''}>{pv(tes2Resp)}</span></div>
              </div>
            </div>
            <div className="bloco">
              <div className="des-res">
                <div className="des"><span className="indice">3. </span><span>Leitura da Bíblia (4 min)</span></div>
                <div className="resp"><span>Estudante: </span><span className={!tes3Est ? 'pv-empty' : ''}>{pv(tes3Est)}</span></div>
              </div>
            </div>
          </section>

          <section className="fame">
            <div className="topo famemi">
              {/*<img src={facImg} alt="Faça seu melhor" />*/}
              <p style={{marginLeft: '15px'}}>FAÇA SEU MELHOR NO MINISTÉRIO</p>
            </div>
            {facItems.map(item => (
              <div className="bloco" key={item.id}>
                <div className="des-res">
                  <div className="des">
                    <span className="indice">{facIdxMap[item.id]}. </span>
                    <span>{item.tipo}</span>
                    <span> ({item.tempo})</span>
                  </div>
                  <div className="resp-est-aju">
                    <span>Estudante: <span className={!item.est ? 'pv-empty' : ''}>{item.est || '—'}</span></span>
                    <span>Ajudante: <span className={!item.aju ? 'pv-empty' : ''}>{item.aju || '—'}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="nosvida">
            <div className="topo novida">
              {/*<img src={vidaImg} alt="Nossa vida cristã" />*/}
              <p style={{marginLeft: '15px'}}>NOSSA VIDA CRISTÃ</p>
            </div>
            <div className="fixo-b">
              <span>• Cântico: <span className={!cantico2 ? 'pv-empty' : ''}>{pv(cantico2)}</span></span>
            </div>
            {vidaItems.map(item => (
              <div className="bloco" key={item.id}>
                <div className="des-res">
                  <div className="des">
                    <span className="indice">{vidaIdxMap[item.id]}. </span>
                    <span className={!item.tema ? 'pv-empty' : ''}>{item.tema || 'Tema'}</span>
                    <span> ({item.tempo})</span>
                  </div>
                  <div className="resp"><span className={!item.resp ? 'pv-empty' : ''}>{item.resp || '—'}</span></div>
                </div>
              </div>
            ))}
            {!visitaSS && (
              <div className="bloco">
                <div className="des-res">
                  <div className="des">
                    <span className="indice">{ebcIdx}. </span>
                    <span>Estudo Bíblico de Congregação (30 min)</span>
                  </div>
                  <div className="resp-est-aju">
                    <span>Dirigente: <span className={!ebcDir ? 'pv-empty' : ''}>{pv(ebcDir)}</span></span>
                    <span>Leitor: <span className={!ebcLei ? 'pv-empty' : ''}>{pv(ebcLei)}</span></span>
                  </div>
                </div>
              </div>
            )}
            {visitaSS && (
              <div className="bloco">
                <div className="des-res">
                  <div className="des">
                    <span className="indice">{ebcIdx}. </span>
                    <span className={!vssTema ? 'pv-empty' : ''}>{pv(vssTema,'Tema')}</span>
                    <span> ({vssTempo})</span>
                  </div>
                  <div className="resp"><span className={!vssResp ? 'pv-empty' : ''}>{pv(vssResp)}</span></div>
                </div>
              </div>
            )}
          </section>

          <section className="final">
            <div className="fixo-b">
              <span>• Comentários Finais (1 min)</span>
              <div className="final-bottom">
                <span>• Cântico: <span className={!cantico3 ? 'pv-empty' : ''}>{pv(cantico3)}</span></span>
                <span>Oração Final: <span className={!oracaoFinal ? 'pv-empty' : ''}>{pv(oracaoFinal)}</span></span>
              </div>
            </div>
          </section>
        </article>
      </div>
      </div>{/* /page-wrap */}
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   ESTILOS SCOPED — idênticos ao original, isolados na página
   ════════════════════════════════════════════════════════════ */
const VM_STYLES = `
  .page-wrap {
    margin-top: var(--shell-total-top);
  }

  .vm-layout {
    margin-top: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 24px;
    padding: 2px 20px 60px;
  }
  #vi-editor {
    width: 390px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .editor-section {
    background: #fff;
    border: 1px solid var(--ed-brd);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .editor-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    cursor: pointer;
    user-select: none;
    transition: background .2s;
  }
  .sec-icon { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .sec-geral .sec-icon { background: var(--ed-acc); }
  .sec-tes   .sec-icon { background: #3b7d8b; }
  .sec-fac   .sec-icon,
  .sec-vida  .sec-icon { background: #fff; }
  .sec-final .sec-icon { background: var(--ed-muted); }
  .sec-name { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; flex:1; }
  .sec-geral .sec-name { color: var(--ed-acc); }
  .sec-tes   .sec-name { color: #1e6b7a; }
  .sec-fac   .sec-name,
  .sec-vida  .sec-name { color: #fff; }
  .sec-final .sec-name { color: var(--ed-muted); }
  .chevron { font-size:12px; transition: transform .25s; }
  .sec-geral .chevron { color: var(--ed-acc); }
  .sec-tes   .chevron { color: #3b7d8b; }
  .sec-fac   .chevron,
  .sec-vida  .chevron { color: rgba(255,255,255,.7); }
  .sec-final .chevron { color: var(--ed-muted); }
  /* Cabeçalhos temáticos */
  .sec-geral .editor-section-header { background: linear-gradient(90deg,#eef0ff,#f5f6ff); border-bottom:2px solid #c4cbf4; }
  .sec-geral .editor-section-header:hover { background: linear-gradient(90deg,#e4e7ff,#eef0ff); }
  .sec-tes   .editor-section-header { background: linear-gradient(90deg,#d4eff4,#eaf6f9); border-bottom:2px solid #3b7d8b; }
  .sec-tes   .editor-section-header:hover { background: linear-gradient(90deg,#c2e8ef,#d4eff4); }
  .sec-fac   .editor-section-header { background: linear-gradient(90deg,#d38f00,#e8a81a); border-bottom:2px solid #b37800; }
  .sec-fac   .editor-section-header:hover { background: linear-gradient(90deg,#bc7f00,#d38f00); }
  .sec-vida  .editor-section-header { background: linear-gradient(90deg,#be2e13,#d94a2b); border-bottom:2px solid #a0240e; }
  .sec-vida  .editor-section-header:hover { background: linear-gradient(90deg,#a82510,#c73d22); }
  .sec-final .editor-section-header { background: linear-gradient(90deg,#f0f0f5,#f7f7fb); border-bottom:2px solid #c0c4d8; }
  .sec-final .editor-section-header:hover { background: linear-gradient(90deg,#e6e6ef,#f0f0f5); }
  .editor-section-body { padding:4px 14px 14px; display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--ed-brd); background:var(--ed-surf); }
  .field-group { display:flex; flex-direction:column; gap:3px; }
  .field-group label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:var(--ed-lbl); }
  .field-group input,
  .field-group select { background:#fff; border:1px solid var(--ed-brd); border-radius:8px; color:var(--ed-txt); font-family:'Barlow',sans-serif; font-size:15px; padding:8px 10px; width:100%; transition:border-color .2s,box-shadow .2s; outline:none; }
  .field-group input::placeholder { color:#9aa3c7; }
  .field-group input:focus,
  .field-group select:focus { border-color:var(--ed-acc); box-shadow:0 0 0 3px rgba(14,9,127,.1); }
  .field-row { display:flex; gap:20px; }
  .field-row .field-group { flex:1; }
  .field-row .field-group.narrow { flex:0 0 100px; }
  .sub-label { font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--ed-muted); margin-top:4px; padding-bottom:2px; border-bottom:1px dashed var(--ed-brd-strong); }
  .vss-sub-label { color:#8b4513!important; border-bottom-color:#c8885a!important; }
  .dyn-card { background:#fafbff; border:1px solid var(--ed-brd); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; cursor:grab; transition:box-shadow .18s,opacity .18s; }
  .dyn-card-header { display:flex; align-items:center; justify-content:space-between; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--ed-muted); }
  .drag-handle { color:var(--ed-muted); font-size:13px; cursor:grab; padding:2px 4px; border-radius:4px; }
  .drag-handle:hover { color:var(--ed-acc); background:var(--ed-surf-soft); }
  .card-idx { font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--ed-acc); }
  .btn-remove { background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.14); color:var(--danger); border-radius:6px; padding:3px 8px; font-size:11px; cursor:pointer; transition:background .18s,border-color .18s; }
  .btn-remove:hover { background:rgba(239,68,68,.14); border-color:rgba(239,68,68,.24); }
  .btn-add-item { display:flex; align-items:center; justify-content:center; gap:6px; padding:9px; border-radius:8px; border:1px dashed var(--ed-brd-strong); background:#fff; color:var(--ed-muted); font-family:'Barlow',sans-serif; font-size:12px; cursor:pointer; transition:all .18s; width:100%; }
  .btn-add-item:hover { border-color:var(--ed-acc); color:var(--ed-acc); background:#f7f8ff; }
  /* Checkbox Visita SC */
  .visita-ss-toggle { display:flex; align-items:center; gap:7px; cursor:pointer; user-select:none; padding:6px 10px; border-radius:8px; border:1px solid var(--ed-brd); background:#fff; transition:border-color .2s,background .2s; }
  .visita-ss-toggle:hover { border-color:var(--ed-acc); background:var(--ed-surf-soft); }
  .visita-ss-toggle input[type="checkbox"] { display:none; }
  .vss-box { width:16px; height:16px; border:2px solid var(--ed-brd-strong); border-radius:4px; background:#fff; flex-shrink:0; transition:background .18s,border-color .18s; position:relative; }
  .visita-ss-toggle input:checked ~ .vss-box { background:var(--ed-acc); border-color:var(--ed-acc); }
  .vss-label { font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--ed-lbl); white-space:nowrap; }
  /* ── PREVIEW ── */
  .vi-previsu { width:21cm; min-height:29.7cm; border:1px solid #d9ddeb; padding:.5cm; background:#fff; color:#000; font-family:Arial,sans-serif; flex-shrink:0; box-shadow:0 8px 30px rgba(15,23,42,.12); }
  .vi-previsu * { font-family:Arial,sans-serif; }
  .cabe-topo { margin-bottom:4px; }
  .con-titu { display:flex; justify-content:space-around; align-items:center; }
  .con-titu .pv-congregacao { font-size:14pt; font-weight:bold; }
  .con-titu > p { font-size:16pt; font-weight:bold; }
  hr#um  { height:3px; background:#000; border:none; }
  hr#dois{ height:1px; background:#000; border:none; margin-top:1px; }
  .introducao { margin-top:.2cm; }
  .sm-ds { display:flex; justify-content:space-between; align-items:baseline; margin-left:3cm; }
  .pv-semana { font-size:12pt; font-weight:bold; text-align:center; }
  .ds  { display:flex; flex-direction:column; align-items:start; gap:.2cm; font-size:12pt; line-height:1.5; }
  .fixo-a { display:flex; flex-direction:column; gap:.2cm; margin-left:1.25cm; position:relative; top:-.3cm; font-size:12pt; line-height:1.5; }
  .fixo-b { display:flex; flex-direction:column; gap:.15cm; margin-left:1.25cm; font-size:12pt; line-height:1.5; margin-top:5px; }
  .topo  { display:flex; align-items:center; gap:5px; }
  .tes   { background:#3b7d8b; width:66%; color:#fff; font-weight:600; height:35px; }
  .famemi{ background:#d38f00; width:66%; color:#fff; font-weight:600; margin-top:20px; height:35px; }
  .novida{ background:#be2e13; width:66%; color:#fff; font-weight:600; height:35px; margin-top:20px; }
  .topo p { font-size:12pt; margin:2px 0; }
  .topo img { height:28px; }
  .des-res { display:flex; justify-content:space-between; align-items:flex-start; }
  .des  { margin-left:.5cm; font-size:12pt; line-height:1.5; }
  .bloco{ margin-top:.22cm; }
  .resp-est-aju { display:flex; flex-direction:column; align-items:flex-end; gap:2px; font-size:12pt; line-height:1.5; }
  .resp { font-size:12pt; text-align:right; line-height:1.5; }
  .final{ margin-top:.2cm; }
  .final-bottom { display:flex; justify-content:space-between; font-size:12pt; line-height:1.5; }
  .pv-empty { color:#bbb; font-style:italic; }
  /* Esconde preview em telas pequenas */
  @media (max-width:1250px) {
    #vi-previsu {
      position:fixed!important; top:0!important; left:-9999px!important;
      width:21cm!important; min-height:29.7cm!important;
      visibility:hidden!important; pointer-events:none!important; z-index:-999!important;
    }
    .vm-layout { padding:0 16px 60px; justify-content:center; }
    #vi-editor  { width:100%; max-width:520px; }
  }
  @media print {
    body { background:#fff!important; }
    #vi-editor { display:none!important; }
    .vi-previsu {
      display:block!important; border:none!important; box-shadow:none!important;
      width:21cm!important; min-height:29.7cm!important; padding:.5cm!important; margin:0 auto!important;
    }
  }
  @media (max-width: 699px) {
    .page-wrap {
      margin-top: 0px;
    }
  }

`
