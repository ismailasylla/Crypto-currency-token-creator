import React, { useContext }from 'react'
import { Store } from './index'

function App() {
  const [state, dispatch] = useContext(Store)
  return (
    <div className="App">
    </div>
  )
}

export default App
