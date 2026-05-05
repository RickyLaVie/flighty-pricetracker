"use client";

import { useEffect, useRef, useState } from "react";
import { searchAirports, type Airport } from "@/lib/airports";

interface Props {
  value: string;
  onChange: (iata: string) => void;
  placeholder: string;
  lang: "zh" | "en";
}

export function AirportInput({ value, onChange, placeholder, lang }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleChange(text: string) {
    setQuery(text);
    setHighlighted(0);

    if (!text) {
      onChange("");
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Direct 3-letter IATA code — pass up immediately
    if (/^[A-Za-z]{3}$/.test(text)) {
      onChange(text.toUpperCase());
    } else {
      onChange("");
    }

    const found = searchAirports(text);
    setResults(found);
    setIsOpen(found.length > 0);
  }

  function handleSelect(airport: Airport) {
    const label = lang === "zh"
      ? `${airport.cityZh} (${airport.iata})`
      : `${airport.city} (${airport.iata})`;
    setQuery(label);
    onChange(airport.iata);
    setResults([]);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[highlighted]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.length >= 1 && results.length === 0) handleChange(query);
          else if (results.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
      />

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {results.map((airport, i) => (
            <li key={airport.iata}>
              <button
                type="button"
                onMouseDown={() => handleSelect(airport)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  i === highlighted ? "bg-brand-light" : "hover:bg-gray-50"
                }`}
              >
                <span className="font-bold text-brand-hover w-9 shrink-0">{airport.iata}</span>
                <span className="text-gray-700 truncate">
                  {lang === "zh"
                    ? `${airport.cityZh} · ${airport.nameZh}`
                    : `${airport.city} · ${airport.name}`}
                </span>
                <span className="text-gray-400 text-xs shrink-0 ml-auto">
                  {lang === "zh" ? airport.countryZh : airport.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
