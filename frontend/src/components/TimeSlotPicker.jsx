import React from 'react';

const TimeSlotPicker = ({ selectedSlots, onChange, unavailableSlots = [] }) => {
  // Generate 24 hourly slots: "00:00 - 01:00", "01:00 - 02:00", etc.
  const generateSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const start = i.toString().padStart(2, '0') + ':00';
      const end = ((i + 1) % 24).toString().padStart(2, '0') + ':00';
      const slot = `${start}-${end}`;
      if (!unavailableSlots.includes(slot)) {
          slots.push(slot);
      }
    }
    return slots;
  };

  const slots = generateSlots();

  const toggleSlot = (slot) => {
    if (selectedSlots.includes(slot)) {
      onChange(selectedSlots.filter(s => s !== slot));
    } else {
      onChange([...selectedSlots, slot].sort()); // Keep sorted visually
    }
  };

  return (
    <>
      <style>{`
        .timeslot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 8px;
          margin: 15px 0;
        }
        .timeslot-card {
          padding: 8px 5px;
          font-size: 0.8rem;
          text-align: center;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-input);
          color: #ccc;
          user-select: none;
        }
        .timeslot-card:hover {
          border-color: var(--primary-color);
          color: white;
        }
        .timeslot-card.selected {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
      `}</style>
      <div className="timeslot-grid">
        {slots.map(slot => {
          const isSelected = selectedSlots.includes(slot);
          // Split to format nicely, e.g., 13:00 - 14:00
          const [start, end] = slot.split('-');
          return (
            <div 
              key={slot} 
              className={`timeslot-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleSlot(slot)}
            >
              {start}<br/>|<br/>{end}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TimeSlotPicker;
