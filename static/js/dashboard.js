// Global state
let currentView = 'calendar';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allEvents = [];
let allSchedules = {};
let filteredEventType = 'all';
let currentEditingEvent = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateClock();
    setInterval(updateClock, 1000);
});

// Update clock
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-time').textContent = timeStr;
    
    // Update today's info
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    document.getElementById('today-date').textContent = dateStr;
}

// Load all data
async function loadData() {
    try {
        // Load events
        const eventsResponse = await fetch('/api/special-dates');
        const eventsData = await eventsResponse.json();
        if (eventsData.success) {
            allEvents = eventsData.dates;
        }
        
        // Load schedules
        const schedulesResponse = await fetch('/api/schedules');
        const schedulesData = await schedulesResponse.json();
        if (schedulesData.success) {
            allSchedules = schedulesData.schedules;
        }
        
        // Update UI
        updateTodayInfo();
        renderCalendar();
        renderEventsList();
        renderSchedulesView();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('today-schedule').textContent = 'Error loading data';
    }
}

// Update today's info banner
function updateTodayInfo() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Find today's event
    const todayEvent = allEvents.find(event => {
        if (event.type === 'single') {
            return event.date === todayStr;
        } else if (event.type === 'range') {
            const start = new Date(event.start_date);
            const end = new Date(event.end_date);
            return today >= start && today <= end;
        }
        return false;
    });
    
    if (todayEvent && todayEvent.schedule) {
        const schedule = allSchedules[todayEvent.schedule];
        document.getElementById('today-schedule').textContent = schedule ? schedule.name : 'Special Schedule';
    } else {
        document.getElementById('today-schedule').textContent = 'Normal Schedule';
    }
    
    // Calculate next bell (mock data for now)
    document.getElementById('next-bell').textContent = 'Next bell at 10:00 AM (in 2 hours 15 minutes)';
}

// View switching
function showView(view) {
    currentView = view;
    
    // Hide all views
    document.getElementById('calendar-view').classList.add('hidden');
    document.getElementById('list-view').classList.add('hidden');
    document.getElementById('schedules-view').classList.add('hidden');
    
    // Reset button styles
    document.getElementById('btn-calendar').classList.remove('bg-primary', 'text-white');
    document.getElementById('btn-list').classList.remove('bg-primary', 'text-white');
    document.getElementById('btn-schedules').classList.remove('bg-primary', 'text-white');
    
    document.getElementById('btn-calendar').classList.add('bg-gray-200', 'text-gray-700');
    document.getElementById('btn-list').classList.add('bg-gray-200', 'text-gray-700');
    document.getElementById('btn-schedules').classList.add('bg-gray-200', 'text-gray-700');
    
    // Show selected view
    if (view === 'calendar') {
        document.getElementById('calendar-view').classList.remove('hidden');
        document.getElementById('btn-calendar').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('btn-calendar').classList.add('bg-primary', 'text-white');
        renderCalendar();
    } else if (view === 'list') {
        document.getElementById('list-view').classList.remove('hidden');
        document.getElementById('btn-list').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('btn-list').classList.add('bg-primary', 'text-white');
        renderEventsList();
    } else if (view === 'schedules') {
        document.getElementById('schedules-view').classList.remove('hidden');
        document.getElementById('btn-schedules').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('btn-schedules').classList.add('bg-primary', 'text-white');
        renderSchedulesView();
    }
}

