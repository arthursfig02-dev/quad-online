import { useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import PageActionBar from '../components/ui/PageActionBar'
import Toast from '../components/ui/Toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ExportOverlay from '../components/ui/ExportOverlay'
import PreviewModal from '../components/ui/PreviewModal'
import ShareModal from '../components/ui/ShareModal'
import { useAutoSave } from '../hooks/useAutoSave'
import { useExport } from '../hooks/useExport'
import { useExportTheme } from '../hooks/useExportTheme'
import { useThemeLive } from '../hooks/useThemeLive'
import { checkAndImportFromUrl, generateShareUrl } from '../hooks/useUrlImport'
import s from './EscalaBanheiros.module.css'

const STORAGE_KEY = 'escala-banheiros-grupos-v1'

const EMPTY_FORM = {
  nome: '',
  horarioInicio: '',
  horarioFim: '',
  locais: '',
  mulheres: [],
  homens: [],
  ativo: true,
}

function readStoredDraft() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(data)) return { groups: data, eventName: '', eventDate: '' }
    return {
      groups: Array.isArray(data?.groups) ? data.groups : [],
      eventName: data?.eventName ?? '',
      eventDate: data?.eventDate ?? '',
    }
  } catch {
    return { groups: [], eventName: '', eventDate: '' }
  }
}

