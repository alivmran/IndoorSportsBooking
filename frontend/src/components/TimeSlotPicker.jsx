import React from 'react';

const to12Hour = (time24) => {
  const hour = Number(time24.split(':')[0]);
  const normalized = hour % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const hour12 = normalized % 12 || 12;
  return `${hour12}:00 ${suffix}`;
};

const TimeSlotPicker = ({
  selectedSlots,
  onChange,
  unavailableSlots = [],
  startHour = 0,
  endHour = 24,
  selectedDate = ''
}) => {
  const generateSlots = () => {
    const slots = [];
    const now = new Date();
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const hidePastHours = selectedDate === today;
    const currentHour = now.getHours();
    for (let i = startHour; i < endHour; i++) {
      if (hidePastHours && i <= currentHour) continue;
      const start = i.toString().padStart(2, '0') + ':00';
      const end = (i + 1).toString().padStart(2, '0') + ':00';
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
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
          margin: 15px 0;
        }
        .timeslot-card {
          padding: 12px 10px;
          font-size: 0.82rem;
          text-align: center;
          border: 1px solid #334155;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          color: #cbd5e1;
          user-select: none;
          font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
        }
        .timeslot-card:hover {
          border-color: #60a5fa;
          color: #e2e8f0;
          transform: translateY(-1px);
        }
        .timeslot-card.selected {
          background: linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%);
          color: white;
          border-color: #60a5fa;
          box-shadow: 0 0 0 1px rgba(96,165,250,0.45);
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
              {to12Hour(start)}<br/>to<br/>{to12Hour(end)}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TimeSlotPicker;
