import type { TodoItemProps } from "../types/todo";

function TodoItem({
  todo,
  deleteTodo,
  toggleTodo,
  startEditing,
}: TodoItemProps) {
  return (
    <li className="flex items-center justify-between rounded border p-3">
      <div>
        <span
          className={`font-medium ${
            todo.completed
              ? "text-gray-400 line-through"
              : "text-gray-800"
          }`}
        >
          {todo.text}
        </span>

        <p className="text-sm text-gray-500">
          Group: {todo.group}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          className="rounded bg-orange-500 px-3 py-1 text-white hover:bg-orange-600"
          onClick={() => toggleTodo(todo.id, todo.completed)}
        >
          {todo.completed ? "Undo" : "Complete"}
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
  );
}

export default TodoItem;