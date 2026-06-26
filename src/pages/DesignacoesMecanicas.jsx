import { useState, useRef } from 'react'
import Toast from '../components/ui/Toast'
import PageHeader from '../components/ui/PageHeader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useAutoSave } from '../hooks/useAutoSave'
import ExportOverlay from '../components/ui/ExportOverlay'
import PageActionBar from '../components/ui/PageActionBar'
import { useExport } from '../hooks/useExport'
import { useExportTheme } from '../hooks/useExportTheme'
import { useThemeLive } from '../hooks/useThemeLive'
import PreviewModal from '../components/ui/PreviewModal'

const LS_KEY = 'designacoes-mecanicas-dados'

const getInitialData = () => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function novaSemana(num) {
  return { num, data: '', indicadores: [], volantes: [], som: '', palco: '' }
}

/* ── Tag de nome (indicador / volante) ── */
function NomeTag({ nome, onRemove }) {
  return (
    <span className="dm-nome-tag">
      {nome}
      <button onClick={onRemove} title="Remover">×</button>
    </span>
  )
}

/* ── Linha de tabela do preview ── */
function TrNomes({ label, nomes }) {
  if (nomes.length === 0) {
    return (
      <tr>
        <td className="dm-cat-label">{label}</td>
        <td></td>
      </tr>
    )
  }
  return (
    <tr>
      <td className="dm-cat-label">{label}</td>
      {nomes.map((n, i) => <td key={i}>{n}</td>)}
    </tr>
  )
}

function TrSimples({ label, valor }) {
  return (
    <tr>
      <td className="dm-cat-label">{label}</td>
      <td>{valor || '—'}</td>
    </tr>
  )
}

/* ════════════════════════════════════════════════════════
   PÁGINA
   ════════════════════════════════════════════════════════ */
