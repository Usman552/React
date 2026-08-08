import type { Todo, TodoListProps } from "../types/todo";
import TodoItem from "./TodoItem";
function TodoList({
  todos,
  deleteTodo,
  toggleTodo,
  startEditing,
}: TodoListProps & {
  deleteTodo: (id: number) => void;
  toggleTodo: (id: number) => void;
  startEditing: (todo: Todo) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold my-4 align-center">Todo List</h1>
      {todos.length > 0 ? (
        <ul className="space-y-2 border border-gray-300 rounded-lg shadow-sm width-full p-4">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              deleteTodo={deleteTodo}
              toggleTodo={toggleTodo}
              startEditing={startEditing}
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
