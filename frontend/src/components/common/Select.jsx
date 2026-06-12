const Select = ({ label, error, children, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="input-label">{label}</label>}
    <select className={`input bg-white ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`} {...props}>
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);
export default Select;
