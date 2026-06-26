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

import oradorImg from '../assets/images/orador.png'

const LS_KEY = 'reu-publica-dados'

const getInitialData = () => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/* ─── Semana vazia ────────────────────────────────────── */
function novaSemana(num) {
  return { num, data: '', presidente: '', orador: '', congregacao: '', tema: '', leitor: '', orafinal: '' }
}

/* ─── Linha de tabela ─────────────────────────────────── */
function TrLinha({ label, valor }) {
  return (
    <tr>
      <td className="rp-cat-label">{label}</td>
      <td>{valor || '—'}</td>
    </tr>
  )
}

/* ════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ════════════════════════════════════════════════════════ */
export default function ReuniaoPublica() {
  const toastRef = useRef()
  const previewRef = useRef()
  const skipAutoSaveRef = useRef(false)

  const initialData = getInitialData()

  const [congregacao, setCongregacao] = useState(initialData?.congregacao || '')
  const [mes, setMes] = useState(initialData?.mes || '')
  const [ano, setAno] = useState(initialData?.ano || '')
  const [semanas, setSemanas] = useState(initialData?.semanas || [novaSemana(1)])
  const [semanaAtual, setSemanaAtual] = useState(initialData?.semanaAtual || ((initialData?.semanas?.length ?? 1) + 1))
  const [unsaved, setUnsaved] = useState(false)  // próximo número
  const [overlay, setOverlay] = useState({ visible: false, msg: '' })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  /* ── Tema de exportação ─────────────────────────────── */
  const { applyTheme, removeTheme } = useExportTheme('rp')

  /* ── Tema em tempo real no previsu lateral ───────────── */
  useThemeLive(previewRef, 'rp')

  /* ── Export hook ─────────────────────────────────────── */
  const filename = `Reunião-Pública-${(mes || 'sem-mes').toLowerCase().replace(/\s+/g, '-')}-${ano || 'sem-ano'}`
  const { exportPDF, exportIMG, printPreview, openPreview } = useExport(previewRef, {
    onStart: msg => setOverlay({ visible: true, msg }),
    onEnd: (msg, type) => { setOverlay({ visible: false, msg: '' }); toastRef.current?.show(msg, type) },
    onError: msg => toastRef.current?.show(msg, 'error'),
    onOpenPreview: () => setShowPreview(true),
    onBeforeCapture: applyTheme,
    onAfterCapture: removeTheme,
    filename,
  })



  /* ── Salvar / Carregar ───────────────────────────────── */
  function saveData() {
    localStorage.setItem(LS_KEY, JSON.stringify({ congregacao, mes, ano, semanas, semanaAtual }))
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
    localStorage.setItem(LS_KEY, JSON.stringify({ congregacao, mes, ano, semanas, semanaAtual }))
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
      setSemanaAtual((d.semanas?.length ?? 1) + 1)
      setUnsaved(false)
      toastRef.current?.show('📂 Dados carregados!', 'info')
    } catch {
      toastRef.current?.show('Erro ao carregar dados.', 'error')
    }
  }

  /* ── CRUD semanas ────────────────────────────────────── */
  function adicionarSemana() {
    setSemanas(prev => {
      const next = [...prev, novaSemana(prev.length + 1)]
      setSemanaAtual(next.length + 1)
      return next
    })
    setUnsaved(true)
  }
  function atualizarSemana(num, campo, valor) {
    setSemanas(prev => prev.map(s => s.num === num ? { ...s, [campo]: valor } : s))
    setUnsaved(true)
  }
  function removerSemana(num) {
    setSemanas(prev => {
      const next = prev
        .filter(s => s.num !== num)
        .map((s, i) => ({ ...s, num: i + 1 }))
      const normalized = next.length ? next : [novaSemana(1)]
      setSemanaAtual(normalized.length + 1)
      return normalized
    })
    setUnsaved(true)
  }

  function limparFormulario() {
    skipAutoSaveRef.current = true
    localStorage.removeItem(LS_KEY)
    setCongregacao('')
    setMes('')
    setAno('')
    setSemanas([novaSemana(1)])
    setSemanaAtual(2)
    setUnsaved(false)
    setClearConfirmOpen(false)
    toastRef.current?.show('FormulÃ¡rio e histÃ³rico limpos.', 'success')
  }

  /* ── Ações da barra ──────────────────────────────────── */
  /* ── Auto-save ── */
  useAutoSave(saveDataSilent, [congregacao, mes, ano, semanas, semanaAtual])

  const actions = [
    { id: 'salvar', icon: 'fa-cloud-arrow-up', label: 'Salvar', onClick: saveData },
    { id: 'carregar', icon: 'fa-cloud-arrow-down', label: 'Carregar', onClick: loadData },
    { id: 'preview', icon: 'fa-eye', label: 'Pré-Visualizar', onClick: openPreview },
    { id: 'imprimir', icon: 'fa-print', label: 'Imprimir', onClick: printPreview },
    { id: 'pdf', icon: 'fa-file-pdf', label: 'Baixar PDF', onClick: () => exportPDF('Gerando PDF…') },
    { id: 'foto', icon: 'fa-image', label: 'Baixar Foto', onClick: () => exportIMG('Gerando imagem…') },
    { id: 'limpar', icon: 'fa-trash-can', label: 'Limpar', onClick: () => setClearConfirmOpen(true) },
  ]

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{RP_STYLES}</style>
      <ExportOverlay visible={overlay.visible} msg={overlay.msg} />
      <Toast ref={toastRef} />
      {showPreview && (
        <PreviewModal
          previewRef={previewRef}
          onClose={() => setShowPreview(false)}
          title="Reunião Pública"
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
          icon="fa-person-chalkboard"
          title="Reunião Pública"
          subtitle="Programação mensal"
          color="#1e3a6e"
        />

        <div className="rp-layout">
          {/* ── EDITOR ──────────────────────────────────────── */}
          <section>
            <article className="rp-editor">
              {/* Cabeçalho */}
              <div className="rp-campo">
                <div className="rp-titu"><p>Informações Gerais</p><hr /></div>
                <div className="rp-bloco">
                  <label>CONGREGAÇÃO</label>
                  <input type="text" placeholder="Nome da Congregação"
                    value={congregacao} onChange={e => { setCongregacao(e.target.value); setUnsaved(true) }} />
                </div>
                <div className="rp-bloco">
                  <label>MÊS</label>
                  <input type="text" placeholder="ex: Março"
                    value={mes} onChange={e => { setMes(e.target.value); setUnsaved(true) }} />
                </div>
                <div className="rp-bloco">
                  <label>ANO</label>
                  <input type="text" placeholder="ex: 2026"
                    value={ano} onChange={e => { setAno(e.target.value); setUnsaved(true) }} />
                </div>
              </div>

              {/* Dias */}
              <div style={{ marginTop: 15 }}>
                <div className="rp-titu"><p>Dia</p><hr /></div>
                {semanas.map(s => (
                  <div key={s.num} className="rp-campo">
                    <div className="rp-titu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p>Dia {s.num}</p>
                      {semanas.length > 1 && (
                        <button className="rp-btn-remove" onClick={() => removerSemana(s.num)}>✕ Remover</button>
                      )}
                    </div>
                    {[
                      ['data', 'DATA | TÍTULO DO DIA', 'ex: 03/03 - 09/03'],
                      ['presidente', 'PRESIDENTE', 'Nome'],
                      ['orador', 'ORADOR', 'Nome'],
                      ['congregacao', 'CONGREGAÇÃO DO ORADOR', 'Nome'],
                      ['tema', 'TEMA', 'Tema do discurso'],
                      ['leitor', 'LEITOR', 'Nome'],
                      ['orafinal', 'ORAÇÃO FINAL', 'Nome'],
                    ].map(([campo, label, placeholder]) => (
                      <div className="rp-bloco" key={campo}>
                        <label>{label}</label>
                        <input type="text" placeholder={placeholder}
                          value={s[campo]}
                          onChange={e => atualizarSemana(s.num, campo, e.target.value)} />
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="rp-btn-add-sem" onClick={adicionarSemana}>+ Adicionar Dia</button>
                </div>
              </div>
            </article>
          </section>

          {/* ── PREVIEW ─────────────────────────────────────── */}
          <section className="rp-previsu" ref={previewRef}>
            <div className="rp-titu-prev">
              <p className="rp-des">Programação Reunião Pública</p>
              <div className="rp-cong-bar">Congregação: <span>{congregacao}</span></div>
            </div>
            <div className="rp-mes-ano">
              <p className="rp-mes">{(mes || '').toUpperCase()}</p>
              <p className="rp-ano">{ano}</p>
            </div>
            <div className="rp-img-pre">
              <div><img src={oradorImg} alt="Orador" /></div>
              <div className="rp-tabelas-wrapper">
                {semanas.map(s => (
                  <div key={s.num} style={{ marginBottom: '0.2cm' }}>
                    <table className="rp-semanas-table">
                      <tbody>
                        <tr className="rp-semana-titulo">
                          <th colSpan={99}>{s.data ? `DIA: ${s.data}` : `DIA ${s.num}`}</th>
                        </tr>
                        <TrLinha label="PRESIDENTE:" valor={s.presidente} />
                        <TrLinha label="ORADOR:" valor={s.orador} />
                        <TrLinha label="CONGREGAÇÃO:" valor={s.congregacao} />
                        <TrLinha label="TEMA:" valor={s.tema} />
                        <TrLinha label="LEITOR:" valor={s.leitor} />
                        <TrLinha label="ORAÇÃO FINAL:" valor={s.orafinal} />
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>{/* /page-wrap */}
    </>
  )
}

/* ════════════════════════════════════════════════════════
   ESTILOS SCOPED — idênticos ao original
   ════════════════════════════════════════════════════════ */
const RP_STYLES = `
  .page-wrap {
    margin-top: var(--shell-total-top);
  }

  .rp-layout {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    padding: 2px 16px 80px;
    margin-top: 0;
    background: #E9ECEF;
    min-height: 100%;
  }
  .rp-editor {
    margin: 10px 0;
    width: 380px;
    flex-shrink: 0;
    padding: 1rem;
    box-shadow: 2px 2px 8px rgba(26,26,46,.3);
    border-radius: 15px;
    background: var(--cell-bg);
  }
  .rp-campo {
    background: var(--border);
    border-radius: 15px;
    padding: 15px 0 20px;
    margin-bottom: 10px;
  }
  .rp-titu p { font-size:18px; font-weight:600; color:var(--navy-dark); padding:4px 0; }
  .rp-titu hr { border:2px solid var(--gold); border-radius:5px; box-shadow:1px 1px 1px var(--gold-light); margin-bottom:5px; }
  .rp-bloco { margin-top:5px; display:flex; flex-direction:column; justify-content:center; }
  .rp-bloco label { width:90%; margin:0 auto; font-size:16px; margin-top:6px; color:var(--navy-dark); font-weight:700; letter-spacing:.5px; display:block; }
  .rp-bloco input { padding:10px 12px; width:90%; margin:3px auto; border:1px solid var(--border); border-radius:6px; font-size:16px; display:block; box-sizing:border-box; }
  .rp-bloco input:focus { outline:2px solid var(--navy-light); }
  .rp-btn-remove { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.2); color:#ef4444; border-radius:6px; padding:3px 10px; font-size:12px; cursor:pointer; }
  .rp-btn-add-sem { padding:8px 16px; border-radius:10px; background:var(--gold); color:var(--navy-dark); font-weight:700; border:1px solid var(--border); cursor:pointer; }
  .rp-btn-add-sem:hover { background:var(--gold-light); }
  /* Preview */
  .rp-previsu {
    display: none;
    width: 210mm;
    height: 297mm;
    background: #fff;
    border: 2px solid #aaa;
    padding: .5cm;
    flex-shrink: 0;
  }
  .rp-titu-prev { margin-bottom:6px; }
  .rp-des { display:flex; align-items:center; justify-content:center; font-size:24pt; font-weight:600; background:var(--teal); text-shadow:1px 1px 4px var(--teal-dark); border-radius:0 0 0 40px; height:1.2cm; letter-spacing:2px; }
  .rp-cong-bar { margin-top:-2px; margin-left:auto; font-size:13pt; font-weight:500; background:var(--teal); text-shadow:1px 1px 4px var(--teal-dark); border-radius:0 0 0 40px; height:.8cm; width:125mm; display:flex; align-items:center; gap:5px; padding-left:14px; border-bottom:2px solid black; }
  .rp-mes-ano { display:flex; flex-direction:column; align-items:center; margin-right:120mm; }
  .rp-mes { font-size:18pt; font-weight:700; letter-spacing:3px; }
  .rp-ano { font-size:16pt; font-weight:400; color:#555; }
  .rp-img-pre { display:flex; justify-content:center; align-items:center; }
  .rp-img-pre img { width:9cm; }
  .rp-tabelas-wrapper { flex:1; }
  .rp-semanas-table { width:100%; border-collapse:collapse; font-size:12pt; table-layout:auto; }
  .rp-semana-titulo th { background:var(--navy-light); color:var(--text); text-align:left; padding:3px 7px; border:1px solid #999; font-size:12pt; letter-spacing:1px; }
  .rp-semanas-table td { border:1px solid #bbb; padding:2px 7px; vertical-align:middle; font-size:11pt; background:#fff; min-width:30mm; }
  .rp-cat-label { background:#e8eef7!important; color:var(--navy-dark); font-weight:700; font-size:12pt; text-align:right; white-space:nowrap; min-width:0; width:1%; padding-right:8px!important; }
  /* Desktop: exibe preview ao lado */
  @media (min-width: 1200px) {
    .rp-previsu { display:block; }
    .rp-layout { align-items:flex-start; }
  }
  @media (max-width: 699px) {
    .page-wrap {
      margin-top: 0;
    }
  }

`
