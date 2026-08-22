import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import type { Todo } from "../types/todo";

interface TodosState {
  items: Todo[];
  editingTodo: Todo | null;
}

const initialState: TodosState = {
  items: [],
  editingTodo: null,
};

// Naya todo Firestore me add karna
export const addTodo = createAsyncThunk(
  "todos/addTodo",
  async ({ text, group }: { text: string; group: string }) => {
    if (!auth.currentUser) return;

    await addDoc(collection(db, "todos"), {
      text,
      completed: false,
      group,
      userId: auth.currentUser.uid,
    });
  },
);

// Todo ko Firestore se delete karna
export const deleteTodo = createAsyncThunk(
  "todos/deleteTodo",
  async (id: string) => {
    await deleteDoc(doc(db, "todos", id));
  },
);

// Todo complete/undo karna
export const toggleTodo = createAsyncThunk(
  "todos/toggleTodo",
  async ({ id, completed }: { id: string; completed: boolean }) => {
    await updateDoc(doc(db, "todos", id), {
      completed: !completed,
    });
  },
);

// Todo ka text update karna
export const editTodo = createAsyncThunk(
  "todos/editTodo",
  async ({ id, newText }: { id: string; newText: string }) => {
    await updateDoc(doc(db, "todos", id), {
      text: newText,
    });
  },
);

const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    // App.tsx ka onSnapshot listener har live update yahi action ke through store me daalta hai
    setTodos: (state, action: PayloadAction<Todo[]>) => {
      state.items = action.payload;
    },
    startEditing: (state, action: PayloadAction<Todo>) => {
      state.editingTodo = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Edit save hote hi form wapas "Add" mode me chala jaye
    builder.addCase(editTodo.fulfilled, (state) => {
      state.editingTodo = null;
    });
  },
});

export const { setTodos, startEditing } = todosSlice.actions;
export default todosSlice.reducer;