// Calendar functions
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear grid
    grid.innerHTML = '';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'text-center font-semibold text-gray-700 py-2';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day bg-gray-50 rounded-lg p-2 border border-gray-200';
        grid.appendChild(emptyCell);
    }
    
    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
        
        // Check if this day has events
        const dayEvents = allEvents.filter(event => {
            if (filteredEventType !== 'all' && event.schedule !== filteredEventType) {
                return false;
            }
            
            if (event.type === 'single') {
                return event.date === dateStr;
            } else if (event.type === 'range') {
                const eventStart = new Date(event.start_date);
                const eventEnd = new Date(event.end_date);
                const currentDate = new Date(dateStr);
                return currentDate >= eventStart && currentDate <= eventEnd;
            }
            return false;
        });
        
        const cell = document.createElement('div');
        cell.className = `calendar-day rounded-lg p-2 border cursor-pointer ${isToday ? 'bg-blue-50 border-2 border-blue-600' : dayEvents.length > 0 ? 'bg-white border border-gray-200' : 'bg-gray-50 border border-gray-200'}`;
        cell.onclick = () => viewDayDetails(dateStr);
        
        const dateDiv = document.createElement('div');
        dateDiv.className = `font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`;
        dateDiv.textContent = day;
        cell.appendChild(dateDiv);
        
        if (isToday) {
            const todayLabel = document.createElement('div');
            todayLabel.className = 'text-xs font-semibold text-blue-700';
            todayLabel.textContent = 'TODAY';
            cell.appendChild(todayLabel);
        }
        
        // Add event badges
        dayEvents.forEach(event => {
            const badge = document.createElement('div');
            badge.className = `schedule-code-${event.schedule || 'default'} event-badge`;
            badge.textContent = `${event.schedule || ''} ${event.schedule === 'c' ? 'Chapel' : ''}`.trim();
            cell.appendChild(badge);
        });
        
        grid.appendChild(cell);
    }
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderCalendar();
}

function filterEvents(type) {
    filteredEventType = type;
    renderCalendar();
    renderEventsList();
}

// List view functions
function renderEventsList() {
    const list = document.getElementById('events-list');
    list.innerHTML = '';
    
    if (allEvents.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">No events scheduled</p>';
        return;
    }
    
    // Sort events by date
    const sortedEvents = [...allEvents].sort((a, b) => {
        const dateA = a.type === 'single' ? a.date : a.start_date;
        const dateB = b.type === 'single' ? b.date : b.start_date;
        return dateA.localeCompare(dateB);
    });
    
    sortedEvents.forEach(event => {
        if (filteredEventType !== 'all' && event.schedule !== filteredEventType) {
            return;
        }
        
        const item = document.createElement('div');
        const scheduleClass = event.schedule ? `schedule-code-${event.schedule}` : 'schedule-code-default';
        const borderColor = {
            'X': 'border-red-500 bg-red-50',
            'L': 'border-yellow-500 bg-yellow-50',
            'Z': 'border-blue-500 bg-blue-50',
            'c': 'border-purple-500 bg-purple-50',
            'H': 'border-green-500 bg-green-50',
            'S': 'border-orange-500 bg-orange-50'
        }[event.schedule] || 'border-gray-300 bg-gray-50';
        
        item.className = `border-l-4 ${borderColor} p-4 rounded hover:shadow-md transition cursor-pointer`;
        item.onclick = () => openEditEventWithData(event);
        
        const dateStr = event.type === 'single' 
            ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : `${new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        
        const scheduleName = allSchedules[event.schedule]?.name || 'Custom';
        
        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <p class="font-semibold text-gray-900">${dateStr}</p>
                    <p class="text-sm text-gray-700">${event.raw || scheduleName}</p>
                    <span class="${scheduleClass} event-badge mt-2 inline-block">${event.schedule || ''} ${scheduleName}${event.additional ? ' +' : ''}</span>
                </div>
                <button onclick="event.stopPropagation(); openEditEventWithData(${JSON.stringify(event).replace(/"/g, '&quot;')})" class="text-blue-600 hover:text-blue-800 px-3 py-1">Edit</button>
            </div>
        `;
        
        list.appendChild(item);
    });
}

function searchEvents(query) {
    const items = document.getElementById('events-list').children;
    query = query.toLowerCase();
    
    Array.from(items).forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
}

