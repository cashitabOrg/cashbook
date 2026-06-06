import React from "react";

export function Table({ children, className = "", ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide md:custom-scrollbar">
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-gray-50 dark:bg-[#252528] rounded-t-xl ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableRow({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`border-b border-gray-100 dark:border-[#2C2C2E] hover:bg-gray-50 dark:hover:bg-[#252528]/50 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-2 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-2 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 ${className}`} {...props}>
      {children}
    </td>
  );
}
