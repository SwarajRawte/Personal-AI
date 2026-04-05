import React from 'react';
import { getEndpoint } from './config';

function CalendarConnect() {
  return (
    <div className="db-card">
      <h2 className="db-card-title">Connect Your Calendar</h2>
      <p className="db-card-subtitle">Sync your calendar to stay on top of events.</p>
      <div className="db-cal-buttons">
        <a href={getEndpoint('/calendar/google/login')} className="db-cal-btn">
          <span></span> Google Calendar
        </a>
        <a href={getEndpoint('/calendar/outlook/login')} className="db-cal-btn">
          <span></span> Connect Outlook Calendar
        </a>
      </div>
    </div>
  );
}


export default CalendarConnect;
