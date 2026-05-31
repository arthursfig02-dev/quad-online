import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './index.css'

import AppShell              from './components/layout/AppShell'
import Home                  from './pages/Home'
import VidaMinisterio        from './pages/VidaMinisterio'
import ReuniaoPublica        from './pages/ReuniaoPublica'
import DesignacoesMecanicas  from './pages/DesignacoesMecanicas'
import ProgramacaoCampo      from './pages/ProgramacaoCampo'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true,                    element: <Home />                  },
      { path: 'vida-ministerio',        element: <VidaMinisterio />        },
      { path: 'reuniao-publica',        element: <ReuniaoPublica />        },
      { path: 'designacoes-mecanicas',  element: <DesignacoesMecanicas />  },
      { path: 'programacao-campo',      element: <ProgramacaoCampo />      },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
