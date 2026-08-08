import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "./firebase/firebase";
import TodoForm from "./components/TodoForm";
import type { Todo } from "./types/todo";
import TodoList from "./components/TodoList";
import Auth from "./components/Auth";

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem("todos");

    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const handleLogout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

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
    <>
      {user ? (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
          <button
            onClick={handleLogout}
            className="mb-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Logout
          </button>
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
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App;
