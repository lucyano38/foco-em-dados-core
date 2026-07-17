import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, Trash2, ArrowUpDown, ChevronDown, Check, X, 
  RotateCcw, Save, Download, Calculator, HelpCircle, FileSpreadsheet
} from 'lucide-react';

interface SpreadsheetGridProps {
  headers: string[];
  sampleData: Record<string, string | number | boolean>[];
  onUpdateData: (newHeaders: string[], newData: Record<string, string | number | boolean>[]) => void;
}

export function SpreadsheetGrid({ headers: initialHeaders, sampleData: initialData, onUpdateData }: SpreadsheetGridProps) {
  // Local working copy of state
  const [headers, setHeaders] = useState<string[]>([]);
  const [gridData, setGridData] = useState<Record<string, string | number | boolean>[]>([]);
  
  // Undo/Reset baseline
  useEffect(() => {
    setHeaders([...initialHeaders]);
    // Deep copy data rows
    setGridData(initialData.map(row => ({ ...row })));
  }, [initialHeaders, initialData]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  
  // New column / item states
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState("");

  // Helper: converts column index to Excel letters (0=A, 1=B, 26=AA etc.)
  const getColLetter = (index: number): string => {
    let temp = index;
    let letter = "";
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Cell Double-Click start edit
  const startEdit = (rowIndex: number, colKey: string, currentValue: any) => {
    setEditingCell({ rowIndex, colKey });
    setEditValue(currentValue === null || currentValue === undefined ? "" : String(currentValue));
  };

  // Confirm/Save cell edits locally
  const saveCellEdit = () => {
    if (!editingCell) return;
    const { rowIndex, colKey } = editingCell;
    
    // Attempt parsing numerical string to numbers to preserve types
    let parsedValue: string | number | boolean = editValue;
    if (editValue.toLowerCase() === 'true') parsedValue = true;
    else if (editValue.toLowerCase() === 'false') parsedValue = false;
    else if (editValue.trim() !== '' && !isNaN(Number(editValue))) {
      parsedValue = Number(editValue);
    }

    const updatedGrid = [...gridData];
    updatedGrid[rowIndex] = {
      ...updatedGrid[rowIndex],
      [colKey]: parsedValue
    };

    setGridData(updatedGrid);
    setEditingCell(null);
  };

  // Handle cell edit cancel
  const cancelCellEdit = () => {
    setEditingCell(null);
  };

  // Handle KeyDown inside editing cell (Enter to save, Escape to cancel)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveCellEdit();
    } else if (e.key === 'Escape') {
      cancelCellEdit();
    }
  };

  // Sort rows logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Delete a specific row
  const deleteRow = (indexToDelete: number) => {
    const updated = gridData.filter((_, idx) => idx !== indexToDelete);
    setGridData(updated);
  };

  // Add a blank new row
  const addBlankRow = () => {
    const newRow: Record<string, string | number | boolean> = {};
    headers.forEach(h => {
      newRow[h] = "";
    });
    setGridData([...gridData, newRow]);
  };

  // Add a custom new column
  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newColName.trim();
    if (!trimmed) return;
    if (headers.includes(trimmed)) {
      alert("Uma coluna com esse nome já existe!");
      return;
    }

    const updatedHeaders = [...headers, trimmed];
    const updatedData = gridData.map(row => ({
      ...row,
      [trimmed]: ""
    }));

    setHeaders(updatedHeaders);
    setGridData(updatedData);
    setNewColName("");
    setIsAddingCol(false);
  };

  // Delete a column
  const deleteColumn = (colKeyToDelete: string) => {
    if (headers.length <= 1) {
      alert("A tabela precisa conter pelo menos 1 coluna!");
      return;
    }
    if (confirm(`Tem certeza que deseja excluir a coluna "${colKeyToDelete}"?`)) {
      const updatedHeaders = headers.filter(h => h !== colKeyToDelete);
      const updatedData = gridData.map(row => {
        const copy = { ...row };
        delete copy[colKeyToDelete];
        return copy;
      });
      setHeaders(updatedHeaders);
      setGridData(updatedData);
      if (selectedColumn === colKeyToDelete) setSelectedColumn(null);
    }
  };

  // Reset to original file backup
  const handleReset = () => {
    if (confirm("Deseja descartar todas as alterações e redefinir a planilha?")) {
      setHeaders([...initialHeaders]);
      setGridData(initialData.map(row => ({ ...row })));
      setSortConfig(null);
      setEditingCell(null);
      setSelectedColumn(null);
    }
  };

  // Save changes to Global Application State (so AI, graphs, updates immediately!)
  const handleApplyToApp = () => {
    onUpdateData(headers, gridData);
  };

  // Export grid to CSV
  const handleDownloadCSV = () => {
    if (gridData.length === 0) return;
    
    // Create CSV header row
    const csvRows = [headers.join(",")];
    
    // Formulate CSV rows
    gridData.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        const stringVal = val === null || val === undefined ? "" : String(val);
        // Escape quotes
        const escaped = stringVal.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planilha_editada_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export grid to Excel with preserved cell formatting
  const handleDownloadExcel = () => {
    if (gridData.length === 0) return;

    const aoa: any[][] = [headers];
    gridData.forEach(row => {
      aoa.push(headers.map(h => row[h]));
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const colWidths = headers.map((h, i) => ({
      wch: Math.max(
        h.length,
        ...gridData.map(r => String(r[h] ?? '').length),
        14
      )
    }));
    ws['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (cell && typeof cell.v === 'number') {
          cell.z = '#,##0.00';
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    XLSX.writeFile(wb, `planilha_${Date.now()}.xlsx`, { cellStyles: true });
  };

  // Process rows by filtering & sorting
  const processedRows = useMemo(() => {
    let result = [...gridData];

    // 1. Search Query Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => {
        return headers.some(header => {
          const val = row[header];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
      });
    }

    // 2. Sort Logic
    if (sortConfig) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return direction === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) return direction === 'asc' ? -1 : 1;
        if (strA > strB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [gridData, searchQuery, sortConfig, headers]);

  // Compute stats for selected column or numerical header (Google-Sheets style smart math helper)
  const columnStats = useMemo(() => {
    const targetCol = selectedColumn || headers[0];
    if (!targetCol) return null;

    let numbers: number[] = [];
    let textCount = 0;
    let blankCount = 0;

    gridData.forEach(row => {
      const val = row[targetCol];
      if (val === undefined || val === null || val === "") {
        blankCount++;
      } else if (typeof val === 'number') {
        numbers.push(val);
      } else if (!isNaN(Number(val))) {
        numbers.push(Number(val));
      } else {
        textCount++;
      }
    });

    const sum = numbers.reduce((acc, curr) => acc + curr, 0);
    const avg = numbers.length > 0 ? sum / numbers.length : 0;
    const min = numbers.length > 0 ? Math.min(...numbers) : 0;
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;

    return {
      column: targetCol,
      totalRows: gridData.length,
      numericCount: numbers.length,
      textCount,
      blankCount,
      sum,
      avg,
      min,
      max
    };
  }, [gridData, selectedColumn, headers]);

  return (
    <div className="flex flex-col space-y-4 text-slate-200">
      
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-900/40 p-4 border border-white/10 rounded-xl">
        
        {/* Left Side: Search & Stats Column Switch */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar na planilha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950/60 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-56"
            />
          </div>
          
          <select
            value={selectedColumn || ""}
            onChange={(e) => setSelectedColumn(e.target.value || null)}
            className="bg-slate-950/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Análise: {selectedColumn || headers[0] || 'Coluna'}</option>
            {headers.map(h => (
              <option key={h} value={h}>Análise: {h}</option>
            ))}
          </select>
        </div>

        {/* Right Side: Action Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={addBlankRow}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            + Linha
          </button>

          <button
            onClick={() => setIsAddingCol(true)}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            + Coluna
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-red-500/20 border border-white/10 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-300 flex items-center gap-1.5 transition-all"
            title="Descartar edições locais"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Descartar
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Baixar XLSX
          </button>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-lg text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar CSV
          </button>

          <button
            onClick={handleApplyToApp}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/30 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar e Aplicar
          </button>
        </div>
      </div>

      {/* Dialog for adding column */}
      {isAddingCol && (
        <form onSubmit={handleAddColumnSubmit} className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-end gap-3 animate-fadeIn">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome da Nova Coluna:</label>
            <input
              type="text"
              required
              placeholder="Ex: Lucro_Estimado"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg text-white transition-all flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Adicionar
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCol(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Main Grid Wrapper */}
      <div className="overflow-x-auto border border-white/10 rounded-xl bg-slate-950/40 backdrop-blur-md max-h-[450px] overflow-y-auto shadow-inner relative">
        <table className="min-w-full text-left text-xs whitespace-nowrap border-collapse">
          {/* Header Row */}
          <thead className="sticky top-0 bg-slate-950 border-b border-white/15 text-slate-400 select-none z-10">
            <tr>
              {/* Corner helper cell */}
              <th className="px-3 py-2 text-center border-r border-b border-white/10 w-10 text-[9px] text-slate-600 bg-slate-950 sticky left-0 z-20">
                #
              </th>
              
              {/* Actual column headers */}
              {headers.map((header, colIndex) => (
                <th 
                  key={header} 
                  className={`px-4 py-2 border-r border-b border-white/10 min-w-[140px] relative group transition-colors ${selectedColumn === header ? 'bg-indigo-950/40 text-indigo-300' : 'hover:bg-slate-900/60'}`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-black text-indigo-400/80 mr-1 bg-indigo-950/80 px-1 rounded">
                      {getColLetter(colIndex)}
                    </span>
                    
                    <span 
                      onClick={() => handleSort(header)} 
                      className="font-bold text-slate-200 text-xs tracking-wide cursor-pointer flex-1 truncate py-1 hover:text-indigo-300 flex items-center gap-1"
                      title="Clique para ordenar"
                    >
                      {header}
                      {sortConfig?.key === header ? (
                        sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽'
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                      )}
                    </span>

                    {/* Column deletion button */}
                    <button
                      onClick={() => deleteColumn(header)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1"
                      title={`Excluir coluna ${header}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
              
              {/* Row Actions head */}
              <th className="px-3 py-2 border-b border-white/10 text-center w-12 bg-slate-950 sticky right-0 z-10">
                Ações
              </th>
            </tr>
          </thead>

          {/* Table Data Rows */}
          <tbody className="divide-y divide-white/5 font-mono">
            {processedRows.map((row, rIndex) => (
              <tr key={rIndex} className="hover:bg-white/[0.02] group transition-colors">
                
                {/* Row Index indicator */}
                <td className="px-3 py-1.5 text-center text-[10px] font-semibold text-slate-500 border-r border-white/10 bg-slate-950/80 select-none sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                  {rIndex + 1}
                </td>

                {/* Individual Cells */}
                {headers.map((header) => {
                  const isEditing = editingCell?.rowIndex === rIndex && editingCell?.colKey === header;
                  const value = row[header];
                  const displayValue = value === null || value === undefined ? "" : String(value);

                  return (
                    <td 
                      key={header} 
                      onDoubleClick={() => startEdit(rIndex, header, value)}
                      className={`px-4 py-1.5 border-r border-white/5 text-slate-300 transition-all group-hover:border-white/10 ${selectedColumn === header ? 'bg-indigo-950/10' : ''}`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveCellEdit}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                          />
                          <button 
                            onMouseDown={(e) => { e.preventDefault(); saveCellEdit(); }}
                            className="p-0.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white shrink-0"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button 
                            onMouseDown={(e) => { e.preventDefault(); cancelCellEdit(); }}
                            className="p-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-h-[1.5rem] flex items-center justify-between gap-1 cursor-text w-full group/cell" title="Duplo-clique para editar">
                          <span className="truncate">
                            {typeof value === 'boolean' ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {value ? 'VERDADEIRO' : 'FALSO'}
                              </span>
                            ) : (
                              displayValue
                            )}
                          </span>
                          
                          {/* Tiny subtle edit icon visible on hover */}
                          <span className="text-[9px] text-slate-600 opacity-0 group-hover/cell:opacity-100 transition-opacity select-none shrink-0 italic">
                            editar
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}

                {/* Actions cell (e.g., delete row) */}
                <td className="px-3 py-1.5 text-center bg-slate-900/60 sticky right-0 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.3)]">
                  <button
                    onClick={() => deleteRow(rIndex)}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                    title="Excluir esta linha"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {processedRows.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-sans">
            Nenhuma linha encontrada. Adicione uma linha usando o botão acima.
          </div>
        )}
      </div>

      {/* Spreadsheet Status & Calculation Bar (Excel style) */}
      {columnStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 border border-white/10 rounded-xl p-3 text-xs select-none">
          <div className="flex items-center gap-2 text-slate-400">
            <Calculator className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Análise da coluna <strong className="text-slate-200">{columnStats.column}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:col-span-3 text-slate-300">
            <div>Total: <span className="text-white font-mono font-bold">{columnStats.totalRows} lin.</span></div>
            
            {columnStats.numericCount > 0 ? (
              <>
                <div className="h-3 w-[1px] bg-white/10"></div>
                <div>Soma: <span className="text-emerald-400 font-mono font-bold">{columnStats.sum.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span></div>
                <div className="h-3 w-[1px] bg-white/10"></div>
                <div>Média: <span className="text-indigo-300 font-mono font-bold">{columnStats.avg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span></div>
                <div className="h-3 w-[1px] bg-white/10"></div>
                <div>Mín/Máx: <span className="text-amber-300 font-mono font-bold">{columnStats.min.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / {columnStats.max.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span></div>
              </>
            ) : (
              <>
                <div className="h-3 w-[1px] bg-white/10"></div>
                <div className="text-slate-500 italic">Valores não numéricos detectados.</div>
              </>
            )}

            <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Dica: Duplo-clique para editar células</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
