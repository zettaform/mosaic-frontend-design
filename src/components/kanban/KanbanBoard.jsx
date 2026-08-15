import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, Calendar, User, Tag } from 'lucide-react';

const KanbanCard = ({ id, title, description, priority, assignee, dueDate, tags = [], onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        hover:shadow-md transition-shadow duration-200
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{title}</h3>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreHorizontal size={16} />
        </button>
      </div>
      
      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {description}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Tag size={10} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {priority && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[priority]}`}>
              {priority}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          {assignee && (
            <div className="flex items-center">
              <User size={12} className="mr-1" />
              {assignee}
            </div>
          )}
          {dueDate && (
            <div className="flex items-center">
              <Calendar size={12} className="mr-1" />
              {dueDate}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const KanbanColumn = ({ id, title, cards, onAddCard, onEditCard, onDeleteCard }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[500px] w-80
        ${isDragging ? 'opacity-50' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4" {...attributes} {...listeners}>
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
          {cards.length}
        </span>
      </div>

      <SortableContext items={cards.map(card => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          <AnimatePresence>
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                {...card}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <motion.button
        className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex items-center justify-center"
        onClick={() => onAddCard(id)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus size={16} className="mr-2" />
        Add a card
      </motion.button>
    </motion.div>
  );
};

const KanbanBoard = ({ 
  initialColumns = [],
  onUpdateColumns,
  className = '',
  ...props 
}) => {
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the columns containing the active and over items
    const activeColumn = columns.find(col => 
      col.cards.some(card => card.id === activeId)
    );
    const overColumn = columns.find(col => 
      col.cards.some(card => card.id === overId) || col.id === overId
    );

    if (!activeColumn || !overColumn) return;

    // If moving within the same column
    if (activeColumn.id === overColumn.id) {
      const newCards = arrayMove(
        activeColumn.cards,
        activeColumn.cards.findIndex(card => card.id === activeId),
        overColumn.cards.findIndex(card => card.id === overId)
      );

      const newColumns = columns.map(col => 
        col.id === activeColumn.id 
          ? { ...col, cards: newCards }
          : col
      );

      setColumns(newColumns);
      onUpdateColumns?.(newColumns);
    } else {
      // Moving between columns
      const activeCard = activeColumn.cards.find(card => card.id === activeId);
      const newActiveCards = activeColumn.cards.filter(card => card.id !== activeId);
      
      let newOverCards;
      if (overColumn.cards.some(card => card.id === overId)) {
        // Inserting before a specific card
        const overIndex = overColumn.cards.findIndex(card => card.id === overId);
        newOverCards = [
          ...overColumn.cards.slice(0, overIndex),
          activeCard,
          ...overColumn.cards.slice(overIndex)
        ];
      } else {
        // Adding to the end of the column
        newOverCards = [...overColumn.cards, activeCard];
      }

      const newColumns = columns.map(col => {
        if (col.id === activeColumn.id) {
          return { ...col, cards: newActiveCards };
        } else if (col.id === overColumn.id) {
          return { ...col, cards: newOverCards };
        }
        return col;
      });

      setColumns(newColumns);
      onUpdateColumns?.(newColumns);
    }

    setActiveId(null);
  };

  const handleAddCard = (columnId) => {
    const newCard = {
      id: `card-${Date.now()}`,
      title: 'New Card',
      description: 'Click to edit this card',
      priority: 'medium',
      assignee: null,
      dueDate: null,
      tags: [],
    };

    const newColumns = columns.map(col => 
      col.id === columnId 
        ? { ...col, cards: [...col.cards, newCard] }
        : col
    );

    setColumns(newColumns);
    onUpdateColumns?.(newColumns);
  };

  const handleEditCard = (cardId, updates) => {
    const newColumns = columns.map(col => ({
      ...col,
      cards: col.cards.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      )
    }));

    setColumns(newColumns);
    onUpdateColumns?.(newColumns);
  };

  const handleDeleteCard = (cardId) => {
    const newColumns = columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => card.id !== cardId)
    }));

    setColumns(newColumns);
    onUpdateColumns?.(newColumns);
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-4">
          <SortableContext items={columns.map(col => col.id)}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                {...column}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-50">
              {/* Render the dragged item */}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
