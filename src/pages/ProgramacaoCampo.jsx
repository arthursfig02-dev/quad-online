/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from 'react'
import Toast from '../components/ui/Toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import ExportOverlay from '../components/ui/ExportOverlay'
import PageActionBar from '../components/ui/PageActionBar'
import PreviewModal from '../components/ui/PreviewModal'
import { useExportTheme } from '../hooks/useExportTheme'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_FULL = ['Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado', 'Domingo']
const CORES_BG = ['#fffbe6', '#ffefc0', '#ffd780', '#ffc14d', '#f5a623']

function diaSemanaIdx(jsDay) { return (jsDay + 6) % 7 }

function gerarSemanas(ano, mes) {
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const offset = diaSemanaIdx(primeiroDia)
  const grade = []
  for (let i = 0; i < offset; i++) grade.push(null)
  for (let d = 1; d <= totalDias; d++) grade.push(d)
  while (grade.length % 7 !== 0) grade.push(null)
  const semanas = []
  for (let i = 0; i < grade.length; i += 7) semanas.push(grade.slice(i, i + 7))
  return semanas
}

/* ── Modal de horário ── */
function ModalHorario({ ctx, onClose, onSave, ano, mes }) {
  const [horario, setHorario] = useState(ctx?.dado?.horario || '')
  const [local, setLocal] = useState(ctx?.dado?.local || '')
  const [dirigente, setDirigente] = useState(ctx?.dado?.dirigente || '')
  const [replicar, setReplicar] = useState(false)

  if (!ctx) return null

  const date = new Date(ano, mes, ctx.diaNum)
  const jsDay = date.getDay()
  const idx = diaSemanaIdx(jsDay)
  const nomeDia = DIAS_FULL[idx]

  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const temProximos = ctx.diaNum + 7 <= totalDias

  return (
    <div className="pc-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pc-modal">
        <h3>{ctx.hi === null ? 'Adicionar horário' : 'Editar horário'}</h3>
        <p className="pc-modal-sub">Dia {ctx.diaNum}</p>
        <div className="pc-campo"><label>Horário</label>
          <input type="time" value={horario} onChange={e => setHorario(e.target.value)} autoFocus />
        </div>
        <div className="pc-campo"><label>Local</label>
          <input type="text" placeholder="Local do campo" value={local} onChange={e => setLocal(e.target.value)} />
        </div>
        <div className="pc-campo"><label>Dirigente</label>
          <input type="text" placeholder="Nome do dirigente" value={dirigente} onChange={e => setDirigente(e.target.value)} />
        </div>
        {temProximos && (
          <div className="pc-campo-checkbox">
            <input
              type="checkbox"
              id="replicar-checkbox"
              checked={replicar}
              onChange={e => setReplicar(e.target.checked)}
            />
            <label htmlFor="replicar-checkbox">Replicar para as próximas {nomeDia}s do mês</label>
          </div>
        )}
        <div className="pc-modal-acoes">
          <button className="pc-btn-aplicar" onClick={() => onSave({ horario, local, dirigente }, replicar)}>Aplicar</button>
          <button className="pc-btn-cancelar" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   PÁGINA
   ════════════════════════════════════════════════════════ */
export default function ProgramacaoCampo() {
  const toastRef = useRef()
  const docRef = useRef()
  const wrapperRef = useRef()
  const skipAutoSaveRef = useRef(false)
  const { applyTheme, removeTheme } = useExportTheme('pc')   // ref para o wrapper oculto — garante devolução correta

  const agora = new Date()
  const [anoAtual, setAnoAtual] = useState(agora.getFullYear())
  const [mesAtual, setMesAtual] = useState(agora.getMonth())
  const [congreg, setCongr] = useState('')
  const [dados, setDados] = useState({})
  const [destaques, setDestaques] = useState({})
  const [obs, setObs] = useState({})
  const [obsSemanas, setObsSemanas] = useState({})
  const [modalCtx, setModalCtx] = useState(null)
  const [showPrev, setShowPrev] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [overlay, setOverlay] = useState({ visible: false, msg: '' })

  /* ── localStorage ── */
  function chaveLS(ano = anoAtual, mes = mesAtual) {
    return `programacao-campo:${ano}-${mes}`
  }
  function salvarLS(d = dados, dest = destaques, o = obs, cong = congreg, obsS = obsSemanas) {
    localStorage.setItem(chaveLS(), JSON.stringify({
      dados: d, diasDestacados: dest, observacoes: o, congregacao: cong, obsSemanas: obsS,
    }))
  }
  function carregarLS(ano = anoAtual, mes = mesAtual) {
    try {
      const raw = localStorage.getItem(chaveLS(ano, mes))
      if (!raw) return { dados: {}, diasDestacados: {}, observacoes: {}, congregacao: '', obsSemanas: {} }
      const parsed = JSON.parse(raw)
      return {
        dados: parsed.dados || {},
        diasDestacados: parsed.diasDestacados || {},
        observacoes: parsed.observacoes || {},
        congregacao: parsed.congregacao || '',
        obsSemanas: parsed.obsSemanas || {},
      }
    } catch { return { dados: {}, diasDestacados: {}, observacoes: {}, congregacao: '', obsSemanas: {} } }
  }

  useEffect(() => {
    const d = carregarLS(anoAtual, mesAtual)
    setDados(d.dados || {})
    setDestaques(d.diasDestacados || {})
    setObs(d.observacoes || {})
    setCongr(d.congregacao || '')
    setObsSemanas(d.obsSemanas || {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoAtual, mesAtual])

  /* ── troca mês ── */
  function trocarMes(novoAno, novoMes) {
    setAnoAtual(novoAno)
    setMesAtual(novoMes)
    setDados({}); setDestaques({}); setObs({}); setCongr(''); setObsSemanas({})
  }

  /* ── horários ── */
  function abrirModal(diaNum, hi, dado) { setModalCtx({ diaNum, hi, dado }) }
  function fecharModal() { setModalCtx(null) }

  function salvarHorario(novoDado, replicar) {
    setDados(prev => {
      const next = { ...prev }
      if (replicar) {
        const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate()
        for (let d = modalCtx.diaNum; d <= totalDias; d += 7) {
          const lista = [...(next[d] || [])]
          if (d === modalCtx.diaNum) {
            if (modalCtx.hi === null) {
              lista.push(novoDado)
            } else {
              lista[modalCtx.hi] = novoDado
            }
          } else {
            if (modalCtx.hi === null) {
              lista.push({ ...novoDado })
            } else {
              if (modalCtx.hi < lista.length) {
                lista[modalCtx.hi] = { ...novoDado }
              } else {
                lista.push({ ...novoDado })
              }
            }
          }
          next[d] = lista
        }
      } else {
        const lista = [...(next[modalCtx.diaNum] || [])]
        if (modalCtx.hi === null) lista.push(novoDado)
        else lista[modalCtx.hi] = novoDado
        next[modalCtx.diaNum] = lista
      }
      salvarLS(next, destaques, obs, congreg)
      return next
    })
    fecharModal()
  }
  function removerHorario(diaNum, hi) {
    setDados(prev => {
      const next = { ...prev }
      const lista = [...(next[diaNum] || [])]
      lista.splice(hi, 1)
      next[diaNum] = lista
      salvarLS(next, destaques, obs, congreg)
      return next
    })
  }
  function toggleDestaque(diaNum) {
    setDestaques(prev => {
      const next = { ...prev, [diaNum]: !prev[diaNum] }
      salvarLS(dados, next, obs, congreg)
      return next
    })
  }
  function atualizarObs(diaNum, valor) {
    setObs(prev => {
      const next = { ...prev, [diaNum]: valor }
      salvarLS(dados, destaques, next, congreg)
      return next
    })
  }
  function atualizarObsSemana(semanaIdx, valor) {
    setObsSemanas(prev => {
      const next = { ...prev, [semanaIdx]: valor }
      salvarLS(dados, destaques, obs, congreg, next)
      return next
    })
  }
  function atualizarCongr(val) {
    setCongr(val)
    salvarLS(dados, destaques, obs, val)
  }

  /* ── Salvar / Carregar explícitos ── */
  function salvarDados() {
    salvarLS(dados, destaques, obs, congreg)
    toastRef.current?.show('✔ Dados salvos!', 'success')
  }
  function carregarDados() {
    const d = carregarLS(anoAtual, mesAtual)
    setDados(d.dados || {})
    setDestaques(d.diasDestacados || {})
    setObs(d.observacoes || {})
    setCongr(d.congregacao || '')
    setObsSemanas(d.obsSemanas || {})
    toastRef.current?.show('📂 Dados carregados!', 'info')
  }

  function limparFormulario() {
    skipAutoSaveRef.current = true
    localStorage.removeItem(chaveLS())
    setDados({})
    setDestaques({})
    setObs({})
    setCongr('')
    setObsSemanas({})
    setClearConfirmOpen(false)
    toastRef.current?.show('Formulário e histórico limpos.', 'success')
  }

  /* ── Captura do documento A4 ───────────────────────────────────────
   *
   * CORREÇÕES aplicadas:
   * 1. Removido windowWidth/windowHeight — causavam inconsistência de layout
   *    em mobile porque o html2canvas resolvia media queries com viewport
   *    falsa diferente do container real.
   * 2. O elemento é revelado no wrapper original (não movido), capturado,
   *    e escondido novamente — sem risco de perder a referência do nó.
   * 3. Delay generoso (800ms) para garantir que o React renderizou os dados
   *    atuais no documento antes da captura.
   * ─────────────────────────────────────────────────────────────────── */
  const capturarDoc = useCallback(async () => {
    const el = docRef.current
    if (!el) throw new Error('Documento não encontrado')

    // Revela o elemento mantendo-o no wrapper original
    el.style.visibility = 'visible'
    el.style.position = 'relative'

    // Injeta tema antes da captura
    applyTheme(el)

    // Aguarda dois frames + delay para layout estabilizar
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise(r => setTimeout(r, 800))

    let canvas
    try {
      canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        width: 794,
        height: 1123,
        // SEM windowWidth/windowHeight — deixa o browser usar a viewport real
      })
    } finally {
      // Remove tema e esconde de volta
      removeTheme(el)
      el.style.visibility = 'hidden'
      el.style.position = 'absolute'
    }

    return canvas
  }, [applyTheme, removeTheme])

  /* ── Exportações ── */
  async function exportarPDF() {
    setOverlay({ visible: true, msg: 'Gerando PDF…' })
    try {
      const canvas = await capturarDoc()
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297)

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobile) {
        const blob = pdf.output('blob')
        const file = new File([blob], `programacao-campo-${MESES_NOMES[mesAtual].toLowerCase()}-${anoAtual}.pdf`, { type: 'application/pdf' })
        let shared = false
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'Programação de Campo' }); shared = true }
          catch { /* cancelado */ }
        }
        if (!shared) _blobDownload(blob, file.name)
      } else {
        pdf.save(`programacao-campo-${MESES_NOMES[mesAtual].toLowerCase()}-${anoAtual}.pdf`)
      }
      toastRef.current?.show('✔ PDF exportado!', 'success')
    } catch (e) {
      console.error(e)
      toastRef.current?.show('Erro ao gerar PDF.', 'error')
    }
    setOverlay({ visible: false, msg: '' })
  }

  async function exportarIMG() {
    setOverlay({ visible: true, msg: 'Gerando imagem…' })
    try {
      const canvas = await capturarDoc()
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const blob = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob falhou')), 'image/jpeg', 0.95)
      )
      const name = `programacao-campo-${MESES_NOMES[mesAtual].toLowerCase()}-${anoAtual}.jpg`
      const file = new File([blob], name, { type: 'image/jpeg' })

      if (isMobile) {
        let shared = false
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: 'Programação de Campo' }); shared = true }
          catch { /* cancelado */ }
        }
        if (!shared) _blobDownload(blob, name)
      } else {
        _blobDownload(blob, name)
      }
      toastRef.current?.show('✔ Imagem exportada!', 'success')
    } catch (e) {
      console.error(e)
      toastRef.current?.show('Erro ao gerar imagem.', 'error')
    }
    setOverlay({ visible: false, msg: '' })
  }

  async function imprimirDoc() {
    try {
      const canvas = await capturarDoc()
      const imgSrc = canvas.toDataURL('image/jpeg', 0.95)
      const win = window.open('', '_blank')
      if (!win) { toastRef.current?.show('Popup bloqueado.', 'warning'); return }
        win.document.write(`<!DOCTYPE html><html><head><title>Programação de Campo</title>
        <style>@page{margin:0;size:A4}body{margin:0;padding:0}img{width:100%;height:auto;display:block}</style>
        </head><body><img src="${imgSrc}" />
        <script>window.onload=function(){window.print()}</script></body></html>`)
      win.document.close()
    } catch { toastRef.current?.show('Erro ao imprimir.', 'error') }
  }

  const capturarSemanaDoc = useCallback(async (si) => {
    const el = document.getElementById(`pc-semana-documento-exportavel-${si}`)
    if (!el) throw new Error(`Documento da semana ${si} não encontrado`)

    // Revela o elemento mantendo-o no wrapper original
    el.style.visibility = 'visible'
    el.style.position = 'relative'

    // Injeta tema antes da captura
    applyTheme(el)

    // Aguarda dois frames + delay para layout estabilizar
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise(r => setTimeout(r, 800))

    let canvas
    try {
      canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        width: 794,
      })
    } finally {
      // Remove tema e esconde de volta
      removeTheme(el)
      el.style.visibility = 'hidden'
      el.style.position = 'absolute'
    }

    return canvas
  }, [applyTheme, removeTheme])

  async function exportarSemanaPDF(si) {
    setOverlay({ visible: true, msg: 'Gerando PDF da semana…' })
    try {
      const canvas = await capturarSemanaDoc(si)
      const widthMm = (canvas.width * 25.4) / 96
      const heightMm = (canvas.height * 25.4) / 96
      const pdf = new jsPDF({
        orientation: widthMm > heightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [widthMm, heightMm]
      })
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, widthMm, heightMm)

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const fileName = `semana-${si + 1}-campo-${MESES_NOMES[mesAtual].toLowerCase()}-${anoAtual}.pdf`
      if (isMobile) {
        const blob = pdf.output('blob')
        const file = new File([blob], fileName, { type: 'application/pdf' })
        let shared = false
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: `Semana ${si + 1} - Programação de Campo` }); shared = true }
          catch { /* cancelado */ }
        }
        if (!shared) _blobDownload(blob, fileName)
      } else {
        pdf.save(fileName)
      }
      toastRef.current?.show('✔ PDF da semana exportado!', 'success')
    } catch (e) {
      console.error(e)
      toastRef.current?.show('Erro ao gerar PDF da semana.', 'error')
    }
    setOverlay({ visible: false, msg: '' })
  }

  async function exportarSemanaIMG(si) {
    setOverlay({ visible: true, msg: 'Gerando imagem da semana…' })
    try {
      const canvas = await capturarSemanaDoc(si)
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const blob = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob falhou')), 'image/jpeg', 0.95)
      )
      const name = `semana-${si + 1}-campo-${MESES_NOMES[mesAtual].toLowerCase()}-${anoAtual}.jpg`
      const file = new File([blob], name, { type: 'image/jpeg' })

      if (isMobile) {
        let shared = false
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: `Semana ${si + 1} - Programação de Campo` }); shared = true }
          catch { /* cancelado */ }
        }
        if (!shared) _blobDownload(blob, name)
      } else {
        _blobDownload(blob, name)
      }
      toastRef.current?.show('✔ Imagem da semana exportada!', 'success')
    } catch (e) {
      console.error(e)
      toastRef.current?.show('Erro ao gerar imagem da semana.', 'error')
    }
    setOverlay({ visible: false, msg: '' })
  }

  const semanas = gerarSemanas(anoAtual, mesAtual)

  const actions = [
    { id: 'salvar', icon: 'fa-cloud-arrow-up', label: 'Salvar', onClick: salvarDados },
    { id: 'carregar', icon: 'fa-cloud-arrow-down', label: 'Carregar', onClick: carregarDados },
    { id: 'preview', icon: 'fa-eye', label: 'Pré-Visualizar', onClick: () => setShowPrev(true) },
    { id: 'imprimir', icon: 'fa-print', label: 'Imprimir', onClick: imprimirDoc },
    { id: 'pdf', icon: 'fa-file-pdf', label: 'Baixar PDF', onClick: exportarPDF },
    { id: 'foto', icon: 'fa-image', label: 'Baixar Foto', onClick: exportarIMG },
    { id: 'limpar', icon: 'fa-trash-can', label: 'Limpar', onClick: () => setClearConfirmOpen(true) },
  ]

  return (
    <>
      <style>{PC_STYLES}</style>
      <ExportOverlay visible={overlay.visible} msg={overlay.msg} />
      <Toast ref={toastRef} />
      <PageActionBar actions={actions} />

      <ConfirmDialog
        open={clearConfirmOpen}
        title="Limpar tudo?"
        message="Isso vai apagar todo o formulário e o histórico salvo deste mês."
        confirmLabel="Limpar tudo"
        cancelLabel="Cancelar"
        danger
        onConfirm={limparFormulario}
        onCancel={() => setClearConfirmOpen(false)}
      />
      {/* Modal horário */}
      {modalCtx && <ModalHorario key={`${modalCtx.diaNum}-${modalCtx.hi}`} ctx={modalCtx} ano={anoAtual} mes={mesAtual} onClose={fecharModal} onSave={salvarHorario} />}

      {/* Preview — usa PreviewModal unificado com docRef */}
      {showPrev && (
        <PreviewModal
          docRef={docRef}
          wrapperRef={wrapperRef}
          onClose={() => setShowPrev(false)}
          title="Programação de Campo"
          applyTheme={applyTheme}
        />
      )}

      <div className="pc-app">
        <aside className="pc-painel-form">
          <PageHeader
            icon="fa-calendar-days"
            title="Programação de Campo"
            subtitle="Calendário mensal de campo"
            color="#3b2d25"
          />

          <div>
            <p className="pc-secao-titulo">Informações gerais</p>
            <div className="pc-cabecalho-inputs">
              <div className="pc-campo">
                <label>Mês</label>
                <select value={mesAtual} onChange={e => trocarMes(anoAtual, +e.target.value)}>
                  {MESES_NOMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="pc-campo">
                <label>Ano</label>
                <select value={anoAtual} onChange={e => trocarMes(+e.target.value, mesAtual)}>
                  {Array.from({ length: 8 }, (_, i) => agora.getFullYear() - 2 + i).map(a =>
                    <option key={a} value={a}>{a}</option>
                  )}
                </select>
              </div>
              <div className="pc-campo pc-campo-full">
                <label>Congregação</label>
                <input type="text" placeholder="Nome da congregação"
                  value={congreg} onChange={e => atualizarCongr(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <p className="pc-secao-titulo">Calendário do mês</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {semanas.map((semana, si) => {
                const diasValidos = semana.filter(d => d !== null)
                const de = diasValidos[0]
                const ate = diasValidos[diasValidos.length - 1]
                return (
                  <div key={si} className="pc-semana-bloco">
                    <div className="pc-semana-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Semana {si + 1}</span>
                        <span className="pc-semana-datas">
                          {de ? `${de}/${mesAtual + 1}` : ''}
                          {de && ate ? ' — ' : ''}
                          {ate ? `${ate}/${mesAtual + 1}` : ''}
                        </span>
                      </div>
                      <div className="pc-semana-export-acoes" style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="pc-semana-btn-export" title="Exportar PDF da Semana" onClick={() => exportarSemanaPDF(si)}>
                          <i className="fa-solid fa-file-pdf"></i> PDF
                        </button>
                        <button className="pc-semana-btn-export" title="Exportar Foto da Semana" onClick={() => exportarSemanaIMG(si)}>
                          <i className="fa-solid fa-image"></i> Foto
                        </button>
                      </div>
                    </div>
                    <div className="pc-dias-grid-wrap">
                      <div className="pc-dias-grid">
                        {DIAS_FULL.map(d => (
                          <div key={d} className="pc-dia-col-header">{d.split('-')[0]}</div>
                        ))}
                        {semana.map((diaNum, di) => {
                          if (diaNum === null) return <div key={di} className="pc-dia-celula pc-vazio" />
                          const hs = dados[diaNum] || []
                          const dest = !!destaques[diaNum]
                          const obsVal = obs[diaNum] || ''
                          return (
                            <div key={di} className={`pc-dia-celula${dest ? ' pc-destaque' : ''}`}>
                              <div className="pc-dia-destaque-wrap">
                                <input type="checkbox" checked={dest}
                                  onChange={() => toggleDestaque(diaNum)} id={`dest-${diaNum}`} />
                                <label htmlFor={`dest-${diaNum}`}>dest.</label>
                              </div>
                              <span className="pc-dia-numero">{diaNum}</span>
                              {hs.map((h, hi) => (
                                <div key={hi} className="pc-horario-item"
                                  style={{ background: CORES_BG[hi % 5] }}>
                                  <span className="pc-hi-horario">{h.horario}</span>
                                  <span className="pc-hi-info">{h.local}</span>
                                  <span className="pc-hi-info">{h.dirigente}</span>
                                  <div className="pc-hi-acoes">
                                    <button className="pc-hi-btn pc-hi-btn-edit"
                                      onClick={() => abrirModal(diaNum, hi, h)}>✏ Editar</button>
                                    <button className="pc-hi-btn pc-hi-btn-del"
                                      onClick={() => removerHorario(diaNum, hi)}>✕</button>
                                  </div>
                                </div>
                              ))}
                              <div className="pc-dia-obs-wrap">
                                <textarea className="pc-dia-obs-input" placeholder="Obs..."
                                  value={obsVal}
                                  onChange={e => atualizarObs(diaNum, e.target.value)} />
                              </div>
                              <button className="pc-btn-add-horario"
                                onClick={() => abrirModal(diaNum, null, null)}>+ Horário</button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className="pc-semana-obs-semana-wrap">
                      <div className="pc-campo">
                        <label>Observação da Semana {si + 1}</label>
                        <textarea
                          className="pc-semana-obs-semana-textarea"
                          placeholder="Digite observações para esta semana (exibidas apenas na exportação desta semana)..."
                          value={obsSemanas[si] || ''}
                          onChange={e => atualizarObsSemana(si, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Documento A4 — sempre no DOM, fora da tela, capturado via docRef */}
      <div
        ref={wrapperRef}
        style={{
          position: 'fixed', top: 0, left: '-9999px',
          width: '794px', background: '#fff',
          zIndex: -9999, pointerEvents: 'none', overflow: 'visible',
        }}
      >
        <div
          ref={docRef}
          id="pc-documento-exportavel"
          style={{ visibility: 'hidden', position: 'absolute' }}
        >
          <div className="pc-doc-cabecalho">
            <div className="pc-doc-ano-mes">
              <span className="pc-doc-ano">{anoAtual}</span>
              <span className="pc-doc-mes">{MESES_NOMES[mesAtual]}</span>
            </div>
            <div className="pc-doc-porcon">
              <h2>Programação Mensal de Campo</h2>
              <div className="pc-doc-cong">{congreg || '—'}</div>
            </div>
          </div>
          <table className="pc-doc-tabela">
            <thead>
              <tr>{DIAS_FULL.map(d => <th key={d}>{d}</th>)}</tr>
            </thead>
            <tbody>
              {semanas.map((semana, si) => (
                <tr key={si}>
                  {semana.map((diaNum, di) => {
                    if (diaNum === null) return <td key={di} className="pc-doc-td-vazio" />
                    const hs = dados[diaNum] || []
                    const dest = !!destaques[diaNum]
                    const obsV = obs[diaNum] || ''
                    return (
                      <td key={di}
                        style={dest ? { background: '#fff8e1', border: '2px solid #e6a817' } : {}}>
                        <span className={`pc-doc-dia-num${dest ? ' pc-doc-dia-num-dest' : ''}`}>{diaNum}</span>
                        {obsV && <div className="pc-doc-obs">{obsV}</div>}
                        {hs.map((h, hi) => (
                          <div key={hi} className="pc-doc-horario-entry"
                            style={{ background: CORES_BG[hi % 5] }}>
                            <span className="pc-dh-label">Horário:</span>
                            <span className="pc-dh-val">{h.horario}</span>
                            <span className="pc-dh-label">Local:</span>
                            <span className="pc-dh-val">{h.local}</span>
                            <span className="pc-dh-label">Dirigente:</span>
                            <span className="pc-dh-val">{h.dirigente}</span>
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documentos semanais para exportação — fora da tela */}
      <div
        style={{
          position: 'fixed', top: 0, left: '-9999px',
          width: '794px', background: '#fff',
          zIndex: -9999, pointerEvents: 'none', overflow: 'visible',
        }}
      >
        {semanas.map((semana, si) => {
          const diasValidos = semana.filter(d => d !== null)
          const de = diasValidos[0]
          const ate = diasValidos[diasValidos.length - 1]
          return (
            <div
              key={si}
              id={`pc-semana-documento-exportavel-${si}`}
              className="pc-semana-doc-exportavel"
              style={{ visibility: 'hidden', position: 'absolute' }}
            >
              <div className="pc-doc-cabecalho">
                <div className="pc-doc-ano-mes">
                  <span className="pc-doc-ano">{anoAtual}</span>
                  <span className="pc-doc-mes">{MESES_NOMES[mesAtual]}</span>
                </div>
                <div className="pc-doc-porcon">
                  <h2>Programação Semanal de Campo</h2>
                  <div className="pc-doc-semana-info" style={{ fontSize: '11px', fontWeight: 'bold', color: '#3b2d25', marginTop: '2px' }}>
                    Semana {si + 1} {de ? `(${de}/${mesAtual + 1}${ate ? ` — ${ate}/${mesAtual + 1}` : ''})` : ''}
                  </div>
                  <div className="pc-doc-cong">{congreg || '—'}</div>
                </div>
              </div>
              <table className="pc-doc-tabela">
                <thead>
                  <tr>{DIAS_FULL.map(d => <th key={d}>{d}</th>)}</tr>
                </thead>
                <tbody>
                  <tr>
                    {semana.map((diaNum, di) => {
                      if (diaNum === null) return <td key={di} className="pc-doc-td-vazio" />
                      const hs = dados[diaNum] || []
                      const dest = !!destaques[diaNum]
                      const obsV = obs[diaNum] || ''
                      return (
                        <td key={di}
                          style={dest ? { background: '#fff8e1', border: '2px solid #e6a817' } : {}}>
                          <span className={`pc-doc-dia-num${dest ? ' pc-doc-dia-num-dest' : ''}`}>{diaNum}</span>
                          {obsV && <div className="pc-doc-obs">{obsV}</div>}
                          {hs.map((h, hi) => (
                            <div key={hi} className="pc-doc-horario-entry"
                              style={{ background: CORES_BG[hi % 5] }}>
                              <span className="pc-dh-label">Horário:</span>
                              <span className="pc-dh-val">{h.horario}</span>
                              <span className="pc-dh-label">Local:</span>
                              <span className="pc-dh-val">{h.local}</span>
                              <span className="pc-dh-label">Dirigente:</span>
                              <span className="pc-dh-val">{h.dirigente}</span>
                            </div>
                          ))}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
              {obsSemanas[si] && (
                <div className="pc-doc-semana-obs">
                  <div className="pc-doc-semana-obs-titulo">Observações da Semana</div>
                  <div className="pc-doc-semana-obs-conteudo">{obsSemanas[si]}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function _blobDownload(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

const PC_STYLES = `
  .pc-app {
    padding-top: var(--shell-total-top);
    min-height: 100%;
    background: #f5f0eb;
  }
  .pc-painel-form {
    background: #fff;
    padding: 0 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }
  .pc-secao-titulo { font-size:.7rem; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#7a6a62; margin-bottom:.6rem; }
  .pc-cabecalho-inputs { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  .pc-campo-full { grid-column:1/-1; }
  .pc-campo { display:flex; flex-direction:column; gap:.3rem; }
  .pc-campo label { font-size:.72rem; font-weight:500; letter-spacing:.05em; text-transform:uppercase; color:#7a6a62; }
  .pc-campo input, .pc-campo select { background:#faf7f5; border:1px solid #d5c8c0; border-radius:7px; padding:.6rem .75rem; font-size:.95rem; color:#1c1410; width:100%; transition:border-color .15s; box-sizing:border-box; }
  .pc-campo input:focus, .pc-campo select:focus { outline:none; border-color:#8b5e3c; box-shadow:0 0 0 3px rgba(139,94,60,.12); }
  .pc-semana-bloco { background:#faf7f5; border:1px solid #d5c8c0; border-radius:10px; overflow:hidden; }
  .pc-semana-header { display:flex; align-items:center; justify-content:space-between; padding:.5rem 1rem; background:#3b2d25; color:#f5f0eb; font-size:.95rem; }
  .pc-semana-datas { font-size:.72rem; opacity:.7; font-style:italic; }
  .pc-dias-grid-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .pc-dias-grid { display:grid; grid-template-columns:repeat(7,minmax(90px,1fr)); min-width:630px; }
  .pc-dia-col-header { font-size:.7rem; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:#7a6a62; text-align:center; padding:.45rem .2rem; border-bottom:1px solid #d5c8c0; border-right:1px solid #d5c8c0; background:#f0eae5; }
  .pc-dia-col-header:last-child { border-right:none; }
  .pc-dia-celula { border-right:1px solid #d5c8c0; border-bottom:1px solid #d5c8c0; min-height:110px; padding:.35rem; display:flex; flex-direction:column; gap:.25rem; position:relative; }
  .pc-dia-celula:nth-child(7n) { border-right:none; }
  .pc-dia-celula.pc-destaque { background:#fff8e1; box-shadow:inset 0 0 0 2px #e6a817; }
  .pc-dia-celula.pc-destaque .pc-dia-numero { color:#b56f00; }
  .pc-dia-celula.pc-vazio { background:#f0ebe6; pointer-events:none; }
  .pc-dia-destaque-wrap { position:absolute; top:4px; right:4px; display:flex; align-items:center; gap:3px; }
  .pc-dia-destaque-wrap label { font-size:.6rem; color:#7a6a62; cursor:pointer; letter-spacing:.04em; text-transform:uppercase; }
  .pc-dia-destaque-wrap input[type=checkbox] { accent-color:#e6a817; width:13px; height:13px; cursor:pointer; }
  .pc-dia-numero { font-size:1.3rem; font-weight:600; color:#8b5e3c; line-height:1; padding:1px 2px; }
  .pc-horario-item { border:1px solid #d5c8c0; border-radius:5px; padding:.3rem .4rem; font-size:.78rem; line-height:1.5; }
  .pc-hi-horario { font-weight:700; color:#3b2d25; display:block; font-size:.82rem; }
  .pc-hi-info { color:#7a6a62; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pc-hi-acoes { display:flex; gap:6px; margin-top:4px; }
  .pc-hi-btn { background:transparent; border:none; font-size:.75rem; cursor:pointer; padding:5px 7px; min-height:34px; text-decoration:underline; display:flex; align-items:center; }
  .pc-hi-btn-edit { color:#8b5e3c; }
  .pc-hi-btn-del  { color:#8b3a3a; }
  .pc-btn-add-horario { background:transparent; border:1px dashed #d5c8c0; border-radius:6px; cursor:pointer; color:#7a6a62; font-size:.8rem; padding:.5rem 0; width:100%; margin-top:auto; min-height:40px; transition:all .15s; }
  .pc-btn-add-horario:hover { border-color:#8b5e3c; color:#8b5e3c; }
  .pc-dia-obs-wrap { margin-top:2px; }
  .pc-dia-obs-input { width:100%; font-size:.72rem; color:#1c1410; background:rgba(255,255,255,.7); border:1px dashed #d5c8c0; border-radius:4px; padding:3px 5px; resize:none; outline:none; transition:border-color .15s; line-height:1.4; min-height:28px; box-sizing:border-box; }
  .pc-dia-obs-input:focus { border-color:#8b5e3c; background:#fff; }
  .pc-modal-overlay { display:flex; position:fixed; inset:0; z-index:1000; background:rgba(28,20,16,.55); backdrop-filter:blur(3px); align-items:center; justify-content:center; }
  .pc-modal { background:#fff; border-radius:14px; padding:2rem; width:min(400px,92vw); box-shadow:0 16px 40px rgba(28,20,16,.3); max-height:90vh; overflow-y:auto; }
  .pc-modal h3 { font-size:1.3rem; color:#1c1410; margin-bottom:.3rem; }
  .pc-modal-sub { font-size:.78rem; color:#7a6a62; margin-bottom:1.2rem; }
  .pc-modal .pc-campo { margin-bottom:.85rem; }
  .pc-campo-checkbox { display:flex; align-items:center; gap:.5rem; margin-bottom:.85rem; }
  .pc-campo-checkbox label { font-size:.85rem; color:#1c1410; cursor:pointer; }
  .pc-campo-checkbox input[type=checkbox] { accent-color:#8b5e3c; width:16px; height:16px; cursor:pointer; }
  .pc-modal-acoes { display:flex; gap:.75rem; margin-top:1.2rem; }
  .pc-btn-aplicar  { flex:1; padding:.7rem; border:none; border-radius:7px; font-size:.9rem; font-weight:500; cursor:pointer; background:#4a6b4a; color:#fff; }
  .pc-btn-aplicar:hover { background:#3a5a3a; }
  .pc-btn-cancelar { flex:1; padding:.7rem; border:none; border-radius:7px; font-size:.9rem; font-weight:500; cursor:pointer; background:#8b3a3a; color:#fff; }
  .pc-btn-cancelar:hover { background:#6e2c2c; }
  #pc-documento-exportavel { width:794px; height:1123px; background:#fff; padding:18px 22px; font-family:Arial,sans-serif; overflow:hidden; display:flex; flex-direction:column; flex-shrink:0; }
  .pc-doc-cabecalho { display:flex; justify-content:space-around; align-items:center; padding:6px 8px; border-bottom:2px solid black; background:#cbb3a6; margin-bottom:8px; flex-shrink:0; }
  .pc-doc-ano-mes { display:flex; flex-direction:column; align-items:center; }
  .pc-doc-ano { font-size:22px; font-weight:bold; display:block; }
  .pc-doc-mes { font-size:14px; border-bottom:2px solid black; padding:0 4px; display:block; }
  .pc-doc-porcon { display:flex; flex-direction:column; align-items:center; }
  .pc-doc-porcon h2 { font-size:13px; font-weight:bold; }
  .pc-doc-cong { font-size:12px; border:1px solid #888; padding:2px 8px; background:#f9f5f2; box-shadow:1px 1px 3px rgba(0,0,0,.15); margin-top:2px; }
  .pc-doc-tabela { width:100%; border-collapse:collapse; table-layout:fixed; flex:1; }
  .pc-doc-tabela th { border:1px solid black; padding:4px 3px; text-align:center; background:#cbb3a6; font-weight:bold; font-size:11px; }
  .pc-doc-tabela td { border:1px solid black; padding:3px; vertical-align:top; font-size:10px; word-wrap:break-word; }
  .pc-doc-td-vazio { background:repeating-linear-gradient(-45deg,#f5f0eb,#f5f0eb 3px,#ede6df 3px,#ede6df 4px)!important; }
  .pc-doc-dia-num { font-size:13px; font-weight:bold; color:#8b5e3c; display:block; margin-bottom:2px; }
  .pc-doc-dia-num-dest { color:#b56f00!important; }
  .pc-doc-obs { font-size:9px; font-style:italic; color:#555; background:#fffde7; border-left:2px solid #e6a817; padding:2px 4px; margin-bottom:3px; line-height:1.4; word-break:break-word; }
  .pc-doc-horario-entry { border-top:1px dashed #ccc; padding:2px 0; }
  .pc-doc-horario-entry:first-child { border-top:none; }
  .pc-dh-label { font-size:9px; color:#888; display:block; }
  .pc-dh-val   { font-size:11px; color:#111; font-weight:bold; display:block; line-height:1.3; }
  .pc-semana-btn-export { background:rgba(255,255,255,0.15); border:none; border-radius:4px; color:#f5f0eb; font-size:0.72rem; font-weight:500; padding:0.25rem 0.5rem; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:background 0.15s, transform 0.1s; }
  .pc-semana-btn-export:hover { background:rgba(255,255,255,0.3); }
  .pc-semana-btn-export:active { transform:scale(0.95); }
  .pc-semana-doc-exportavel { width:794px; background:#fff; padding:18px 22px; font-family:Arial,sans-serif; overflow:hidden; display:flex; flex-direction:column; flex-shrink:0; box-sizing:border-box; }
  .pc-semana-obs-semana-wrap {
    padding: .75rem;
    background: #f7f3f0;
    border-top: 1px solid #d5c8c0;
  }
  .pc-semana-obs-semana-textarea {
    background: #fff;
    border: 1px solid #d5c8c0;
    border-radius: 7px;
    padding: .5rem .75rem;
    font-size: .88rem;
    color: #1c1410;
    width: 100%;
    min-height: 48px;
    resize: vertical;
    box-sizing: border-box;
    transition: border-color .15s;
    font-family: inherit;
  }
  .pc-semana-obs-semana-textarea:focus {
    outline: none;
    border-color: #8b5e3c;
    box-shadow: 0 0 0 3px rgba(139,94,60,.12);
  }
  .pc-doc-semana-obs {
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid black;
    background: #fdfbf7;
    border-radius: 4px;
    text-align: left;
  }
  .pc-doc-semana-obs-titulo {
    font-size: 10px;
    font-weight: bold;
    color: #3b2d25;
    text-transform: uppercase;
    margin-bottom: 4px;
    border-bottom: 1px solid #000;
    padding-bottom: 2px;
  }
  .pc-doc-semana-obs-conteudo {
    font-size: 11px;
    color: #111;
    line-height: 1.4;
    white-space: pre-wrap;
  }
  @media (max-width: 699px) {
    .pc-app {
      padding-top: 2px;
    }
  }

`
