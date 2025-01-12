import React from 'react'
import Navbar from './components/Navbar'
import { useState } from 'react'
import { useEffect } from 'react';

const App = () => {

  const current_theme=localStorage.getItem('current_theme');
  const [theme,setheme] = useState(current_theme? current_theme:'light');

  useEffect(()=>{
    localStorage.setItem('current_theme',theme)
  },[theme])
  return (
    <div className={`container ${theme}`}> 
      <Navbar theme={theme} settheme={setheme} />
    </div>
  )
}

export default App