export default function DesignacoesMecanicas() {
  const toastRef = useRef()
  const previewRef = useRef()
  const skipAutoSaveRef = useRef(false)

  const initialData = getInitialData()

  const [congregacao, setCongregacao] = useState(initialData?.congregacao || '')
  const [mes, setMes] = useState(initialData?.mes || '')
  const [ano, setAno] = useState(initialData?.ano || '')
  const [semanas, setSemanas] = useState(initialData?.semanas || [novaSemana(1)])
  const [proxNum, setProxNum] = useState(initialData?.proxNum || ((initialData?.semanas?.length ?? 1) + 1))
  const [overlay, setOverlay] = useState({ visible: false, msg: '' })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  /* inputs temporários para adicionar nomes */
  const [indInputs, setIndInputs] = useState({})
  const [volInputs, setVolInputs] = useState({})

  const filename = `designacoes-mecanicas-${(mes || 'sem-mes').toLowerCase()}-${ano || 'sem-ano'}`
  const { applyTheme, removeTheme } = useExportTheme('dm')

  /* ── Tema em tempo real no previsu lateral ───────────── */
  useThemeLive(previewRef, 'dm')

  const { exportPDF, exportIMG, printPreview, openPreview } = useExport(previewRef, {
    onStart: msg => setOverlay({ visible: true, msg }),
    onEnd: (msg, type) => { setOverlay({ visible: false, msg: '' }); toastRef.current?.show(msg, type) },
    onError: msg => toastRef.current?.show(msg, 'error'),
    onOpenPreview: () => setShowPreview(true),
    onBeforeCapture: applyTheme,
    onAfterCapture: removeTheme,
    filename,
  })



  /* ── salvar / carregar ── */
  function saveData() {
    localStorage.setItem(LS_KEY, JSON.stringify({ congregacao, mes, ano, semanas, proxNum }))
    setUnsaved(false)
    toastRef.current?.show('✔ Dados salvos com sucesso!', 'success')
  }

  function saveDataSilent() {
    if (skipAutoSaveRef.current) {
      localStorage.removeItem(LS_KEY)
      skipAutoSaveRef.current = false
      setUnsaved(false)
      return
    }
    localStorage.setItem(LS_KEY, JSON.stringify({ congregacao, mes, ano, semanas, proxNum }))
    setUnsaved(false)
  }

  function loadData() {
    if (unsaved) { setConfirmOpen(true); return }
    loadDataConfirmed()
  }
  function loadDataConfirmed() {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) { toastRef.current?.show('Nenhum dado salvo encontrado.', 'warning'); return }
    try {
      const d = JSON.parse(raw)
      setCongregacao(d.congregacao || '')
      setMes(d.mes || '')
      setAno(d.ano || '')
      setSemanas(d.semanas || [novaSemana(1)])
      setProxNum((d.semanas?.length ?? 1) + 1)
      setUnsaved(false)
      toastRef.current?.show('📂 Dados carregados!', 'info')
    } catch { toastRef.current?.show('Erro ao carregar dados.', 'error') }
  }

  /* ── CRUD semanas ── */
  function adicionarSemana() {
    setSemanas(prev => {
      const next = [...prev, novaSemana(prev.length + 1)]
      setProxNum(next.length + 1)
      return next
    })
    setUnsaved(true)
  }
  function removerSemana(num) {
    setSemanas(prev => {
      const next = prev
        .filter(s => s.num !== num)
        .map((s, i) => ({ ...s, num: i + 1 }))
      const normalized = next.length ? next : [novaSemana(1)]
      setProxNum(normalized.length + 1)
      return normalized
    })
    setUnsaved(true)
  }
  function atualizarSemana(num, campo, valor) {
    setSemanas(prev => prev.map(s => s.num === num ? { ...s, [campo]: valor } : s))
    setUnsaved(true)
  }

  /* ── Indicadores / Volantes ── */
  function adicionarNome(num, categoria) {
    const val = (categoria === 'indicadores' ? indInputs : volInputs)[num]?.trim()
    if (!val) return
    setSemanas(prev => prev.map(s =>
      s.num === num ? { ...s, [categoria]: [...s[categoria], val] } : s
    ))
    if (categoria === 'indicadores')
      setIndInputs(p => ({ ...p, [num]: '' }))
    else
      setVolInputs(p => ({ ...p, [num]: '' }))
  }
  function removerNome(num, categoria, idx) {
    setSemanas(prev => prev.map(s =>
      s.num === num ? { ...s, [categoria]: s[categoria].filter((_, i) => i !== idx) } : s
    ))
  }

  function limparFormulario() {
    skipAutoSaveRef.current = true
    localStorage.removeItem(LS_KEY)
    setCongregacao('')
    setMes('')
    setAno('')
    setSemanas([novaSemana(1)])
    setProxNum(2)
    setIndInputs({})
    setVolInputs({})
    setUnsaved(false)
    setClearConfirmOpen(false)
    toastRef.current?.show('FormulÃ¡rio e histÃ³rico limpos.', 'success')
  }

  /* ── Auto-save ── */
  useAutoSave(saveDataSilent, [congregacao, mes, ano, semanas, proxNum])

  const actions = [
    { id: 'salvar', icon: 'fa-cloud-arrow-up', label: 'Salvar', onClick: saveData },
    { id: 'carregar', icon: 'fa-cloud-arrow-down', label: 'Carregar', onClick: loadData },
    { id: 'preview', icon: 'fa-eye', label: 'Pré-Visualizar', onClick: openPreview },
    { id: 'imprimir', icon: 'fa-print', label: 'Imprimir', onClick: printPreview },
    { id: 'pdf', icon: 'fa-file-pdf', label: 'Baixar PDF', onClick: () => exportPDF('Gerando PDF…') },
    { id: 'foto', icon: 'fa-image', label: 'Baixar Foto', onClick: () => exportIMG('Gerando imagem…') },
    { id: 'limpar', icon: 'fa-trash-can', label: 'Limpar', onClick: () => setClearConfirmOpen(true) },
  ]

  return (
    <>
      <style>{DM_STYLES}</style>
      <ExportOverlay visible={overlay.visible} msg={overlay.msg} />
      <Toast ref={toastRef} />
      {showPreview && (
        <PreviewModal
          previewRef={previewRef}
          onClose={() => setShowPreview(false)}
          title="Designações Mecânicas"
          applyTheme={applyTheme}
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
      <PageActionBar actions={actions} unsaved={unsaved} />
      <div className="page-wrap">

        <PageHeader
          icon="fa-list-check"
          title="Designações Mecânicas"
          subtitle="Indicadores, volantes, som e palco"
          color="#237db1"
        />

        <div className="dm-layout">
          {/* ── EDITOR ── */}
          <section>
            <article className="dm-editor">
              <div className="dm-campo">
                <div className="dm-titu"><p>Informações Gerais</p><hr /></div>
                {[
                  ['CONGREGAÇÃO', congregacao, setCongregacao, 'Nome da Congregação'],
                  ['MÊS', mes, setMes, 'ex: Março'],
                  ['ANO', ano, setAno, 'ex: 2026'],
                ].map(([label, val, setVal, ph]) => (
                  <div className="dm-bloco" key={label}>
                    <label>{label}</label>
                    <input type="text" placeholder={ph} value={val}
                      onChange={e => { setVal(e.target.value); setUnsaved(true) }} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 15 }}>
                <div className="dm-titu"><p>Semanas</p><hr /></div>

                <div className="dm-semanas-form">
                  {semanas.map(s => (
                    <div key={s.num} className="dm-campo dm-semana-form">
                      <div className="dm-titu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p>Semana {s.num}</p>
                        {semanas.length > 1 && (
                          <button className="dm-btn-remove" onClick={() => removerSemana(s.num)}>✕ Remover</button>
                        )}
                      </div>

                      {/* Data */}
                      <div className="dm-bloco">
                        <label>DATA | TÍTULO DA SEMANA</label>
                        <input type="text" placeholder="ex: 03/03 - 09/03" value={s.data}
                          onChange={e => atualizarSemana(s.num, 'data', e.target.value)} />
                      </div>

                      {/* Indicadores */}
                      <div className="dm-bloco dm-add">
                        <label>INDICADORES</label>
                        <input type="text" placeholder="Nome"
                          value={indInputs[s.num] || ''}
                          onChange={e => setIndInputs(p => ({ ...p, [s.num]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && adicionarNome(s.num, 'indicadores')}
                        />
                        <button className="dm-btn-add-lista" onClick={() => adicionarNome(s.num, 'indicadores')}>
                          + Adicionar Indicador
                        </button>
                        <div className="dm-nomes-adicionados">
                          {s.indicadores.map((n, i) => (
                            <NomeTag key={i} nome={n} onRemove={() => removerNome(s.num, 'indicadores', i)} />
                          ))}
                        </div>
                      </div>

                      {/* Volantes */}
                      <div className="dm-bloco dm-add">
                        <label>VOLANTES</label>
                        <input type="text" placeholder="Nome"
                          value={volInputs[s.num] || ''}
                          onChange={e => setVolInputs(p => ({ ...p, [s.num]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && adicionarNome(s.num, 'volantes')}
                        />
                        <button className="dm-btn-add-lista" onClick={() => adicionarNome(s.num, 'volantes')}>
                          + Adicionar Volante
                        </button>
                        <div className="dm-nomes-adicionados">
                          {s.volantes.map((n, i) => (
                            <NomeTag key={i} nome={n} onRemove={() => removerNome(s.num, 'volantes', i)} />
                          ))}
                        </div>
                      </div>

                      {/* Som / Palco */}
                      {[['SOM', 'som'], ['PALCO', 'palco']].map(([lbl, campo]) => (
                        <div className="dm-bloco" key={campo}>
                          <label>{lbl}</label>
                          <input type="text" placeholder="Nome" value={s[campo]}
                            onChange={e => atualizarSemana(s.num, campo, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="dm-btn-add-sem" onClick={adicionarSemana}>+ Adicionar Semana</button>
                </div>
              </div>
            </article>
          </section>

          {/* ── PREVIEW ── */}
          <section className="dm-previsu" ref={previewRef}>
            <div className="dm-titu-prev">
              <p className="dm-des">Designações Mecânicas</p>
              <div className="dm-cong-bar">Congregação: <span>{congregacao}</span></div>
            </div>
            <div className="dm-mes-ano">
              <p className="dm-mes">{(mes || '').toUpperCase()}</p>
              <p className="dm-ano">{ano}</p>
            </div>
            <div className="dm-tabelas-wrapper">
              {semanas.map(s => (
                <div key={s.num} style={{ marginBottom: '0.4cm' }}>
                  <table className="dm-semanas-table">
                    <tbody>
                      <tr className="dm-semana-titulo">
                        <th colSpan={99}>{s.data ? `SEMANA ${s.num}: ${s.data}` : `SEMANA ${s.num}`}</th>
                      </tr>
                      <TrNomes label="INDICADORES:" nomes={s.indicadores} />
                      <TrNomes label="VOLANTES:" nomes={s.volantes} />
                      <TrSimples label="SOM:" valor={s.som} />
                      <TrSimples label="PALCO:" valor={s.palco} />
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>{/* /page-wrap */}
    </>
  )
}

const DM_STYLES = `
  .page-wrap {
    margin-top: var(--shell-total-top);
  }

  .dm-layout {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    padding: 2px 16px 80px;
    
    background: #f4f2ee;
    min-height: 100%;
  }
  .dm-editor {
    width: 380px;
    flex-shrink: 0;
    padding: 1rem;
    box-shadow: 2px 2px 8px rgba(26,26,46,.3);
    border-radius: 15px;
    background: #eef1f7;
    margin: 10px 0;
  }
  .dm-campo {
    background: #c5bfb0;
    border-radius: 15px;
    padding: 15px 0 20px;
    margin-bottom: 10px;
  }
  .dm-titu p  { font-size:18px; font-weight:600; color:#162c54; padding:4px 0; }
  .dm-titu hr { border:2px solid #c8a84b; border-radius:5px; box-shadow:1px 1px 1px #e2c97e; margin-bottom:5px; }
  .dm-bloco { margin-top:5px; display:flex; flex-direction:column; justify-content:center; }
  .dm-bloco label { width:90%; margin:0 auto; font-size:13px; margin-top:6px; color:#162c54; font-weight:700; letter-spacing:.5px; display:block; }
  .dm-bloco input { padding:6px 8px; width:90%; margin:3px auto; border:1px solid #c5bfb0; border-radius:6px; font-size:14px; display:block; box-sizing:border-box; }
  .dm-bloco input:focus { outline:2px solid #7098d52a; }
  .dm-add { margin-bottom: 8px; }
  .dm-btn-add-lista { color:#162c54; font-weight:600; padding:6px; width:90%; margin:5px auto; background:#e2c97e; border:none; border-radius:20px; box-shadow:2px 2px 5px #162c54; cursor:pointer; display:block; }
  .dm-btn-add-lista:hover { background:#c8a84b; }
  .dm-nomes-adicionados { width:90%; margin:4px auto 0; display:flex; flex-wrap:wrap; gap:4px; }
  .dm-nome-tag { background:#7098d52a; color:#162c54; border-radius:12px; padding:2px 8px; font-size:12px; display:flex; align-items:center; gap:4px; border:1px solid #7098d5; }
  .dm-nome-tag button { background:none; border:none; color:#162c54; cursor:pointer; font-size:14px; line-height:1; padding:0; }
  .dm-btn-remove { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.2); color:#ef4444; border-radius:6px; padding:3px 10px; font-size:12px; cursor:pointer; margin-right:10px; }
  .dm-btn-add-sem { padding:8px 16px; border-radius:10px; background:#c8a84b; color:#162c54; font-weight:700; border:1px solid #c5bfb0; cursor:pointer; }
  .dm-btn-add-sem:hover { background:#e2c97e; }
  /* Preview */
  .dm-previsu {
    display: none;
    width: 210mm;
    min-height: 297mm;
    background: #fff;
    border: 2px solid #aaa;
    padding: .5cm;
    flex-shrink: 0;
  }
  .dm-titu-prev { margin-bottom:6px; }
  .dm-des { display:flex; align-items:center; justify-content:center; font-size:24pt; font-weight:600; background:#237db1cc; text-shadow:1px 1px 4px #2896d4; border-radius:0 0 0 40px; height:1.2cm; letter-spacing:2px; }
  .dm-cong-bar { margin-top:4px; margin-left:auto; font-size:13pt; font-weight:500; background:#237db1cc; text-shadow:1px 1px 4px #2896d4; border-radius:0 0 0 40px; height:.8cm; width:125mm; display:flex; align-items:center; gap:5px; padding-left:14px; border-bottom:2px solid black; }
  .dm-mes-ano { display:flex; flex-direction:column; align-items:center; margin:.3cm 0 .4cm; }
  .dm-mes { font-size:18pt; font-weight:700; letter-spacing:3px; }
  .dm-ano { font-size:16pt; font-weight:400; color:#555; }
  .dm-tabelas-wrapper {}
  .dm-semanas-table { width:100%; border-collapse:collapse; font-size:12pt; table-layout:auto; }
  .dm-semana-titulo th { background:#7098d52a; color:#1a1a2e; text-align:left; padding:5px 10px; border:1px solid #999; font-size:12pt; letter-spacing:1px; }
  .dm-semanas-table td { border:1px solid #bbb; padding:5px 10px; vertical-align:middle; font-size:12pt; background:#fff; min-width:30mm; }
  .dm-cat-label { background:#e8eef7!important; color:#162c54; font-weight:700; font-size:12pt; text-align:right; white-space:nowrap; min-width:0; width:1%; padding-right:8px!important; }
  @media (min-width:1200px) {
    .dm-previsu { display:block; }
    .dm-layout { align-items:flex-start; }
    .dm-semanas-form .dm-semana-form:not(:last-child) { display:none; }

  }
  @media (max-width: 699px) {
    .page-wrap {
      margin-top: 0;
    }
  }

`
