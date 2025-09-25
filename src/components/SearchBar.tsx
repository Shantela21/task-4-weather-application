import React, { useState } from "react";

type Props = {
  onSearch: (query: string) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const [q, setQ] = useState("");
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSearch(q.trim()); }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search city or 'lat,lon'"
        className="px-3 py-2 rounded border focus:outline-none"
      />
      <button className="px-3 py-2 rounded bg-sky-600 text-white hover:bg-sky-700">Search</button>
    </form>
  );
}
