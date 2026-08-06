import { useState, useRef, useEffect, useMemo } from 'react'
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
import { checkAndImportFromUrl, generateShareUrl } from '../hooks/useUrlImport'
import ShareModal from '../components/ui/ShareModal'

const LS_KEY = 'arranjo-limpeza-grupos'

const getInitialGrupos = () => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const NOMES_MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

function formatarDD_MM(d) {
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

function formatarDataBr(dateStr) {
  if (!dateStr) return ''
  const [ano, mes, dia] = dateStr.split('-')
  return `${dia}/${mes}/${ano}`
}

// Ajusta qualquer data para a segunda-feira da mesma semana
function ajustarParaSegunda(dateStr) {
  if (!dateStr) return ''
  const [ano, mes, dia] = dateStr.split('-').map(Number)
  if (!ano || !mes || !dia) return dateStr

  const d = new Date(ano, mes - 1, dia)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day

  d.setDate(d.getDate() + diff)

  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Retorna a próxima ou atual segunda-feira no formato YYYY-MM-DD
function getProximaSegunda() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // ajusta se domingo
  const segunda = new Date(d.setDate(diff))
  const yyyy = segunda.getFullYear()
  const mm = String(segunda.getMonth() + 1).padStart(2, '0')
  const dd = String(segunda.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ArranjoLimpeza() {
  const toastRef = useRef()
  const previewRef = useRef()
  const skipAutoSaveRef = useRef(false)

  const [imported] = useState(() => checkAndImportFromUrl(LS_KEY))

  const [grupos, setGrupos] = useState(getInitialGrupos)
  const [congregacao, setCongregacao] = useState('Congregação Novo Retiro')
  const [dataInicio, setDataInicio] = useState(getProximaSegunda)
  const [qtdMeses, setQtdMeses] = useState(2)

  const [unsaved, setUnsaved] = useState(false)
  const [overlay, setOverlay] = useState({ visible: false, msg: '' })
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (imported) {
      toastRef.current?.show('📂 Grupos importados via link!', 'info')
    }
  }, [imported])

  const filename = `Arranjo-Limpeza-${(congregacao || 'congregação').toLowerCase().replace(/\s+/g, '-')}`
  const { applyTheme, removeTheme } = useExportTheme('al')

  /* ── Tema em tempo real no preview lateral ───────────── */
  useThemeLive(previewRef, 'al')

  const { exportPDF, exportIMG, printPreview, openPreview } = useExport(previewRef, {
    onStart: msg => setOverlay({ visible: true, msg }),
    onEnd: (msg, type) => { setOverlay({ visible: false, msg: '' }); toastRef.current?.show(msg, type) },
    onError: msg => toastRef.current?.show(msg, 'error'),
    onOpenPreview: () => setShowPreview(true),
    onBeforeCapture: applyTheme,
    onAfterCapture: removeTheme,
    filename,
  })

  function handleDataInicioChange(val) {
    if (!val) {
      setDataInicio('')
      return
    }
    const segunda = ajustarParaSegunda(val)
    setDataInicio(segunda)
    if (segunda !== val) {
      toastRef.current?.show(`Data ajustada para a segunda-feira (${formatarDataBr(segunda)})`, 'info')
    }
  }

  /* ── Salvar apenas grupos no LocalStorage ─────────────── */
  function saveData() {
    localStorage.setItem(LS_KEY, JSON.stringify(grupos))
    setUnsaved(false)
    toastRef.current?.show('✔ Grupos salvos com sucesso!', 'success')
  }

  function saveDataSilent() {
    if (skipAutoSaveRef.current) {
      localStorage.removeItem(LS_KEY)
      skipAutoSaveRef.current = false
      setUnsaved(false)
      return
    }
    localStorage.setItem(LS_KEY, JSON.stringify(grupos))
    setUnsaved(false)
  }

  /* ── CRUD Grupos ─────────────────────────────────────── */
  function adicionarGrupo() {
    setGrupos(prev => [...prev, `Grupo ${prev.length + 1}`])
    setUnsaved(true)
  }

  function removerGrupo(index) {
    setGrupos(prev => prev.filter((_, i) => i !== index))
    setUnsaved(true)
  }

  function moverGrupo(index, dir) {
    const j = index + dir
    if (j < 0 || j >= grupos.length) return
    setGrupos(prev => {
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
    setUnsaved(true)
  }

  function atualizarGrupo(index, valor) {
    setGrupos(prev => prev.map((g, i) => i === index ? valor : g))
    setUnsaved(true)
  }

  function limparFormulario() {
    skipAutoSaveRef.current = true
    localStorage.removeItem(LS_KEY)
    setGrupos([])
    setUnsaved(false)
    setClearConfirmOpen(false)
    toastRef.current?.show('Cadastros de grupos limpos.', 'success')
  }

  /* ── Auto-save dos grupos ────────────────────────────── */
  useAutoSave(saveDataSilent, [grupos])

  function abrirCompartilhamento() {
    const dadosParaSalvar = { grupos, congregacao, dataInicio, qtdMeses }
    const url = generateShareUrl(dadosParaSalvar)
    setShareUrl(url)
    setShareOpen(true)
  }

  /* ── Cálculo do quadro com MESES COMPLETOS ────────────── */
  const quadroGerado = useMemo(() => {
    if (!dataInicio || !qtdMeses) return { meses: {}, ordem: [] }

    const [ano, mes, dia] = dataInicio.split('-').map(Number)
    if (!ano || !mes || !dia) return { meses: {}, ordem: [] }

    const startObj = new Date(ano, mes - 1, dia)

    // Lista de meses completos a gerar
    const targetMonths = []
    let currM = startObj.getMonth()
    let currY = startObj.getFullYear()
    for (let i = 0; i < qtdMeses; i++) {
      targetMonths.push({ m: currM, y: currY })
      currM++
      if (currM > 11) {
        currM = 0
        currY++
      }
    }

    const meses = {}
    const ordem = []
    let weekIdx = 0
    let atual = new Date(startObj)

    // Percorre semana por semana até concluir os meses completos
    while (true) {
      const inicio = new Date(atual)
      const fim = new Date(atual)
      fim.setDate(fim.getDate() + 6)

      // Identifica o mês alvo pelo término da semana (fim de semana da reunião)
      const weekM = fim.getMonth()
      const weekY = fim.getFullYear()

      const targetIdx = targetMonths.findIndex(t => t.m === weekM && t.y === weekY)

      if (targetIdx === -1) {
        // Se a semana ultrapassou o último mês alvo, interrompe a geração
        const lastTarget = targetMonths[targetMonths.length - 1]
        const weekTime = new Date(weekY, weekM, 1).getTime()
        const lastTime = new Date(lastTarget.y, lastTarget.m, 1).getTime()

        if (weekTime > lastTime) {
          break
        }
      }

      if (targetIdx !== -1) {
        const chave = `${weekY}-${weekM}`
        if (!meses[chave]) {
          meses[chave] = {
            nome: NOMES_MESES[weekM],
            ano: weekY,
            semanas: [],
          }
          ordem.push(chave)
        }

        const grupoNome = grupos.length > 0 ? grupos[weekIdx % grupos.length] : '—'
        meses[chave].semanas.push({
          texto: `${formatarDD_MM(inicio)} a ${formatarDD_MM(fim)}`,
          grupo: grupoNome,
        })
        weekIdx++
      }

      atual.setDate(atual.getDate() + 7)
      if (weekIdx > 35) break // Trava de segurança
    }

    return { meses, ordem }
  }, [dataInicio, qtdMeses, grupos])

  const actions = [
    { id: 'salvar', icon: 'fa-cloud-arrow-up', label: 'Salvar Grupos', onClick: saveData },
    { id: 'share', icon: 'fa-share-nodes', label: 'Compartilhar', onClick: abrirCompartilhamento },
    { id: 'preview', icon: 'fa-eye', label: 'Pré-Visualizar', onClick: openPreview },
    { id: 'imprimir', icon: 'fa-print', label: 'Imprimir A4', onClick: printPreview },
    { id: 'pdf', icon: 'fa-file-pdf', label: 'Baixar PDF', onClick: () => exportPDF('Gerando PDF…') },
    { id: 'foto', icon: 'fa-image', label: 'Baixar Foto', onClick: () => exportIMG('Gerando imagem…') },
    { id: 'limpar', icon: 'fa-trash-can', label: 'Limpar Grupos', onClick: () => setClearConfirmOpen(true) },
  ]

  return (
    <>
      <style>{AL_STYLES}</style>
      <ExportOverlay visible={overlay.visible} msg={overlay.msg} />
      <Toast ref={toastRef} />

      {showPreview && (
        <PreviewModal
          previewRef={previewRef}
          onClose={() => setShowPreview(false)}
          onPrint={printPreview}
          onExportPDF={() => exportPDF('Gerando PDF…')}
          onExportIMG={() => exportIMG('Gerando imagem…')}
        />
      )}

      {shareOpen && (
        <ShareModal
          url={shareUrl}
          onClose={() => setShareOpen(false)}
        />
      )}

      {clearConfirmOpen && (
        <ConfirmDialog
          title="Limpar cadastros de grupos?"
          message="Esta ação irá remover todos os grupos cadastrados do LocalStorage. Deseja continuar?"
          onConfirm={limparFormulario}
          onCancel={() => setClearConfirmOpen(false)}
        />
      )}

      <div className="page-wrap">
        <PageHeader
          icon="fa-broom"
          title="Arranjo de Limpeza"
          subtitle="Gere a programação mensal de rotação dos grupos de limpeza do Salão do Reino (Ajustado para 1 Folha A4)"
          color="#2f5c1e"
        />

        <div className="al-layout">
          {/* ── PAINEL DE CONFIGURAÇÃO (EDITOR) ── */}
          <div className="al-editor">
            <div className="al-campo">
              <div className="al-titu">
                <p><i className="fa-solid fa-building-columns" style={{ marginRight: 8 }} />Dados Gerais</p>
                <hr />
              </div>

              <div className="al-bloco">
                <label>Nome da Congregação</label>
                <input
                  type="text"
                  value={congregacao}
                  onChange={e => setCongregacao(e.target.value)}
                  placeholder="Ex: Congregação Novo Retiro"
                />
              </div>

              <div className="al-bloco">
                <label>Data de Início (1º dia da 1ª semana)</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => handleDataInicioChange(e.target.value)}
                />
                <span className="al-hint">Ajustado automaticamente para a segunda-feira da semana</span>
              </div>

              <div className="al-bloco">
                <label>Meses completos para gerar</label>
                <select
                  value={qtdMeses}
                  onChange={e => setQtdMeses(Number(e.target.value))}
                  className="al-select"
                >
                  <option value={1}>1 Mês Completo</option>
                  <option value={2}>2 Meses Completos</option>
                  <option value={3}>3 Meses Completos</option>
                  <option value={4}>4 Meses Completos (Limite para 1 Folha A4)</option>
                </select>
                <span className="al-hint">Gera apenas meses inteiros para caber na folha A4</span>
              </div>
            </div>

            {/* Lista de Grupos */}
            <div className="al-campo">
              <div className="al-titu">
                <p><i className="fa-solid fa-users" style={{ marginRight: 8 }} />Grupos Responsáveis (Rotação)</p>
                <hr />
              </div>

              {grupos.length === 0 ? (
                <div className="al-vazio">
                  <i className="fa-solid fa-user-group-slash" />
                  <p>Nenhum grupo cadastrado.</p>
                  <span>Adicione abaixo os grupos da congregação.</span>
                </div>
              ) : (
                <div className="al-lista-grupos">
                  {grupos.map((nome, i) => (
                    <div key={i} className="al-grupo-item">
                      <span className="al-ordem">{i + 1}º</span>
                      <input
                        type="text"
                        value={nome}
                        onChange={e => atualizarGrupo(i, e.target.value)}
                        placeholder={`Nome do grupo ${i + 1}`}
                      />
                      <button
                        type="button"
                        className="al-btn-mover"
                        onClick={() => moverGrupo(i, -1)}
                        title="Mover para cima"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="al-btn-mover"
                        onClick={() => moverGrupo(i, 1)}
                        title="Mover para baixo"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="al-btn-remover"
                        onClick={() => removerGrupo(i)}
                        title="Remover grupo"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="al-btn-add-grupo"
                onClick={adicionarGrupo}
              >
                + Adicionar Grupo
              </button>
            </div>
          </div>

          {/* ── PREVIEW DO DOCUMENTO (A4) ── */}
          <section className="al-preview-area">
            <div className="al-previsu" ref={previewRef} id="al-previsu">
              <div className="al-doc-header">
                <h1 className="al-doc-titulo">Arranjo de Limpeza</h1>
                {congregacao && <p className="al-doc-subtitulo">{congregacao}</p>}
              </div>

              <div className="al-doc-conteudo">
                {quadroGerado.ordem.length === 0 ? (
                  <div className="al-doc-sem-dados">
                    Preencha a data inicial e adicione ao menos um grupo para visualizar a escala.
                  </div>
                ) : (
                  quadroGerado.ordem.map(chave => {
                    const m = quadroGerado.meses[chave]
                    return (
                      <div key={chave} className="al-mes-bloco">
                        <table className="al-semanas-table">
                          <thead>
                            <tr className="al-cab-mes">
                              <td colSpan={2}>{m.nome.toUpperCase()} / {m.ano}</td>
                            </tr>
                            <tr className="al-cab-col">
                              <td style={{ width: '45%' }}>SEMANAS</td>
                              <td style={{ width: '55%' }}>GRUPO RESPONSÁVEL</td>
                            </tr>
                          </thead>
                          <tbody>
                            {m.semanas.map((s, idx) => (
                              <tr key={idx}>
                                <td className="semana">{s.texto}</td>
                                <td className="grupo">{s.grupo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <PageActionBar actions={actions} unsaved={unsaved} />
    </>
  )
}

const AL_STYLES = `
  .page-wrap {
    margin-top: var(--shell-total-top);
  }

  .al-layout {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    padding: 2px 16px 80px;
    background: #f4f2ee;
    min-height: 100%;
  }

  .al-editor {
    width: 380px;
    flex-shrink: 0;
    padding: 1rem;
    box-shadow: 2px 2px 8px rgba(26,26,46,.3);
    border-radius: 15px;
    background: #eef1f7;
    margin: 10px 0;
  }

  .al-campo {
    background: #c5bfb0;
    border-radius: 15px;
    padding: 15px 14px 18px;
    margin-bottom: 14px;
  }

  .al-titu p {
    font-size: 16px;
    font-weight: 700;
    color: #162c54;
    padding: 2px 0;
    margin: 0;
  }

  .al-titu hr {
    border: 2px solid #2f5c1e;
    border-radius: 5px;
    margin: 6px 0 12px;
  }

  .al-bloco {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
  }

  .al-bloco label {
    font-size: 13px;
    color: #162c54;
    font-weight: 700;
    letter-spacing: .3px;
    margin-bottom: 3px;
  }

  .al-bloco input, .al-select {
    padding: 8px 10px;
    width: 100%;
    border: 1px solid #b2aa99;
    border-radius: 6px;
    font-size: 14px;
    background: #fff;
    box-sizing: border-box;
  }

  .al-hint {
    font-size: 11px;
    color: #555;
    margin-top: 3px;
  }

  .al-vazio {
    text-align: center;
    padding: 16px 8px;
    color: #4a5568;
    background: rgba(255,255,255,0.4);
    border-radius: 8px;
    margin-bottom: 10px;
  }

  .al-vazio i {
    font-size: 24px;
    color: #718096;
    margin-bottom: 6px;
  }

  .al-vazio p {
    font-weight: 600;
    margin: 2px 0;
    font-size: 13px;
  }

  .al-vazio span {
    font-size: 11px;
  }

  .al-lista-grupos {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
  }

  .al-grupo-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    padding: 4px 6px;
    border-radius: 6px;
    border: 1px solid #ccc;
  }

  .al-grupo-item input {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 13px;
  }

  .al-ordem {
    font-size: 12px;
    font-weight: 700;
    color: #2f5c1e;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }

  .al-btn-mover {
    background: #eef2f7;
    border: 1px solid #cbd5e1;
    color: #475569;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 10px;
    cursor: pointer;
  }
  .al-btn-mover:hover { background: #cbd5e1; }

  .al-btn-remover {
    background: #fee2e2;
    border: 1px solid #fca5a5;
    color: #991b1b;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 12px;
    cursor: pointer;
  }
  .al-btn-remover:hover { background: #fca5a5; }

  .al-btn-add-grupo {
    width: 100%;
    padding: 10px;
    background: #2f5c1e;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: background .2s;
  }
  .al-btn-add-grupo:hover {
    background: #224416;
  }

  /* ── PREVIEW (A4) ── */
  .al-preview-area {
    display: flex;
    justify-content: center;
  }

  .al-previsu {
    display: none;
    width: 210mm;
    min-height: 297mm;
    max-height: 297mm;
    box-sizing: border-box;
    background: #fff;
    border: 2px solid #aaa;
    padding: 1.2cm 1.5cm;
    flex-shrink: 0;
    overflow: hidden;
  }

  .al-doc-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .al-doc-titulo {
    font-size: 24px;
    font-weight: 700;
    color: #08303f;
    margin: 0 0 4px 0;
  }

  .al-doc-subtitulo {
    font-size: 15px;
    color: #555;
    margin: 0;
  }

  .al-mes-bloco {
    margin-bottom: 20px;
    border: 1px solid #bfbfbf;
    border-radius: 6px;
    overflow: hidden;
    page-break-inside: avoid;
  }

  .al-semanas-table {
    width: 100%;
    border-collapse: collapse;
  }

  .al-cab-mes td {
    background: #1f5c86;
    color: #fff;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    padding: 8px;
    letter-spacing: 0.5px;
  }

  .al-cab-col td {
    background: #8ac96b;
    color: #1c3a10;
    text-align: center;
    font-weight: 700;
    padding: 6px;
    border-top: 1px solid #fff;
    font-size: 13px;
  }

  .al-semanas-table td.semana, .al-semanas-table td.grupo {
    text-align: center;
    padding: 8px 12px;
    border-bottom: 1px solid #bfbfbf;
    border-right: 1px solid #bfbfbf;
    font-size: 14px;
  }

  .al-semanas-table td.grupo {
    border-right: none;
    font-weight: 600;
  }

  .al-semanas-table tr:last-child td {
    border-bottom: none;
  }

  .al-doc-sem-dados {
    text-align: center;
    padding: 40px;
    color: #888;
    font-size: 14px;
    border: 2px dashed #ddd;
    border-radius: 8px;
  }

  @media (min-width: 1200px) {
    .al-previsu { display: block; }
  }

  @media print {
    .al-previsu {
      display: block !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0.8cm !important;
      width: 21cm !important;
      height: 29.7cm !important;
    }
  }
`