function formatDate(date) {
  if (!date) return 'Data a definir'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function toForm(group) {
  return {
    nome: group.nome,
    horarioInicio: group.horarioInicio ?? group.horario ?? '',
    horarioFim: group.horarioFim ?? '',
    locais: group.locais,
    mulheres: group.mulheres ?? [],
    homens: group.homens ?? [],
    ativo: group.ativo,
  }
}

export default function EscalaBanheiros() {
  const toastRef = useRef()
  const previewRef = useRef()
  const skipAutoSaveRef = useRef(false)
  const [imported] = useState(() => checkAndImportFromUrl(STORAGE_KEY))
  const [initialDraft] = useState(readStoredDraft)
  const [groups, setGroups] = useState(initialDraft.groups)
  const [eventName, setEventName] = useState(initialDraft.eventName)
  const [eventDate, setEventDate] = useState(initialDraft.eventDate)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [loadConfirmOpen, setLoadConfirmOpen] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [overlay, setOverlay] = useState({ visible: false, msg: '' })
  const [showPreview, setShowPreview] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const filename = `Escala-Banheiros-${(eventName || 'evento').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`
  const { applyTheme, removeTheme } = useExportTheme('eb')
  useThemeLive(previewRef, 'eb')
  const { exportPDF, exportIMG, printPreview, openPreview } = useExport(previewRef, {
    onStart: msg => setOverlay({ visible: true, msg }),
    onEnd: (msg, type) => { setOverlay({ visible: false, msg: '' }); toastRef.current?.show(msg, type) },
    onError: msg => toastRef.current?.show(msg, 'error'),
    onOpenPreview: () => setShowPreview(true),
    onBeforeCapture: applyTheme,
    onAfterCapture: removeTheme,
    filename,
  })

  useEffect(() => {
    if (imported) toastRef.current?.show('Dados importados via link.', 'info')
  }, [imported])

  const summary = useMemo(() => {
    const activeGroups = groups.filter(group => group.ativo)
    const people = groups.reduce((total, group) => total + group.mulheres.length + group.homens.length, 0)
    const locations = new Set(
      groups.flatMap(group => group.locais.split(',').map(location => location.trim()).filter(Boolean))
    )

    return { activeGroups: activeGroups.length, people, locations: locations.size }
  }, [groups])

  function updateGroups(nextGroups) {
    setGroups(nextGroups)
    setUnsaved(true)
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, eventName, eventDate }))
    setUnsaved(false)
    toastRef.current?.show('Rascunho salvo neste navegador.', 'success')
  }

  function saveDataSilent() {
    if (skipAutoSaveRef.current) {
      localStorage.removeItem(STORAGE_KEY)
      skipAutoSaveRef.current = false
      setUnsaved(false)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups, eventName, eventDate }))
    setUnsaved(false)
  }

  function loadData() {
    if (unsaved) {
      setLoadConfirmOpen(true)
      return
    }
    loadDataConfirmed()
  }

  function loadDataConfirmed() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      toastRef.current?.show('Nenhum rascunho salvo encontrado.', 'warning')
      return
    }
    try {
      const data = JSON.parse(raw)
      const draft = Array.isArray(data)
        ? { groups: data, eventName: '', eventDate: '' }
        : { groups: data.groups ?? [], eventName: data.eventName ?? '', eventDate: data.eventDate ?? '' }
      setGroups(draft.groups)
      setEventName(draft.eventName)
      setEventDate(draft.eventDate)
      resetForm()
      setUnsaved(false)
      setLoadConfirmOpen(false)
      toastRef.current?.show('Rascunho carregado.', 'info')
    } catch {
      toastRef.current?.show('Não foi possível carregar o rascunho.', 'error')
    }
  }

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function updateEvent(event) {
    const { name, value } = event.target
    if (name === 'eventName') setEventName(value)
    else setEventDate(value)
    setUnsaved(true)
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function updatePerson(team, index, value) {
    setForm(current => ({
      ...current,
      [team]: current[team].map((person, personIndex) => personIndex === index ? value : person),
    }))
  }

  function addPerson(team) {
    setForm(current => ({ ...current, [team]: [...current[team], ''] }))
  }

  function removePerson(team, index) {
    setForm(current => ({ ...current, [team]: current[team].filter((_, personIndex) => personIndex !== index) }))
  }

  function saveGroup(event) {
    event.preventDefault()
    const nome = form.nome.trim()
    const horarioInicio = form.horarioInicio
    const horarioFim = form.horarioFim
    const locais = form.locais.trim()

    if (!nome || !horarioInicio || !horarioFim || !locais) {
      toastRef.current?.show('Informe o grupo, o horário e ao menos um local.', 'warning')
      return
    }

    const nextGroup = {
      id: editingId ?? crypto.randomUUID(),
      nome,
      horarioInicio,
      horarioFim,
      horario: `${horarioInicio} às ${horarioFim}`,
      locais,
      mulheres: form.mulheres.map(person => person.trim()).filter(Boolean),
      homens: form.homens.map(person => person.trim()).filter(Boolean),
      ativo: form.ativo,
    }

    const nextGroups = editingId
      ? groups.map(group => group.id === editingId ? nextGroup : group)
      : [...groups, nextGroup]

    updateGroups(nextGroups)
    toastRef.current?.show(editingId ? 'Grupo atualizado. Salve o rascunho quando concluir.' : 'Grupo adicionado. Salve o rascunho quando concluir.', 'success')
    resetForm()
  }

  function startEditing(group) {
    setForm(toForm(group))
    setEditingId(group.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function removeGroup() {
    updateGroups(groups.filter(group => group.id !== deleteId))
    setDeleteId(null)
    if (editingId === deleteId) resetForm()
    toastRef.current?.show('Grupo removido. Salve o rascunho quando concluir.', 'success')
  }

  function clearData() {
    skipAutoSaveRef.current = true
    setGroups([])
    setEventName('')
    setEventDate('')
    resetForm()
    setUnsaved(false)
    setClearConfirmOpen(false)
    toastRef.current?.show('Rascunho removido deste navegador.', 'success')
  }

  useAutoSave(saveDataSilent, [groups, eventName, eventDate])

  function openShare() {
    setShareUrl(generateShareUrl({ groups, eventName, eventDate }))
    setShareOpen(true)
  }

  const actions = [
    { id: 'salvar', icon: 'fa-cloud-arrow-up', label: 'Salvar', onClick: saveData },
    { id: 'carregar', icon: 'fa-cloud-arrow-down', label: 'Carregar', onClick: loadData },
    { id: 'share', icon: 'fa-share-nodes', label: 'Compartilhar', onClick: openShare },
    { id: 'preview', icon: 'fa-eye', label: 'Pré-Visualizar', onClick: openPreview },
    { id: 'imprimir', icon: 'fa-print', label: 'Imprimir', onClick: printPreview },
    { id: 'pdf', icon: 'fa-file-pdf', label: 'Baixar PDF', onClick: () => exportPDF('Gerando PDF…') },
    { id: 'foto', icon: 'fa-image', label: 'Baixar Foto', onClick: () => exportIMG('Gerando imagem…') },
    { id: 'limpar', icon: 'fa-trash-can', label: 'Limpar', onClick: () => setClearConfirmOpen(true) },
  ]

  return (
    <div className={s.page}>
      <ExportOverlay visible={overlay.visible} msg={overlay.msg} />
      <Toast ref={toastRef} />
      <PageActionBar actions={actions} unsaved={unsaved} />
      {showPreview && <PreviewModal previewRef={previewRef} onClose={() => setShowPreview(false)} title="Escala de Banheiros" />}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Remover este grupo?"
        message="A remoção afeta somente o rascunho salvo neste navegador."
        confirmLabel="Remover grupo"
        onConfirm={removeGroup}
        onCancel={() => setDeleteId(null)}
        danger
      />
      <ConfirmDialog
        open={clearConfirmOpen}
        title="Limpar rascunho?"
        message="Isso vai apagar o evento, os grupos e o histórico salvo desta página."
        confirmLabel="Limpar tudo"
        onConfirm={clearData}
        onCancel={() => setClearConfirmOpen(false)}
        danger
      />
      <ConfirmDialog
        open={loadConfirmOpen}
        title="Substituir alterações?"
        message="As alterações não salvas serão perdidas ao carregar o último rascunho."
        confirmLabel="Carregar mesmo assim"
        onConfirm={loadDataConfirmed}
        onCancel={() => setLoadConfirmOpen(false)}
        danger
      />
      <ShareModal open={shareOpen} shareUrl={shareUrl} onClose={() => setShareOpen(false)} />

      <PageHeader
        icon="fa-restroom"
        title="Escala de Banheiros"
        subtitle="Rascunho de grupos, horários, locais e equipes de apoio para eventos"
        color="#176b63"
      />

      <main className={s.content}>
        <section className={s.notice} aria-label="Status do rascunho">
          <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
          <p>{unsaved ? 'Há alterações ainda não salvas neste navegador.' : 'Rascunho salvo neste navegador. A geração da escala por evento será a próxima etapa.'}</p>
        </section>

        <section className={s.eventCard} aria-labelledby="event-title">
          <div className={s.eventTitle}>
            <i className="fa-solid fa-calendar-star" aria-hidden="true" />
            <div>
              <p className={s.eyebrow}>INFORMAÇÕES DO EVENTO</p>
              <h2 id="event-title">Identificação da escala</h2>
            </div>
          </div>
          <div className={s.eventFields}>
            <label>
              Nome do evento
              <input name="eventName" value={eventName} onChange={updateEvent} placeholder="Ex.: Congresso Regional 2026" autoComplete="off" />
            </label>
            <label>
              Data do evento
              <input name="eventDate" type="date" value={eventDate} onChange={updateEvent} />
            </label>
          </div>
        </section>

        <section className={s.stats} aria-label="Resumo da escala">
          <div className={s.stat}>
            <i className="fa-solid fa-people-group" aria-hidden="true" />
            <span><strong>{summary.activeGroups}</strong> grupos ativos</span>
          </div>
          <div className={s.stat}>
            <i className="fa-solid fa-users" aria-hidden="true" />
            <span><strong>{summary.people}</strong> pessoas cadastradas</span>
          </div>
          <div className={s.stat}>
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            <span><strong>{summary.locations}</strong> locais atendidos</span>
          </div>
        </section>

        <div className={s.workspace}>
          <section className={s.formCard}>
            <div className={s.sectionTitle}>
              <div>
                <p className={s.eyebrow}>{editingId ? 'EDITANDO GRUPO' : 'NOVO GRUPO'}</p>
                <h2>{editingId ? 'Atualize a equipe' : 'Cadastre uma equipe de revezamento'}</h2>
              </div>
              {editingId && (
                <button className={s.textButton} type="button" onClick={resetForm}>
                  Cancelar edição
                </button>
              )}
            </div>

            <form onSubmit={saveGroup} className={s.form}>
              <label>
                Nome do grupo
                <input name="nome" value={form.nome} onChange={updateField} placeholder="Ex.: Grupo 1 — manhã" autoComplete="off" />
              </label>

              <div className={s.twoColumns}>
                <label>
                  Início da atuação
                  <input name="horarioInicio" type="time" value={form.horarioInicio} onChange={updateField} aria-label="Horário de início" />
                </label>
                <label>
                  Fim da atuação
                  <input name="horarioFim" type="time" value={form.horarioFim} onChange={updateField} aria-label="Horário de término" />
                </label>
                <label>
                  Local(is)
                  <input name="locais" value={form.locais} onChange={updateField} placeholder="Ex.: Banheiro térreo, recepção" autoComplete="off" />
                </label>
              </div>

              <p className={s.help}>Para vários locais, separe os nomes por vírgula.</p>

              <div className={s.teams}>
                <PeopleEditor team="mulheres" title="Equipe feminina" icon="fa-venus" people={form.mulheres} onAdd={addPerson} onChange={updatePerson} onRemove={removePerson} />
                <PeopleEditor team="homens" title="Equipe masculina" icon="fa-mars" people={form.homens} onAdd={addPerson} onChange={updatePerson} onRemove={removePerson} />
              </div>

              <label className={s.checkbox}>
                <input name="ativo" type="checkbox" checked={form.ativo} onChange={updateField} />
                <span>Grupo disponível para o próximo revezamento</span>
              </label>

              <div className={s.actions}>
                <button type="submit" className={s.saveButton}>
                  <i className={`fa-solid ${editingId ? 'fa-check' : 'fa-plus'}`} aria-hidden="true" />
                  {editingId ? 'Salvar alterações' : 'Adicionar grupo'}
                </button>
                <button type="button" className={s.clearButton} onClick={resetForm}>Limpar</button>
              </div>
            </form>
          </section>

          <section className={s.listSection} aria-labelledby="groups-title">
            <div className={s.listHeading}>
              <div>
                <p className={s.eyebrow}>LISTA DE REVEZAMENTO</p>
                <h2 id="groups-title">Grupos cadastrados</h2>
              </div>
              <span className={s.counter}>{groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}</span>
            </div>

            {groups.length === 0 ? (
              <div className={s.empty}>
                <i className="fa-solid fa-clipboard-list" aria-hidden="true" />
                <h3>Nenhum grupo cadastrado</h3>
                <p>Adicione à esquerda a primeira equipe para montar a lista de revezamento do evento.</p>
              </div>
            ) : (
              <div className={s.groupList}>
                {groups.map((group, index) => (
                  <article className={s.groupCard} key={group.id}>
                    <div className={s.groupTop}>
                      <span className={s.order}>{String(index + 1).padStart(2, '0')}</span>
                      <div className={s.groupName}>
                        <h3>{group.nome}</h3>
                        <p><i className="fa-regular fa-clock" aria-hidden="true" /> {group.horario}</p>
                      </div>
                      <span className={group.ativo ? s.active : s.inactive}>{group.ativo ? 'Ativo' : 'Pausado'}</span>
                    </div>

                    <div className={s.locationLine}>
                      <i className="fa-solid fa-location-dot" aria-hidden="true" />
                      <span>{group.locais}</span>
                    </div>

                    <div className={s.peopleColumns}>
                      <PeopleColumn icon="fa-venus" title="Mulheres" people={group.mulheres} tone="women" />
                      <PeopleColumn icon="fa-mars" title="Homens" people={group.homens} tone="men" />
                    </div>

                    <div className={s.cardActions}>
                      <button type="button" onClick={() => startEditing(group)}>
                        <i className="fa-solid fa-pen" aria-hidden="true" /> Editar
                      </button>
                      <button type="button" className={s.removeButton} onClick={() => setDeleteId(group.id)}>
                        <i className="fa-solid fa-trash-can" aria-hidden="true" /> Remover
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <div className={s.exportSource} aria-hidden="true">
        <section ref={previewRef} className={`${s.exportDocument} eb-document`}>
          <header className={`${s.exportHeader} eb-header`}>
            <div>
              <p>ESCALA DE BANHEIROS</p>
              <h1>{eventName || 'Evento a definir'}</h1>
            </div>
            <div className={`${s.exportDate} eb-date`}>
              <i className="fa-regular fa-calendar" aria-hidden="true" />
              {formatDate(eventDate)}
            </div>
          </header>

          <div className={s.exportBody}>
            {groups.length === 0 ? (
              <p className={s.exportEmpty}>Nenhum grupo cadastrado para este evento.</p>
            ) : (
              <div className={s.exportGroups}>
                {groups.map((group, index) => (
                  <article className={`${s.exportGroup} eb-group`} key={group.id}>
                    <div className={`${s.exportGroupHeader} eb-group-header`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h2>{group.nome}</h2>
                        <p><i className="fa-regular fa-clock" aria-hidden="true" /> {group.horario}</p>
                      </div>
                      <small>{group.ativo ? 'ATIVO' : 'PAUSADO'}</small>
                    </div>
                    <p className={`${s.exportLocation} eb-location`}><i className="fa-solid fa-location-dot" aria-hidden="true" /> {group.locais}</p>
                    <div className={`${s.exportPeople} eb-people`}>
                      <ExportPeople title="Mulheres" people={group.mulheres} />
                      <ExportPeople title="Homens" people={group.homens} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function PeopleColumn({ icon, title, people, tone }) {
  return (
    <div className={tone === 'women' ? s.peopleWomen : s.peopleMen}>
      <p><i className={`fa-solid ${icon}`} aria-hidden="true" /> {title} <strong>{people.length}</strong></p>
      {people.length ? (
        <ul>{people.map((person, index) => <li key={`${person}-${index}`}>{person}</li>)}</ul>
      ) : (
        <span className={s.noPeople}>Nenhuma pessoa cadastrada</span>
      )}
    </div>
  )
}

function PeopleEditor({ team, title, icon, people, onAdd, onChange, onRemove }) {
  const feminine = team === 'mulheres'
  const singular = feminine ? 'mulher' : 'homem'

  return (
    <div className={feminine ? s.women : s.men}>
      <p className={s.teamTitle}><i className={`fa-solid ${icon}`} aria-hidden="true" /> {title}</p>
      <div className={s.personInputs}>
        {people.map((person, index) => (
          <div className={s.personRow} key={`${team}-${index}`}>
            <input
              value={person}
              onChange={event => onChange(team, index, event.target.value)}
              placeholder={`Nome da ${singular}`}
              aria-label={`Nome da ${singular} ${index + 1}`}
              autoComplete="off"
            />
            <button type="button" onClick={() => onRemove(team, index)} aria-label={`Remover ${singular} ${index + 1}`}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className={s.addPersonButton} onClick={() => onAdd(team)}>
        <i className="fa-solid fa-plus" aria-hidden="true" /> Adicionar {singular}
      </button>
    </div>
  )
}

function ExportPeople({ title, people }) {
  return (
    <div>
      <h3>{title}</h3>
      {people.length ? <p>{people.join(' · ')}</p> : <p>—</p>}
    </div>
  )
}
