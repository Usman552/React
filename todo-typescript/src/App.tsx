import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { auth, db } from "./firebase/firebase";
import TodoForm from "./components/TodoForm";
import type { Todo } from "./types/todo";
import TodoList from "./components/TodoList";
import Auth from "./components/Auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAppDispatch } from "./store/hooks";
import { setTodos } from "./store/todosSlice";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      dispatch(setTodos([]));
      return;
    }

    const q = query(collection(db, "todos"), where("userId", "==", user.uid));

    // Firestore me kuch bhi change ho, yeh listener turant Redux store update kar dega
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData: Todo[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        completed: doc.data().completed,
        group: doc.data().group,
      }));

      dispatch(setTodos(todosData));
    });

    return unsubscribe;
  }, [user, dispatch]);

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

          <TodoForm />

          <TodoList />
        </div>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App;
