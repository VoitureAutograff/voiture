import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
  return (
    <>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
      <SpeedInsights />
    </>
  )
}

export default App
