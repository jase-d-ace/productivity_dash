import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTodos, saveTodoOrder, updateNote } from '../api'
import type { Note } from '../types'
import TodoItem from './TodoItem'

export default function TodoView() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => updateNote(id, { done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  })

  const reorderMutation = useMutation({
    mutationFn: saveTodoOrder,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const todos: Note[] = data?.results ?? []

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = todos.findIndex(t => t.id === active.id)
    const newIndex = todos.findIndex(t => t.id === over.id)
    const reordered = arrayMove(todos, oldIndex, newIndex)

    qc.setQueryData(['todos'], { results: reordered })
    reorderMutation.mutate(reordered.map(t => t.id))
  }

  if (isLoading) return <p style={{ color: '#7a7067' }}>Loading...</p>

  if (todos.length === 0) return <p style={{ color: '#7a7067' }}>No todos yet. Tag a note with #todo to see it here.</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={(id, done) => toggleMutation.mutate({ id, done })}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
