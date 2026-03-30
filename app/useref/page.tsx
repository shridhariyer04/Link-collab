// components/FocusInput.tsx
"use client"; // Important in Next.js 13+ app directory

import { useRef } from "react";

export default function FocusInput() {
  // Create a ref for the input element
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    // Focus the input using the ref
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded w-64">
      <input
        ref={inputRef}
        type="text"
        placeholder="Type something..."
        className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
     
     <button onClick={handleFocus}   className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Focus Input</button>
    </div>
  );
}
