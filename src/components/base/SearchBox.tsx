interface SearchBoxProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBox({ placeholder = 'Search...', value, onChange }: SearchBoxProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <i className="ri-search-line text-gray-400"></i>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
        >
          <i className="ri-close-line text-gray-400 hover:text-gray-600"></i>
        </button>
      )}
    </div>
  );
}
