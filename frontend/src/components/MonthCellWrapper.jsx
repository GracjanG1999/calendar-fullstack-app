// Komponenty opakowujące komórki widoku miesięcznego w react-big-calendar.
// Pozwalają na obsługę kliknięć w puste miejsca siatki i nagłówki dat,
// co otwiera modal dodawania nowego wydarzenia z pre-wypełnioną datą.

import React from 'react';

// Opakowanie całej komórki dnia — przechwytuje kliknięcie w pustą przestrzeń komórki.
// Przekazywany przez `components.dateCellWrapper` (działa tylko dla widoku miesiąc).
export const MonthDateCellWrapper = ({ children, value, onOpen }) => (
  <div
    className="month-cell-click-area"
    onClick={() => onOpen?.(value)}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </div>
);

// Nadpisuje domyślny nagłówek z numerem dnia — kliknięcie otwiera modal.
// Przekazywany przez `components.month.dateHeader`.
export const MonthDateHeader = ({ date, label, onOpen }) => (
  <span
    className="month-date-header-click"
    onClick={() => onOpen?.(date)}
    title="Dodaj wydarzenie"
  >
    {label}
  </span>
);
