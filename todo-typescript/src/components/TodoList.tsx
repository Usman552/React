import type { TodoListProps } from "../types/todo";
import TodoItem from "./TodoItem";
function TodoList({
  todos,
  deleteTodo,
  toggleTodo,
}: TodoListProps & {
  deleteTodo: (id: number) => void;
  toggleTodo: (id: number) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      {todos.length > 0 ? (
      <ul className="space-y-2 border border-gray-300 rounded-lg shadow-sm width-full p-4">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            deleteTodo={deleteTodo}
            toggleTodo={toggleTodo}
          />
        ))}
      </ul>
      ) : (
        <p className="text-gray-500">No todos available.</p>
      )}
    </div>
  );
}

export default TodoList;
