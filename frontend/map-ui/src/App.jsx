import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MapView from './components/MapView'
function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ height: "100vh" }}>
    <MapView />
  </div>
  )
}

export default App
