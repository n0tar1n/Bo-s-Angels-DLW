import { Navigate, Route, Routes } from 'react-router-dom'
import GalaxyPage from './pages/GalaxyPage'

const App = () => {
  return (
    <Routes>
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<GalaxyPage />} />
    </Routes>
  )
}

export default App
