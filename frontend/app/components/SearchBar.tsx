'use client'

import { useState } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would call the search API here
    console.log('Searching for:', query)
  }
  
  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ada, parsel, adres veya plan adı ara..."
          className="w-full px-4 py-3 bg-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary"
        >
          Ara
        </button>
      </div>
    </form>
  )
}