// Admin panel functionality module
import { state, saveState } from './state.js';
import { renderCalendar, renderBlockedCalendar } from './calendar.js';

export function initializeAdminPanel() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    for (let i = currentYear; i <= currentYear + 2; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }

    monthSelect.value = state.currentMonth;
    yearSelect.value = state.currentYear;

    document.getElementById('addPeriodBtn').addEventListener('click', addPeriod);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfiguration);
    document.getElementById('reportBtn').addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('showReport'));
    });
    document.getElementById('manageBlockedDaysBtn').addEventListener('click', showBlockedDaysModal);
    document.getElementById('resetMonthBtn').addEventListener('click', resetMonth);
    document.getElementById('customizeDayBtn').addEventListener('click', showCustomizeDayModal);

    updateRemoveButtons();
}

function addPeriod() {
    const container = document.getElementById('periodsContainer');
    const periods = container.querySelectorAll('.period-item');
    
    if (periods.length >= 3) {
        alert('Máximo de 3 períodos por dia');
        return;
    }

    const periodItem = document.createElement('div');
    periodItem.className = 'period-item';
    periodItem.innerHTML = `
        <input type="text" placeholder="Nome do período" class="period-name">
        <input type="time" class="period-start">
        <input type="time" class="period-end">
        <input type="number" placeholder="Vagas" min="1" value="5" class="period-slots">
        <button class="remove-period">×</button>
    `;

    const removeBtn = periodItem.querySelector('.remove-period');
    removeBtn.addEventListener('click', () => {
        periodItem.remove();
        updateRemoveButtons();
    });

    container.appendChild(periodItem);
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const container = document.getElementById('periodsContainer');
    const removeButtons = container.querySelectorAll('.remove-period');
    removeButtons.forEach((btn) => {
        btn.disabled = removeButtons.length === 1;
    });
}

function saveConfiguration() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);

    const daysCheckboxes = document.querySelectorAll('.days-selector input[type="checkbox"]');
    const availableDays = Array.from(daysCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

    const periodItems = document.querySelectorAll('.period-item');
    const periods = Array.from(periodItems).map(item => ({
        name: item.querySelector('.period-name').value,
        start: item.querySelector('.period-start').value,
        end: item.querySelector('.period-end').value,
        slots: parseInt(item.querySelector('.period-slots').value) || 1,
    })).filter(p => p.name && p.start && p.end);

    if (periods.length === 0) {
        alert('Adicione pelo menos um período');
        return;
    }

    if (availableDays.length === 0) {
        alert('Selecione pelo menos um dia da semana');
        return;
    }

    const key = `${year}-${month}`;
    state.configurations[key] = {
        availableDays,
        periods,
    };

    saveState();
    alert('Configuração salva com sucesso!');
}

function resetMonth() {
    const password = prompt('Digite a senha de administrador para resetar o mês:');
    if (password !== 'daqta') {
        alert('Senha incorreta!');
        return;
    }
    
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const confirmMsg = `Tem certeza que deseja RESETAR todos os dados de ${months[month]} ${year}?\\n\\nIsto irá apagar:\\n- Configurações do mês\\n- Todos os agendamentos\\n- Dias bloqueados\\n\\nEsta ação não pode ser desfeita!`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    const configKey = `${year}-${month}`;
    delete state.configurations[configKey];
    
    const bookingKeys = Object.keys(state.bookings);
    bookingKeys.forEach(dateKey => {
        const [bookingYear, bookingMonth] = dateKey.split('-').map(Number);
        if (bookingYear === year && bookingMonth === month) {
            delete state.bookings[dateKey];
        }
    });
    
    const blockedKeys = Object.keys(state.blockedDays);
    blockedKeys.forEach(dateKey => {
        const [blockedYear, blockedMonth] = dateKey.split('-').map(Number);
        if (blockedYear === year && blockedMonth === month) {
            delete state.blockedDays[dateKey];
        }
    });
    
    saveState();
    renderCalendar();
    alert(`Mês ${months[month]} ${year} foi resetado com sucesso!`);
}

function showBlockedDaysModal() {
    const modal = document.getElementById('blockedDaysModal');
    state.blockedCalendarMonth = state.currentMonth;
    state.blockedCalendarYear = state.currentYear;
    renderBlockedCalendar();
    modal.classList.add('active');
}

function showCustomizeDayModal() {
    const modal = document.getElementById('customizeDayModal');
    state.customizeCalendarMonth = state.currentMonth;
    state.customizeCalendarYear = state.currentYear;
    renderCustomizeCalendar();
    modal.classList.add('active');
}

