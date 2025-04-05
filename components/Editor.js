export default function Editor({ text, onChange }) {
    return (
      <textarea
        className="w-full h-24 p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={text}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  