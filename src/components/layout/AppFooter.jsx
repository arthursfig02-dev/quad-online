import s from './AppFooter.module.css'

export default function AppFooter() {
  return (
    <footer className={s.footer}>
      <span> <a href="#">Por Arthur Figueiredo</a> © {new Date().getFullYear()}</span>
    </footer>
  )
}
