import type { Todo } from "../types/todo";
import TodoItem from "./TodoItem";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { deleteTodo, toggleTodo, startEditing } from "../store/todosSlice";

function TodoList() {
  const dispatch = useAppDispatch();
  const todos = useAppSelector((state) => state.todos.items);

  // Todos ko groups ke according divide karna
  const groupedTodos = todos.reduce(
    (groups: Record<string, Todo[]>, todo) => {
      if (!groups[todo.group]) {
        groups[todo.group] = [];
      }

      groups[todo.group].push(todo);

      return groups;
    },
    {},
  );

  return (
    <div className="w-full max-w-2xl">
      <h1 className="my-4 text-2xl font-bold">
        Todo List
      </h1>

      {todos.length > 0 ? (
        <div className="space-y-6">

          {Object.entries(groupedTodos).map(
            ([group, groupTodos]) => (
              <div
                key={group}
                className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
              >

                {/* Group Heading */}
                <h2 className="mb-3 border-b pb-2 text-xl font-bold">
                  {group}
                </h2>

                {/* Group ke todos */}
                <ul className="space-y-2">
                  {groupTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      deleteTodo={(id) => dispatch(deleteTodo(id))}
                      toggleTodo={(id, completed) =>
                        dispatch(toggleTodo({ id, completed }))
                      }
                      startEditing={(todo) => dispatch(startEditing(todo))}
                    />
                  ))}
                </ul>

              </div>
            ),
          )}

        </div>
      ) : (
        <p className="text-gray-500">
          No todos available.
        </p>
      )}
    </div>
  );
}

export default TodoList;
