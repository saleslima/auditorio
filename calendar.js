// Calendar rendering module
import { state, saveState } from './state.js';

export function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const title = document.getElementById('calendarTitle');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    title.textContent = `${months[state.currentMonth]} ${state.currentYear}`;

    const key = `${state.currentYear}-${state.currentMonth}`;
    const config = state.configurations[key];

    calendar.innerHTML = '';

    renderCalendarHeader(calendar);
    renderCalendarDays(calendar, config);
}

function renderCalendarHeader(calendar) {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach(name => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day empty';
        dayHeader.style.fontWeight = '600';
        dayHeader.textContent = name;
        calendar.appendChild(dayHeader);
    });
}

function renderCalendarDays(calendar, config) {
    const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
    const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day, config);
        calendar.appendChild(dayElement);
    }
}

function createDayElement(day, config) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;

    const dateKey = `${state.currentYear}-${state.currentMonth}-${day}`;
    const isBlocked = state.blockedDays[dateKey];

    if (isBlocked) {
        dayElement.classList.add('blocked');
        dayElement.title = 'Dia bloqueado pelo administrador';
    } else {
        const date = new Date(state.currentYear, state.currentMonth, day);
        const dayOfWeek = date.getDay();

        // Check if there's a custom configuration for this specific day
        const customConfig = state.customDayConfigurations && state.customDayConfigurations[dateKey];
        const effectiveConfig = customConfig || config;

        if (!effectiveConfig || (!customConfig && !config.availableDays.includes(dayOfWeek))) {
            dayElement.classList.add('disabled');
        } else {
            applyBookingStatus(dayElement, dateKey, effectiveConfig);
            dayElement.addEventListener('dblclick', () => {
                window.dispatchEvent(new CustomEvent('openBookingModal', { detail: { day } }));
            });
        }
    }

    return dayElement;
}

function applyBookingStatus(dayElement, dateKey, config) {
    const dayBookings = state.bookings[dateKey] || [];
    const activeBookings = dayBookings.filter(b => !b.cancellation);

    let totalSlots = 0;
    let bookedSlots = 0;

    config.periods.forEach((period, index) => {
        totalSlots += period.slots || 1;
        const periodBookings = activeBookings.filter(b => b.periodIndex === index);
        bookedSlots += periodBookings.length;
    });

    if (bookedSlots === 0) {
        dayElement.classList.add('available');
    } else if (bookedSlots < totalSlots) {
        dayElement.classList.add('partially-booked');
    } else {
        dayElement.classList.add('fully-booked');
    }
}

export function renderBlockedCalendar() {
    const calendar = document.getElementById('blockedCalendar');
    const title = document.getElementById('blockedCalendarTitle');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    title.textContent = `${months[state.blockedCalendarMonth]} ${state.blockedCalendarYear}`;

    calendar.innerHTML = '';

    renderCalendarHeader(calendar);
    renderBlockedCalendarDays(calendar);
}

function renderBlockedCalendarDays(calendar) {
    const firstDay = new Date(state.blockedCalendarYear, state.blockedCalendarMonth, 1).getDay();
    const daysInMonth = new Date(state.blockedCalendarYear, state.blockedCalendarMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const dateKey = `${state.blockedCalendarYear}-${state.blockedCalendarMonth}-${day}`;
        const isBlocked = state.blockedDays[dateKey];

        if (isBlocked) {
            dayElement.classList.add('blocked');
        } else {
            dayElement.classList.add('available');
        }

        dayElement.addEventListener('click', () => {
            toggleBlockedDay(dateKey);
        });

        calendar.appendChild(dayElement);
    }
}

export function toggleBlockedDay(dateKey) {
    if (state.blockedDays[dateKey]) {
        delete state.blockedDays[dateKey];
    } else {
        if (state.bookings[dateKey] && state.bookings[dateKey].length > 0) {
            alert('Não é possível bloquear este dia. Existem agendamentos que precisam ser cancelados primeiro.');
            return;
        }
        state.blockedDays[dateKey] = true;
    }
    saveState();
    renderBlockedCalendar();
    renderCalendar();
}

export function initializeUserPanel() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar();
    });

    renderCalendar();
}