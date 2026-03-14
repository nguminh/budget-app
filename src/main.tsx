import ReactDOM from 'react-dom/client'

import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(<Providers router={router} />)
