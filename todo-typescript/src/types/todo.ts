export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  group: string;
}

export interface TodoItemProps {
  todo: Todo;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string, completed: boolean) => void;
  startEditing: (todo: Todo) => void;
}