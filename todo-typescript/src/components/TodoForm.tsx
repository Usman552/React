import { useState, useEffect } from "react";
import type { TodoFormProps } from "../types/todo";

function TodoForm({ addTodo, editTodo, editingTodo }: TodoFormProps) {
  const [text, setText] = useState("");
  const [group, setGroup] = useState("Personal");

  useEffect(() => {
    if (editingTodo) {
      setText(editingTodo.text);
      setGroup(editingTodo.group);
    } else {
      setText("");
      setGroup("Personal");
    }
  }, [editingTodo]);

  const HandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const HandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim()) return;

    if (editingTodo) {
      editTodo(editingTodo.id, text);
    } else {
      addTodo(text, group);
    }

    setText("");
    setGroup("Personal");
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100">
      <h1 className="mb-6 text-3xl font-bold">
        {editingTodo ? "Edit Todo" : "Add Todo"}
      </h1>

      <form
        onSubmit={HandleSubmit}
        className="w-96 rounded bg-white p-6 shadow-md"
      >
        <div className="mb-4">
          <label htmlFor="todo" className="mb-1 block">
            Todo
          </label>

          <input
            type="text"
            id="todo"
            value={text}
            onChange={HandleChange}
            required
            className="w-full rounded border border-gray-300 px-2 py-1"
            placeholder="Enter todo"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="group" className="mb-1 block">
            Group
          </label>

          <select
            id="group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1"
          >
            <option value="Personal">Personal</option>
            <option value="Study">Study</option>
            <option value="Work">Work</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          {editingTodo ? "Update" : "Add"}
        </button>
      </form>
    </div>
  );
}

export default TodoForm;