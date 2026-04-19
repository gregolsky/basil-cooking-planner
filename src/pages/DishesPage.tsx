import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DishForm } from '../components/DishForm';
import { DishList } from '../components/DishList';
import { DishCsvImport } from '../components/DishCsvImport';
import type { Dish } from '../types/dish';

export function DishesPage() {
  const dishes = useAppStore((s) => s.dishes);
  const upsertDish = useAppStore((s) => s.upsertDish);
  const deleteDish = useAppStore((s) => s.deleteDish);

  const [editing, setEditing] = useState<Dish | null>(null);
  const [showForm, setShowForm] = useState(false);

  const startAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (id: string) => {
    const d = dishes.find((x) => x.id === id);
    if (d) {
      setEditing(d);
      setShowForm(true);
    }
  };

  const handleSubmit = (dish: Dish) => {
    upsertDish(dish);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Usunąć danie z biblioteki?')) deleteDish(id);
  };

  return (
    <div className="page stack" style={{ gap: 18 }}>
      <div className="page-header">
        <h1>🥘 Biblioteka dań</h1>
        {!showForm && <button onClick={startAdd}>+ Dodaj danie</button>}
      </div>

      {showForm && (
        <div className="card">
          <h2>{editing ? '✏️ Edytuj danie' : '✨ Nowe danie'}</h2>
          <DishForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      <DishList dishes={dishes} onEdit={startEdit} onDelete={handleDelete} />

      <DishCsvImport />
    </div>
  );
}
