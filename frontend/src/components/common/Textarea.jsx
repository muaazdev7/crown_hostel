const Textarea = ({ label, error, className = '', rows = 3, ...props }) => (
  <div className="w-full">
    {label && <label className="input-label">{label}</label>}
    <textarea
      rows={rows}
      className={`input resize-none ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);
export default Textarea;
