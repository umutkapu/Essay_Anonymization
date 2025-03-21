import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import EssayUpload from './EssayUpload'
import EssayInquery from './EssayInquery'
import { Routes, Route } from 'react-router-dom'
import Editor from './Editor'
import Referee from './Referee'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route path='/makalesistemi' element={<EssayUpload />} />
        <Route path='/makalesorgu' element={<EssayInquery />} />
        <Route path='/editor' element={<Editor />} />
        <Route path='/referee' element={<Referee />} />
      </Routes>
    </>
  )
}

export default App
