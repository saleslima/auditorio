// Modal management module
import { state, saveState } from './state.js';
import { renderBlockedCalendar, renderCalendar } from './calendar.js';
import { renderCustomizeCalendar } from './admin.js';

export function initializeModals() {
    initializeBookingModal();
    initializeReportModal();
    initializeBlockedDaysModal();
    initializeCancellationModal();
    initializeCustomizeDayModal();
    initializeCustomizeDayFormModal();
}

function initializeBookingModal() {
    const modal = document.getElementById('bookingModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function initializeReportModal() {
    const reportModal = document.getElementById('reportModal');
    const closeReport = document.getElementById('closeReport');

    closeReport.addEventListener('click', () => {
        reportModal.classList.remove('active');
    });

    reportModal.addEventListener('click', (e) => {
        if (e.target === reportModal) {
            reportModal.classList.remove('active');
        }
    });
}

function initializeBlockedDaysModal() {
    const blockedDaysModal = document.getElementById('blockedDaysModal');
    const closeBlockedDays = document.getElementById('closeBlockedDays');

    closeBlockedDays.addEventListener('click', () => {
        blockedDaysModal.classList.remove('active');
    });

    blockedDaysModal.addEventListener('click', (e) => {
        if (e.target === blockedDaysModal) {
            blockedDaysModal.classList.remove('active');
        }
    });

    const prevMonthBlocked = document.getElementById('prevMonthBlocked');
    const nextMonthBlocked = document.getElementById('nextMonthBlocked');

    if (prevMonthBlocked && nextMonthBlocked) {
        prevMonthBlocked.addEventListener('click', () => {
            state.blockedCalendarMonth--;
            if (state.blockedCalendarMonth < 0) {
                state.blockedCalendarMonth = 11;
                state.blockedCalendarYear--;
            }
            renderBlockedCalendar();
        });

        nextMonthBlocked.addEventListener('click', () => {
            state.blockedCalendarMonth++;
            if (state.blockedCalendarMonth > 11) {
                state.blockedCalendarMonth = 0;
                state.blockedCalendarYear++;
            }
            renderBlockedCalendar();
        });
    }
}

function initializeCancellationModal() {
    const modal = document.getElementById('cancellationModal');
    const closeBtn = document.getElementById('closeCancellation');
    const passwordInput = document.getElementById('cancelPassword');
    const reasonInput = document.getElementById('cancelReason');
    const requestedByInput = document.getElementById('cancelRequestedBy');
    const confirmBtn = document.getElementById('confirmCancelBtn');
    const cancelBtn = document.getElementById('cancelCancelBtn');

    const validateForm = () => {
        const password = passwordInput.value;
        const reason = reasonInput.value.trim();
        const requestedBy = requestedByInput.value.trim();

        confirmBtn.disabled = !(password === 'daqta' && reason.length >= 10 && requestedBy.length > 0);
    };

    passwordInput.addEventListener('input', validateForm);

    reasonInput.addEventListener('input', () => {
        reasonInput.value = reasonInput.value.toUpperCase();
        validateForm();
    });

    requestedByInput.addEventListener('input', () => {
        requestedByInput.value = requestedByInput.value.toUpperCase();
        validateForm();
    });

    confirmBtn.addEventListener('click', () => {
        const dateKey = modal.dataset.dateKey;
        const bookingIndex = parseInt(modal.dataset.bookingIndex);
        const reason = reasonInput.value.trim();
        const requestedBy = requestedByInput.value.trim();

        if (state.bookings[dateKey] && state.bookings[dateKey][bookingIndex]) {
            state.bookings[dateKey][bookingIndex].cancellation = {
                reason,
                requestedBy,
                timestamp: new Date().toISOString()
            };
            saveState();
            renderCalendar();
            modal.classList.remove('active');
            window.dispatchEvent(new CustomEvent('showReport'));
            alert('Reserva cancelada com sucesso!');
        }
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function initializeCustomizeDayModal() {
    const customizeDayModal = document.getElementById('customizeDayModal');
    const closeCustomizeDay = document.getElementById('closeCustomizeDay');

    closeCustomizeDay.addEventListener('click', () => {
        customizeDayModal.classList.remove('active');
    });

    customizeDayModal.addEventListener('click', (e) => {
        if (e.target === customizeDayModal) {
            customizeDayModal.classList.remove('active');
        }
    });

    const prevMonthCustomize = document.getElementById('prevMonthCustomize');
    const nextMonthCustomize = document.getElementById('nextMonthCustomize');

    if (prevMonthCustomize && nextMonthCustomize) {
        prevMonthCustomize.addEventListener('click', () => {
            state.customizeCalendarMonth--;
            if (state.customizeCalendarMonth < 0) {
                state.customizeCalendarMonth = 11;
                state.customizeCalendarYear--;
            }
            renderCustomizeCalendar();
        });

        nextMonthCustomize.addEventListener('click', () => {
            state.customizeCalendarMonth++;
            if (state.customizeCalendarMonth > 11) {
                state.customizeCalendarMonth = 0;
                state.customizeCalendarYear++;
            }
            renderCustomizeCalendar();
        });
    }
}

function initializeCustomizeDayFormModal() {
    const modal = document.getElementById('customizeDayFormModal');
    const closeBtn = document.getElementById('closeCustomizeDayForm');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

export function showCancellationModal(dateKey, bookingIndex) {
    const modal = document.getElementById('cancellationModal');
    modal.dataset.dateKey = dateKey;
    modal.dataset.bookingIndex = bookingIndex;
    modal.classList.add('active');

    document.getElementById('cancelPassword').value = '';
    document.getElementById('cancelReason').value = '';
    document.getElementById('cancelRequestedBy').value = '';
    document.getElementById('confirmCancelBtn').disabled = true;
}