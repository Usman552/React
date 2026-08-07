export interface Todo{
    id: number;
    text:string;
    completed: boolean;
}

export interface TodoListProps{
    todos: Todo[];
    deleteTodo: (id: number) => void;
    toggleTodo: (id: number) => void;
}
export interface TodoItemProps {
  todo: Todo;
  deleteTodo: (id: Todo["id"]) => void;
  toggleTodo: (id: Todo["id"]) => void;
     startEditing: (todo: TodoItemProps["todo"]) => void;
};
export interface TodoFormProps {
  addTodo: (text: string) => void;
  editTodo: (id: number, newText: string) => void;
  editingTodo: Todo | null;

}