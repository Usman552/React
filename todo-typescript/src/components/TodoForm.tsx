import { useState } from "react";
function TodoForm({addTodo}:{addTodo:(text:string)=>void}) {
    const [text, setText] = useState("");
    const HandleChange=(e: React.ChangeEvent<HTMLInputElement>)=>{
        setText(e.target.value);
    }
    const HandleSubmit=(e: React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        addTodo(text);
        setText("");
    }
    
  return (
    <div className="flex  flex-col items-center justify-center bg-gray-100 ">
      <h1 className="text-3xl font-bold mb-6">Add Todo</h1>
      <form onSubmit={HandleSubmit} className="bg-white p-6 rounded shadow-md w-96">
        <div className="mb-4">
          <label htmlFor="todo">Todo</label>
          <input
            type="text"
            id="todo"
            value={text}
            onChange={HandleChange} required
            className="border border-gray-300 rounded px-2 py-1 w-full" placeholder="Enter todo"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default TodoForm;
