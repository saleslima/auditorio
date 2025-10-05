// Booking functionality module
import { state, saveState } from './state.js';

export function openBookingModal(day) {
    const modal = document.getElementById('bookingModal');
    const title = document.getElementById('modalTitle');
    const periodsList = document.getElementById('periodsAvailable');

    const dateKey = `${state.currentYear}-${state.currentMonth}-${day}`;
    const key = `${state.currentYear}-${state.currentMonth}`;
    
    // Check if there's a custom configuration for this specific day
    const customConfig = state.customDayConfigurations && state.customDayConfigurations[dateKey];
    const config = customConfig || state.configurations[key];

    if (!config) return;

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    title.textContent = `${day} de ${months[state.currentMonth]} de ${state.currentYear}`;

    const dayBookings = state.bookings[dateKey] || [];

    periodsList.innerHTML = '';

    config.periods.forEach((period, index) => {
        const periodCard = createPeriodCard(period, index, dayBookings, dateKey, day);
        periodsList.appendChild(periodCard);
    });

    modal.classList.add('active');
}

function createPeriodCard(period, index, dayBookings, dateKey, day) {
    const periodBookings = dayBookings.filter(b => b.periodIndex === index && !b.cancellation);
    const totalSlots = period.slots || 1;
    const availableSlots = totalSlots - periodBookings.length;
    const isFullyBooked = availableSlots <= 0;

    const periodCard = document.createElement('div');
    periodCard.className = `period-card ${isFullyBooked ? 'booked' : ''}`;
    periodCard.innerHTML = `
        <h3>${period.name}</h3>
        <p>${period.start} - ${period.end}</p>
        <p class="slots-info"><strong>Vagas disponíveis: ${availableSlots} de ${totalSlots}</strong></p>
    `;

    if (!isFullyBooked) {
        periodCard.addEventListener('click', () => {
            showBookingForm(dateKey, index, period, day);
        });
    }

    return periodCard;
}

export function showBookingForm(dateKey, periodIndex, period, day) {
    const modal = document.getElementById('bookingModal');
    const title = document.getElementById('modalTitle');
    const periodsList = document.getElementById('periodsAvailable');

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    title.textContent = `Reservar: ${period.name}`;

    periodsList.innerHTML = `
        <div class="booking-form">
            <p class="booking-info">${day} de ${months[state.currentMonth]} de ${state.currentYear}</p>
            <p class="booking-info">${period.start} - ${period.end}</p>

            <label for="bookingName">Nome do Paciente:</label>
            <input 
                type="text" 
                id="bookingName" 
                placeholder="Nome completo"
                required
                style="text-transform: uppercase;"
            />

            <label for="bookingPhone">WhatsApp:</label>
            <input 
                type="tel" 
                id="bookingPhone" 
                placeholder="(00) 00000-0000"
                required
            />

            <div class="booking-actions">
                <button class="btn-secondary" id="cancelBooking">Cancelar</button>
                <button class="btn-primary" id="confirmBooking">Confirmar Reserva</button>
            </div>
        </div>
    `;

    setupBookingFormHandlers(dateKey, periodIndex, day);
}

function setupBookingFormHandlers(dateKey, periodIndex, day) {
    const nameInput = document.getElementById('bookingName');
    const phoneInput = document.getElementById('bookingPhone');
    const confirmBtn = document.getElementById('confirmBooking');
    const cancelBtn = document.getElementById('cancelBooking');

    const validateForm = () => {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        confirmBtn.disabled = !(name.length > 0 && phone.length > 0);
    };

    nameInput.addEventListener('input', () => {
        nameInput.value = nameInput.value.toUpperCase();
        validateForm();
    });

    phoneInput.addEventListener('input', validateForm);

    confirmBtn.disabled = true;

    confirmBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (name && phone) {
            bookPeriod(dateKey, periodIndex, { name, phone });
            openBookingModal(day);
        }
    });

    cancelBtn.addEventListener('click', () => {
        openBookingModal(day);
    });
}

function bookPeriod(dateKey, periodIndex, bookingData) {
    if (!state.bookings[dateKey]) {
        state.bookings[dateKey] = [];
    }
    state.bookings[dateKey].push({
        periodIndex,
        ...bookingData,
        timestamp: new Date().toISOString()
    });
    saveState();
    window.dispatchEvent(new CustomEvent('stateUpdated'));
}

export function showReport() {
    const reportModal = document.getElementById('reportModal');
    const reportContent = document.getElementById('reportContent');

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    let html = '';
    const bookingEntries = Object.entries(state.bookings).sort();

    if (bookingEntries.length === 0) {
        html = '<p class="no-bookings">Nenhuma reserva encontrada.</p>';
    } else {
        bookingEntries.forEach(([dateKey, bookings]) => {
            html += generateReportDateGroup(dateKey, bookings, months);
        });
    }

    reportContent.innerHTML = html;

    reportContent.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dateKey = e.target.dataset.date;
            const bookingIndex = parseInt(e.target.dataset.index);
            window.dispatchEvent(new CustomEvent('showCancellationModal', { 
                detail: { dateKey, bookingIndex } 
            }));
        });
    });

    reportModal.classList.add('active');
}

function generateReportDateGroup(dateKey, bookings, months) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const config = state.configurations[`${year}-${month}`];

    let html = `<div class="report-date-group">
        <h3>${day} de ${months[month]} de ${year}</h3>
        <div class="report-bookings">`;

    bookings.forEach((booking, bookingIndex) => {
        const period = config?.periods[booking.periodIndex];
        const periodName = period ? period.name : 'Período desconhecido';
        const periodTime = period ? `${period.start} - ${period.end}` : '';

        html += generateBookingCard(booking, periodName, periodTime, dateKey, bookingIndex);
    });

    html += `</div></div>`;
    return html;
}

function generateBookingCard(booking, periodName, periodTime, dateKey, bookingIndex) {
    return `
        <div class="report-booking-card">
            <div class="report-booking-header">
                <strong>${periodName}</strong>
                <span class="report-booking-time">${periodTime}</span>
            </div>
            <div class="report-booking-details">
                <p><strong>Paciente:</strong> ${booking.name}</p>
                <p><strong>WhatsApp:</strong> ${booking.phone}</p>
                ${booking.entity ? `<p><strong>Entidade:</strong> ${booking.entity}</p>` : ''}
                ${booking.details ? `<p><strong>Descrição:</strong> ${booking.details}</p>` : ''}
                <p class="report-booking-timestamp">
                    Reservado em: ${new Date(booking.timestamp).toLocaleString('pt-BR')}
                </p>
                ${booking.cancellation ? `
                    <p class="report-booking-cancellation">
                        <strong>CANCELADO</strong><br>
                        Motivo: ${booking.cancellation.reason}<br>
                        Solicitado por: ${booking.cancellation.requestedBy}<br>
                        Cancelado em: ${new Date(booking.cancellation.timestamp).toLocaleString('pt-BR')}
                    </p>
                ` : `
                    <button class="btn-cancel" data-date="${dateKey}" data-index="${bookingIndex}">
                        Cancelar Reserva
                    </button>
                `}
            </div>
        </div>
    `;
}