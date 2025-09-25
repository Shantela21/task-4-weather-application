import React, { useState } from "react";

type Props = {
  onSearch: (query: string) => void;
};

export default function SearchBar({ onSearch }: Props) {
  const [q, setQ] = useState("");

  return (
    <form
      className="searchbar-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) onSearch(q.trim());
      }}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search city or 'lat,lon'"
        className="searchbar-input"
      />
      <button className="searchbar-btn" type="submit">
        Search
      </button>
    </form>
  );
}
