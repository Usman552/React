import { useState, useEffect } from "react";
import TodoForm from "./components/TodoForm";
import type { Todo } from "./types/todo";
import TodoList from "./components/TodoList";

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem("todos");

    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const addTodo = (text: string) => {
    setTodos((currentTodos) => [
      ...currentTodos,
      { id: Date.now(), text, completed: false },
    ]);
  };
  const deleteTodo = (id: number) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  };
  const toggleTodo = (id: number) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, completed: !todo.completed };
        }
        return todo;
      }),
    );
  };
  const startEditing = (todo: Todo) => {
    setEditingTodo(todo);
  };
  const editTodo = (id: number, newText: string) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, text: newText };
        }
        return todo;
      }),
    );

    setEditingTodo(null);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100 ">
      <TodoForm
        addTodo={addTodo}
        editTodo={editTodo}
        editingTodo={editingTodo}
      />
      <TodoList
        todos={todos}
        deleteTodo={deleteTodo}
        toggleTodo={toggleTodo}
        startEditing={startEditing}
      />
    </div>
  );
}

export default App;
