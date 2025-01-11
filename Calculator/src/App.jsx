import { useState } from 'react';
import './App.css';

function App() {
  const [value, setValue] = useState('');

  const handleInput = (e) => {
    e.preventDefault();
    const input = e.target.innerHTML;

    if (input === '=') {
     try{
      setValue(eval(value.replace('x','*')));
     }
     catch{
      setValue("Error");
     }
    } else if (input === 'AC') {
      setValue('');
    } else if (input === 'DEL') {
      setValue(value.slice(0, -1));
    } else {
      setValue(value + input);
    }
  };

  return (
    <>
      <div className="calculator">
        <form id="form">
          <div className="display">
            <input type="text" id="display" value={value} readOnly />
          </div>
          <div>
            <button onClick={handleInput}>AC</button>
            <button onClick={handleInput}>DEL</button>
            <button onClick={handleInput}>.</button>
            <button onClick={handleInput}>/</button>
          </div>
          <div>
            <button onClick={handleInput}>9</button>
            <button onClick={handleInput}>8</button>
            <button onClick={handleInput}>7</button>
            <button onClick={handleInput}>x</button>
          </div>
          <div>
            <button onClick={handleInput}>6</button>
            <button onClick={handleInput}>5</button>
            <button onClick={handleInput}>4</button>
            <button onClick={handleInput}>-</button>
          </div>
          <div>
            <button onClick={handleInput}>3</button>
            <button onClick={handleInput}>2</button>
            <button onClick={handleInput}>1</button>
            <button onClick={handleInput}>+</button>
          </div>
          <div>
            <button onClick={handleInput}>00</button>
            <button onClick={handleInput}>0</button>
            <button onClick={handleInput} id="equal">=</button>
          </div>
        </form>
      </div>
    </>
  );
}

export default App;
