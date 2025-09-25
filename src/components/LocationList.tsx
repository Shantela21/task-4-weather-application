import React from "react";

// ✅ This defines the SavedLoc type and exports it
export interface SavedLoc {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface LocationListProps {
  saved: SavedLoc[];
  onSelect: (loc: SavedLoc) => void;
  onDelete: (id: string) => void;
}

export default function LocationList({ saved, onSelect, onDelete }: LocationListProps) {
  if (saved.length === 0) {
    return <div className="text-sm text-gray-500">No saved locations yet.</div>;
  }

  return (
    <div className="space-y-2">
      {saved.map((loc) => (
        <div
          key={loc.id}
          className="location-list"
        >
          <div onClick={() => onSelect(loc)} className="flex-1">
            {loc.name}
          </div>
          <button
            onClick={() => onDelete(loc.id)}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
