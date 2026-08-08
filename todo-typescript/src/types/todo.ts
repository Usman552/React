export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  group: string;
}

export interface TodoListProps {
  todos: Todo[];
}

export interface TodoItemProps {
  todo: Todo;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string, completed: boolean) => void;
  startEditing: (todo: Todo) => void;
}

export interface TodoFormProps {
  addTodo: (text: string, group: string) => void;
  editTodo: (id: string, newText: string) => void;
  editingTodo: Todo | null;
}