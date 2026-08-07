import type { TodoItemProps } from "../types/todo";
function TodoItem({ todo, deleteTodo, toggleTodo, startEditing }: TodoItemProps) {
  return (
    <div>
      <li
        key={todo.id}
        className="flex items-center justify-between width-full gap-5 rounded-lg border border-gray-200 p-3"
      >
        <span
          className={`font-medium ${
            todo.completed ? "line-through text-gray-400" : "text-gray-800"
          }`}
        >
          {todo.text}
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => toggleTodo(todo.id)}
            className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
          >
            Complete
          </button>
          <button
           onClick={() => startEditing(todo)}
            className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </li>
    </div>
  );
}

export default TodoItem;
