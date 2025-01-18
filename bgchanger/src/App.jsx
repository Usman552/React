import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [color, setcolor] = useState("orange");
  return (
    <div className="w-full h-screen" style={{ backgroundColor: color }}>
      <div className="fixed flex-wrap justify-center bottom-12 inset-x-0 px-2">
        <div className="flex flex-wrap  justify-center py-2 rounded-3xl gap-3 ">
          <button className="outline-none px-6 py-2 text-white text-xl rounded-2xl "
            style={{ backgroundColor: "red" }} onClick={() => { setcolor("red") }}>Red</button>

          <button className="outline-none px-6 py-2 text-black text-xl rounded-2xl "
            style={{ backgroundColor: "white" }} onClick={() => { setcolor("white") }}>White</button>

          <button className="outline-none px-6 py-2 text-white text-xl rounded-2xl "
            style={{ backgroundColor: "blue" }} onClick={() => { setcolor("blue") }}>Blue</button>

          <button className="outline-none px-6 py-2 text-white text-xl rounded-2xl "
            style={{ backgroundColor: "green" }} onClick={() => { setcolor("green") }}>Green</button>

          <button className="outline-none px-6 py-2 text-white text-xl rounded-2xl "
            style={{ backgroundColor: "maroon" }} onClick={() => { setcolor("maroon") }}>Maroon</button>

          <button className="outline-none px-6 py-2 text-white text-xl rounded-2xl "
            style={{ backgroundColor: "violet" }} onClick={() => { setcolor("violet") }}>violet</button>

          <button className="outline-none px-6 py-2 text-white text-xl rounded-2xl "
            style={{ backgroundColor: "teal" }} onClick={() => { setcolor("teal") }}>Teal</button>

          <button className="outline-none px-6 py-2 text-black text-xl rounded-2xl "
            style={{ backgroundColor: "gold" }} onClick={() => { setcolor("gold") }}>Gold</button>
        </div>
      </div>
    </div>
  )


}

export default App
