import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { auth, db } from "./firebase/firebase";
import TodoForm from "./components/TodoForm";
import type { Todo } from "./types/todo";
import TodoList from "./components/TodoList";
import Auth from "./components/Auth";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const handleLogout = async () => {
    await signOut(auth);
  };
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!user) {
      setTodos([]);
      return;
    }

    const q = query(collection(db, "todos"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData: Todo[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        completed: doc.data().completed,
        group: doc.data().group,
      }));

      setTodos(todosData);
    });

    return unsubscribe;
  }, [user]);

  const addTodo = async (text: string, group: string) => {
    if (!auth.currentUser) return;

    await addDoc(collection(db, "todos"), {
      text,
      completed: false,
      group,
      userId: auth.currentUser.uid,
    });
  };
  const deleteTodo = async (id: string) => {
    await deleteDoc(doc(db, "todos", id));
  };
  const toggleTodo = async (id: string, completed: boolean) => {
    await updateDoc(doc(db, "todos", id), {
      completed: !completed,
    });
  };
  const startEditing = (todo: Todo) => {
    setEditingTodo(todo);
  };
  const editTodo = async (id: string, newText: string) => {
    await updateDoc(doc(db, "todos", id), {
      text: newText,
    });

    setEditingTodo(null);
  };

  return (
    <>
      {user ? (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 py-8">
          <button
            onClick={handleLogout}
            className="mb-4 rounded bg-red-500 px-4 py-2 text-white"
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
