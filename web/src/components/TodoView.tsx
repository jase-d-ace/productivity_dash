import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTodos, saveTodoOrder, updateNote } from '../api'
import type { Note } from '../types'
import TodoItem from './TodoItem'

interface Props {
  activeTaskId: string | null
  onSetActive: (id: string | null) => void
}

export default function TodoView({ activeTaskId, onSetActive }: Props) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => updateNote(id, { done }),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ['todos'] })
      const previous = qc.getQueryData<{ results: Note[] }>(['todos'])
      qc.setQueryData<{ results: Note[] }>(['todos'], old => ({
        results: (old?.results ?? []).map(t => t.id === id ? { ...t, done } : t),
      }))
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous) qc.setQueryData(['todos'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['todos'] })
    },
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

  if (isLoading) return <p style={{ color: '#8b85a0' }}>Loading...</p>

  if (todos.length === 0) return <p style={{ color: '#8b85a0' }}>No todos yet. Tag a note with #todo to see it here.</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={(id, done) => toggleMutation.mutate({ id, done })}
            activeTaskId={activeTaskId}
            onSetActive={onSetActive}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
