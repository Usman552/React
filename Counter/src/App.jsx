import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const handleDecrement = () => {
    if (count > 0) {
      setCount((count) => count - 1)
    }
  }

  return (
    <>
      <h1>Counter</h1>
      <h2>{count}</h2>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
         Add Number
        </button>
        <button onClick={handleDecrement}>
          Remove Number
        </button>
      </div>
    </>
  )
}

export default App