export function renderCustomizeCalendar() {
    const calendar = document.getElementById('customizeCalendar');
    const title = document.getElementById('customizeCalendarTitle');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    title.textContent = `${months[state.customizeCalendarMonth]} ${state.customizeCalendarYear}`;

    calendar.innerHTML = '';

    // Add day headers
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach(name => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day empty';
        dayHeader.style.fontWeight = '600';
        dayHeader.textContent = name;
        calendar.appendChild(dayHeader);
    });

    const firstDay = new Date(state.customizeCalendarYear, state.customizeCalendarMonth, 1).getDay();
    const daysInMonth = new Date(state.customizeCalendarYear, state.customizeCalendarMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }

    const configKey = `${state.customizeCalendarYear}-${state.customizeCalendarMonth}`;
    const config = state.configurations[configKey];

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const dateKey = `${state.customizeCalendarYear}-${state.customizeCalendarMonth}-${day}`;
        const hasBookings = state.bookings[dateKey] && state.bookings[dateKey].length > 0;
        const hasCustomConfig = state.customDayConfigurations && state.customDayConfigurations[dateKey];

        if (hasBookings) {
            dayElement.classList.add('disabled');
            dayElement.title = 'Dia com agendamentos - não pode ser personalizado';
        } else if (!config) {
            dayElement.classList.add('disabled');
            dayElement.title = 'Configure o mês primeiro';
        } else {
            if (hasCustomConfig) {
                dayElement.classList.add('partially-booked');
                dayElement.title = 'Dia com configuração personalizada';
            } else {
                dayElement.classList.add('available');
            }
            dayElement.addEventListener('click', () => {
                openCustomizeDayForm(day, dateKey);
            });
        }

        calendar.appendChild(dayElement);
    }
}

function openCustomizeDayForm(day, dateKey) {
    const modal = document.getElementById('customizeDayFormModal');
    const title = document.getElementById('customizeDayFormTitle');
    const periodsContainer = document.getElementById('customDayPeriodsContainer');

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const [year, month, dayNum] = dateKey.split('-').map(Number);
    title.textContent = `Personalizar: ${dayNum} de ${months[month]} de ${year}`;

    // Initialize custom day configurations if it doesn't exist
    if (!state.customDayConfigurations) {
        state.customDayConfigurations = {};
    }

    const configKey = `${year}-${month}`;
    const baseConfig = state.configurations[configKey];
    const customConfig = state.customDayConfigurations[dateKey];

    const periodsToShow = customConfig ? customConfig.periods : baseConfig.periods;

    periodsContainer.innerHTML = '';

    periodsToShow.forEach((period, index) => {
        const periodItem = document.createElement('div');
        periodItem.className = 'period-item';
        periodItem.innerHTML = `
            <input type="text" placeholder="Nome do período" value="${period.name}" class="period-name">
            <input type="time" value="${period.start}" class="period-start">
            <input type="time" value="${period.end}" class="period-end">
            <input type="number" placeholder="Vagas" value="${period.slots || 1}" min="1" class="period-slots">
            <button class="remove-period" ${periodsToShow.length === 1 ? 'disabled' : ''}>×</button>
        `;

        const removeBtn = periodItem.querySelector('.remove-period');
        removeBtn.addEventListener('click', () => {
            periodItem.remove();
            updateCustomRemoveButtons();
        });

        periodsContainer.appendChild(periodItem);
    });

    updateCustomRemoveButtons();

    document.getElementById('addCustomPeriodBtn').onclick = () => {
        const container = document.getElementById('customDayPeriodsContainer');
        const periods = container.querySelectorAll('.period-item');
        
        if (periods.length >= 3) {
            alert('Máximo de 3 períodos por dia');
            return;
        }

        const periodItem = document.createElement('div');
        periodItem.className = 'period-item';
        periodItem.innerHTML = `
            <input type="text" placeholder="Nome do período" class="period-name">
            <input type="time" class="period-start">
            <input type="time" class="period-end">
            <input type="number" placeholder="Vagas" min="1" value="5" class="period-slots">
            <button class="remove-period">×</button>
        `;

        const removeBtn = periodItem.querySelector('.remove-period');
        removeBtn.addEventListener('click', () => {
            periodItem.remove();
            updateCustomRemoveButtons();
        });

        container.appendChild(periodItem);
        updateCustomRemoveButtons();
    };

    document.getElementById('saveCustomDayBtn').onclick = () => {
        saveCustomDayConfiguration(dateKey);
        modal.classList.remove('active');
        renderCustomizeCalendar();
    };

    document.getElementById('removeCustomDayBtn').onclick = () => {
        if (confirm('Deseja remover a configuração personalizada deste dia?')) {
            if (state.customDayConfigurations && state.customDayConfigurations[dateKey]) {
                delete state.customDayConfigurations[dateKey];
                saveState();
                renderCalendar();
            }
            modal.classList.remove('active');
            renderCustomizeCalendar();
        }
    };

    document.getElementById('cancelCustomDayBtn').onclick = () => {
        modal.classList.remove('active');
    };

    modal.classList.add('active');
}

function updateCustomRemoveButtons() {
    const container = document.getElementById('customDayPeriodsContainer');
    const removeButtons = container.querySelectorAll('.remove-period');
    removeButtons.forEach((btn) => {
        btn.disabled = removeButtons.length === 1;
    });
}

function saveCustomDayConfiguration(dateKey) {
    const periodItems = document.querySelectorAll('#customDayPeriodsContainer .period-item');
    const periods = Array.from(periodItems).map(item => ({
        name: item.querySelector('.period-name').value,
        start: item.querySelector('.period-start').value,
        end: item.querySelector('.period-end').value,
        slots: parseInt(item.querySelector('.period-slots').value) || 1,
    })).filter(p => p.name && p.start && p.end);

    if (periods.length === 0) {
        alert('Adicione pelo menos um período');
        return;
    }

    if (!state.customDayConfigurations) {
        state.customDayConfigurations = {};
    }

    state.customDayConfigurations[dateKey] = {
        periods: periods
    };

    saveState();
    renderCalendar();
    alert('Configuração personalizada salva com sucesso!');
}