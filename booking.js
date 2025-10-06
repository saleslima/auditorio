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
    // Format phone number for WhatsApp link (remove non-numeric characters)
    const cleanPhone = booking.phone.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/55${cleanPhone}`;
    
    return `
        <div class="report-booking-card">
            <div class="report-booking-header">
                <strong>${periodName}</strong>
                <span class="report-booking-time">${periodTime}</span>
            </div>
            <div class="report-booking-details">
                <p><strong>Paciente:</strong> ${booking.name}</p>
                <p style="display: flex; align-items: center; gap: 8px;">
                    <strong>WhatsApp:</strong> 
                    <a href="${whatsappLink}" target="_blank" class="whatsapp-link">${booking.phone}</a>
                    <a href="${whatsappLink}" target="_blank" class="whatsapp-icon" title="Abrir WhatsApp">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                    </a>
                </p>
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