// Schedules view functions
function renderSchedulesView() {
    const grid = document.getElementById('schedules-grid');
    grid.innerHTML = '';
    
    Object.entries(allSchedules).forEach(([code, schedule]) => {
        const isNormal = code === ' ' || code === 'Normal';
        const card = document.createElement('div');
        card.className = `border-2 ${isNormal ? 'border-gray-200' : 'border-yellow-200 bg-yellow-50'} rounded-lg p-6 hover:border-primary transition`;
        
        const usageCount = allEvents.filter(e => e.schedule === code).length;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-900">${code} - ${schedule.name}</h3>
                    <p class="text-sm text-gray-600">${schedule.description || 'Bell schedule'}</p>
                </div>
            </div>
            <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Total Bells:</span>
                    <span class="font-semibold">${schedule.times?.length || 0} per day</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Used:</span>
                    <span class="font-semibold">${usageCount} times this year</span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editScheduleTimes('${code}')" class="flex-1 bg-primary hover:bg-secondary text-white py-2 rounded-lg transition">
                    Edit Times
                </button>
                ${!isNormal ? `<button onclick="confirmDeleteSchedule('${code}')" class="px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition">Delete</button>` : ''}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function editScheduleTimes(code) {
    alert(`Edit bell times for schedule: ${code}\n\nThis will open the schedule editor page.`);
    // TODO: Navigate to schedule editor page
}

function confirmDeleteSchedule(code) {
    if (confirm(`Delete schedule "${code}"?\n\nThis will also remove it from all assigned dates.`)) {
        deleteSchedule(code);
    }
}

async function deleteSchedule(code) {
    try {
        const response = await fetch(`/api/schedules/${code}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            delete allSchedules[code];
            renderSchedulesView();
            alert('Schedule deleted successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule');
    }
}

// Modal functions
function openAddEventModal() {
    document.getElementById('addEventModal').classList.remove('hidden');
    document.getElementById('event-date').value = '';
    document.getElementById('event-start-date').value = '';
    document.getElementById('event-end-date').value = '';
    document.getElementById('event-schedule').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-additional').checked = false;
}

function closeAddEventModal() {
    document.getElementById('addEventModal').classList.add('hidden');
}

function toggleDateRange() {
    const type = document.getElementById('event-type').value;
    const singleSection = document.getElementById('single-date-section');
    const rangeSection = document.getElementById('date-range-section');
    
    if (type === 'single') {
        singleSection.classList.remove('hidden');
        rangeSection.classList.add('hidden');
    } else {
        singleSection.classList.add('hidden');
        rangeSection.classList.remove('hidden');
    }
}

async function saveEvent() {
    const type = document.getElementById('event-type').value;
    const schedule = document.getElementById('event-schedule').value;
    const description = document.getElementById('event-description').value;
    const additional = document.getElementById('event-additional').checked;
    
    let eventData = {
        schedule: schedule,
        description: description,
        additional: additional
    };
    
    if (type === 'single') {
        const date = document.getElementById('event-date').value;
        if (!date) {
            alert('Please select a date');
            return;
        }
        eventData.date = date;
    } else {
        const startDate = document.getElementById('event-start-date').value;
        const endDate = document.getElementById('event-end-date').value;
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        eventData.start_date = startDate;
        eventData.end_date = endDate;
    }
    
    try {
        const response = await fetch('/api/special-dates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeAddEventModal();
            loadData();
            alert('Event added successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Failed to save event');
    }
}

function openEditEventWithData(event) {
    currentEditingEvent = event;
    
    const dateStr = event.type === 'single' 
        ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : `${new Date(event.start_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`;
    
    document.getElementById('edit-event-date').value = dateStr;
    document.getElementById('edit-event-schedule').value = event.schedule || '';
    document.getElementById('edit-event-description').value = event.raw || '';
    document.getElementById('edit-event-additional').checked = event.additional || false;
    
    document.getElementById('editEventModal').classList.remove('hidden');
}

function closeEditEventModal() {
    document.getElementById('editEventModal').classList.add('hidden');
    currentEditingEvent = null;
}

async function updateEvent() {
    if (!currentEditingEvent) return;
    
    const schedule = document.getElementById('edit-event-schedule').value;
    const description = document.getElementById('edit-event-description').value;
    const additional = document.getElementById('edit-event-additional').checked;
    
    const eventData = {
        ...currentEditingEvent,
        schedule: schedule,
        description: description,
        additional: additional
    };
    
    try {
        const response = await fetch('/api/special-dates', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeEditEventModal();
            loadData();
            alert('Event updated successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Failed to update event');
    }
}

async function deleteEvent() {
    if (!currentEditingEvent) return;
    
    if (!confirm('Delete this event?')) return;
    
    try {
        const response = await fetch('/api/special-dates', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentEditingEvent)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeEditEventModal();
            loadData();
            alert('Event deleted successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
    }
}

function viewDayDetails(dateStr) {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    document.getElementById('day-details-title').textContent = dateFormatted;
    
    // Find events for this day
    const dayEvents = allEvents.filter(event => {
        if (event.type === 'single') {
            return event.date === dateStr;
        } else if (event.type === 'range') {
            const eventStart = new Date(event.start_date);
            const eventEnd = new Date(event.end_date);
            const currentDate = new Date(dateStr);
            return currentDate >= eventStart && currentDate <= eventEnd;
        }
        return false;
    });
    
    const content = document.getElementById('day-details-content');
    content.innerHTML = '';
    
    if (dayEvents.length === 0) {
        content.innerHTML = '<p class="text-gray-600">Normal schedule - no special events</p>';
    } else {
        dayEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'bg-gray-50 p-4 rounded-lg';
            
            const scheduleName = allSchedules[event.schedule]?.name || 'Custom Schedule';
            eventDiv.innerHTML = `
                <p class="font-semibold text-gray-900">${scheduleName}</p>
                <p class="text-sm text-gray-600 mt-1">${event.raw || 'Special event'}</p>
                <span class="schedule-code-${event.schedule || 'default'} event-badge mt-2 inline-block">${event.schedule || ''} ${scheduleName}${event.additional ? ' +' : ''}</span>
            `;
            
            content.appendChild(eventDiv);
        });
    }
    
    document.getElementById('dayDetailsModal').classList.remove('hidden');
}

function closeDayDetailsModal() {
    document.getElementById('dayDetailsModal').classList.add('hidden');
}

function openQuickActionsModal() {
    document.getElementById('quickActionsModal').classList.remove('hidden');
}

function closeQuickActionsModal() {
    document.getElementById('quickActionsModal').classList.add('hidden');
}

function quickAction(action) {
    closeQuickActionsModal();
    
    if (action === 'addChapel') {
        if (confirm('Add "No bell after chapel" for all Tuesdays in the academic year?')) {
            // TODO: Implement bulk add chapel
            alert('This feature will add chapel events for all Tuesdays.\n\nComing soon!');
        }
    } else if (action === 'addLateStarts') {
        alert('Select multiple dates to apply Late Start schedule.\n\nComing soon!');
    } else if (action === 'copyPreviousYear') {
        if (confirm('Import events from 2024-2025 academic year?')) {
            alert('This will copy all special dates and schedules from last year.\n\nComing soon!');
        }
    } else if (action === 'bulkEdit') {
        alert('Bulk edit mode: Select multiple events to change at once.\n\nComing soon!');
    }
}

function openCreateScheduleModal() {
    document.getElementById('createScheduleModal').classList.remove('hidden');
    document.getElementById('new-schedule-code').value = '';
    document.getElementById('new-schedule-name').value = '';
    document.getElementById('new-schedule-description').value = '';
}

function closeCreateScheduleModal() {
    document.getElementById('createScheduleModal').classList.add('hidden');
}

async function createSchedule() {
    const code = document.getElementById('new-schedule-code').value.trim().toUpperCase();
    const name = document.getElementById('new-schedule-name').value.trim();
    const description = document.getElementById('new-schedule-description').value.trim();
    
    if (!code || !name) {
        alert('Please enter both code and name');
        return;
    }
    
    if (code.length !== 1) {
        alert('Schedule code must be a single letter');
        return;
    }
    
    try {
        const response = await fetch('/api/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, description })
        });
        
        const data = await response.json();
        
        if (data.success) {
            allSchedules[code] = { name, description, times: [] };
            closeCreateScheduleModal();
            renderSchedulesView();
            alert('Schedule created successfully!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error creating schedule:', error);
        alert('Failed to create schedule');
    }
}