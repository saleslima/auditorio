// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyA_ibCSwyOXETOpYEiZrLee2WuyuuZ-yDE",
    authDomain: "agenda-auditorio-3a0bf.firebaseapp.com",
    databaseURL: "https://agenda-auditorio-3a0bf-default-rtdb.firebaseio.com",
    projectId: "agenda-auditorio-3a0bf",
    storageBucket: "agenda-auditorio-3a0bf.firebasestorage.app",
    messagingSenderId: "77064715447",
    appId: "1:77064715447:web:1e065dc64b26e95a372132"
};

// Initialize Firebase
let firebaseDB = null;
try {
    console.log('🔥 Inicializando Firebase...');
    firebase.initializeApp(firebaseConfig);
    firebaseDB = firebase.database();
    console.log('✓ Firebase App inicializado');
    console.log('📊 Database URL:', firebaseConfig.databaseURL);
} catch (error) {
    console.error('❌ Falha na inicialização do Firebase:', error);
    console.log('⚠ A aplicação funcionará em modo offline');
    firebaseDB = null;
}

// Application state
const state = {
    currentMode: 'user',
    configurations: {},
    bookings: {},
    blockedDays: {},
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    blockedCalendarMonth: new Date().getMonth(),
    blockedCalendarYear: new Date().getFullYear(),
    isOnline: false,
    syncInProgress: false,
    isInitialized: false,
};

// State management functions
function isFirebaseAvailable() {
    return firebaseDB !== null && firebaseDB !== undefined;
}

function loadFromLocalStorage() {
    try {
        const savedConfig = localStorage.getItem('festasConfig');
        const savedBookings = localStorage.getItem('festasBookings');
        const savedBlockedDays = localStorage.getItem('festasBlockedDays');
        
        if (savedConfig) state.configurations = JSON.parse(savedConfig);
        if (savedBookings) state.bookings = JSON.parse(savedBookings);
        if (savedBlockedDays) state.blockedDays = JSON.parse(savedBlockedDays);
        
        console.log('✓ Dados carregados do localStorage');
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('festasConfig', JSON.stringify(state.configurations));
        localStorage.setItem('festasBookings', JSON.stringify(state.bookings));
        localStorage.setItem('festasBlockedDays', JSON.stringify(state.blockedDays));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

async function loadFromFirebase() {
    if (!isFirebaseAvailable()) {
        console.log('⚠ Firebase não disponível - usando localStorage');
        state.isInitialized = true;
        return;
    }

    try {
        console.log('🔄 Conectando ao Firebase...');
        
        // Load existing data from Firebase
        const configurationsRef = firebaseDB.ref('configurations');
        const bookingsRef = firebaseDB.ref('bookings');
        const blockedDaysRef = firebaseDB.ref('blockedDays');

        const [configurationsSnapshot, bookingsSnapshot, blockedDaysSnapshot] = await Promise.all([
            configurationsRef.once('value'),
            bookingsRef.once('value'),
            blockedDaysRef.once('value')
        ]);

        if (configurationsSnapshot.exists()) {
            state.configurations = configurationsSnapshot.val();
            console.log('✓ Configurações carregadas do Firebase');
        }
        if (bookingsSnapshot.exists()) {
            state.bookings = bookingsSnapshot.val();
            console.log('✓ Agendamentos carregados do Firebase');
        }
        if (blockedDaysSnapshot.exists()) {
            state.blockedDays = blockedDaysSnapshot.val();
            console.log('✓ Dias bloqueados carregados do Firebase');
        }

        saveToLocalStorage();
        
        // Set up real-time listeners
        configurationsRef.on('value', (snapshot) => {
            if (snapshot.exists() && !state.syncInProgress) {
                state.configurations = snapshot.val();
                saveToLocalStorage();
                console.log('🔄 Configurações atualizadas em tempo real');
                renderCalendarIfNeeded();
            }
        });

        bookingsRef.on('value', (snapshot) => {
            if (snapshot.exists() && !state.syncInProgress) {
                state.bookings = snapshot.val();
                saveToLocalStorage();
                console.log('🔄 Agendamentos atualizados em tempo real');
                renderCalendarIfNeeded();
            }
        });

        blockedDaysRef.on('value', (snapshot) => {
            if (snapshot.exists() && !state.syncInProgress) {
                state.blockedDays = snapshot.val();
                saveToLocalStorage();
                console.log('🔄 Dias bloqueados atualizados em tempo real');
                renderCalendarIfNeeded();
            }
        });

        state.isOnline = true;
        state.isInitialized = true;
        console.log('✓ Firebase conectado e sincronizado com sucesso!');
        
        showConnectionStatus(true);
        renderCalendarIfNeeded();
    } catch (error) {
        console.error('❌ Erro ao conectar com Firebase:', error);
        console.log('⚠ Continuando em modo offline');
        state.isOnline = false;
        state.isInitialized = true;
        showConnectionStatus(false);
    }
}

async function saveToFirebase() {
    if (!isFirebaseAvailable()) {
        console.log('⚠ Firebase não disponível - salvando apenas localmente');
        return;
    }

    try {
        state.syncInProgress = true;
        
        await firebaseDB.ref('configurations').set(state.configurations);
        await firebaseDB.ref('bookings').set(state.bookings);
        await firebaseDB.ref('blockedDays').set(state.blockedDays);
        
        state.isOnline = true;
        console.log('✓ Dados sincronizados com Firebase');
        showConnectionStatus(true);
    } catch (error) {
        console.error('❌ Erro ao salvar no Firebase:', error);
        state.isOnline = false;
        showConnectionStatus(false);
    } finally {
        state.syncInProgress = false;
    }
}

function showConnectionStatus(online) {
    let indicator = document.getElementById('connectionIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connectionIndicator';
        indicator.className = 'connection-status';
        document.body.appendChild(indicator);
    }
    
    if (online) {
        indicator.className = 'connection-status online';
        indicator.innerHTML = '● Online - Conectado ao Firebase';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    } else {
        indicator.className = 'connection-status offline';
        indicator.innerHTML = '● Offline - Dados salvos localmente';
        indicator.style.display = 'flex';
    }
}

function saveState() {
    saveToLocalStorage();
    console.log('💾 Salvando dados...');
    if (state.isInitialized) {
        saveToFirebase().catch(err => {
            console.warn('⚠ Sincronização com Firebase falhou, dados salvos localmente:', err);
        });
    }
}

function loadState() {
    console.log('📂 Carregando dados...');
    loadFromLocalStorage();
    
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkFirebase = setInterval(() => {
        attempts++;
        
        if (firebaseDB !== undefined && firebaseDB !== null) {
            console.log('✓ Firebase detectado');
            clearInterval(checkFirebase);
            loadFromFirebase();
        } else if (attempts >= maxAttempts) {
            console.log('⏱ Timeout na inicialização do Firebase');
            clearInterval(checkFirebase);
            state.isInitialized = true;
            console.log('⚠ Funcionando em modo offline');
            showConnectionStatus(false);
        }
    }, 100);
}

// Calendar rendering
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const title = document.getElementById('calendarTitle');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    title.textContent = `${months[state.currentMonth]} ${state.currentYear}`;

    const key = `${state.currentYear}-${state.currentMonth}`;
    const config = state.configurations[key];

    calendar.innerHTML = '';

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach(name => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day empty';
        dayHeader.style.fontWeight = '600';
        dayHeader.textContent = name;
        calendar.appendChild(dayHeader);
    });

    const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
    const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
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

            if (!config || !config.availableDays.includes(dayOfWeek)) {
                dayElement.classList.add('disabled');
            } else {
                const dayBookings = state.bookings[dateKey] || [];
                const activeBookings = dayBookings.filter(b => !b.cancellation);
                const totalPeriods = config.periods.length;
                const bookedPeriods = activeBookings.length;

                if (bookedPeriods === 0) {
                    dayElement.classList.add('available');
                } else if (bookedPeriods < totalPeriods) {
                    dayElement.classList.add('partially-booked');
                } else {
                    dayElement.classList.add('fully-booked');
                }

                dayElement.addEventListener('dblclick', () => {
                    openBookingModal(day);
                });
            }
        }

        calendar.appendChild(dayElement);
    }
}

function renderCalendarIfNeeded() {
    if (state.currentMode === 'user') {
        renderCalendar();
    }
}

// Blocked days management
function renderBlockedCalendar() {
    const calendar = document.getElementById('blockedCalendar');
    const title = document.getElementById('blockedCalendarTitle');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    title.textContent = `${months[state.blockedCalendarMonth]} ${state.blockedCalendarYear}`;

    calendar.innerHTML = '';

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    dayNames.forEach(name => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day empty';
        dayHeader.style.fontWeight = '600';
        dayHeader.textContent = name;
        calendar.appendChild(dayHeader);
    });

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

function toggleBlockedDay(dateKey) {
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

function showBlockedDaysModal() {
    const modal = document.getElementById('blockedDaysModal');
    state.blockedCalendarMonth = state.currentMonth;
    state.blockedCalendarYear = state.currentYear;
    renderBlockedCalendar();
    modal.classList.add('active');
}

// Booking functionality
function openBookingModal(day) {
    const modal = document.getElementById('bookingModal');
    const title = document.getElementById('modalTitle');
    const periodsList = document.getElementById('periodsAvailable');

    const key = `${state.currentYear}-${state.currentMonth}`;
    const config = state.configurations[key];

    if (!config) return;

    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    title.textContent = `${day} de ${months[state.currentMonth]} de ${state.currentYear}`;

    const dateKey = `${state.currentYear}-${state.currentMonth}-${day}`;
    const dayBookings = state.bookings[dateKey] || [];

    periodsList.innerHTML = '';

    config.periods.forEach((period, index) => {
        const booking = dayBookings.find(b => b.periodIndex === index);
        const isBooked = booking && !booking.cancellation;
        const periodCard = document.createElement('div');
        periodCard.className = `period-card ${isBooked ? 'booked' : ''}`;
        periodCard.innerHTML = `
            <h3>${period.name}</h3>
            <p>${period.start} - ${period.end}</p>
        `;

        if (!isBooked) {
            periodCard.addEventListener('click', () => {
                showBookingForm(dateKey, index, period, day);
            });
        }

        periodsList.appendChild(periodCard);
    });

    modal.classList.add('active');
}

function showBookingForm(dateKey, periodIndex, period, day) {
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
            
            <label for="bookingName">Nome:</label>
            <input 
                type="text" 
                id="bookingName" 
                placeholder="Seu nome completo"
                required
                style="text-transform: uppercase;"
            />
            
            <label for="bookingEntity">Entidade:</label>
            <input 
                type="text" 
                id="bookingEntity" 
                placeholder="Empresa ou organização"
                required
                style="text-transform: uppercase;"
            />
            
            <label for="bookingPhone">Telefone de contato:</label>
            <input 
                type="tel" 
                id="bookingPhone" 
                placeholder="(00) 00000-0000"
                required
            />
            
            <label for="bookingDetails">Descrição:</label>
            <textarea 
                id="bookingDetails" 
                placeholder="Descreva o evento (mínimo 10 caracteres)"
                minlength="10"
                maxlength="50"
                style="text-transform: uppercase;"
            ></textarea>
            <div class="char-counter">
                <span id="charCount">0</span> / 50 caracteres
            </div>
            <div class="booking-actions">
                <button class="btn-secondary" id="cancelBooking">Cancelar</button>
                <button class="btn-primary" id="confirmBooking">Confirmar Reserva</button>
            </div>
        </div>
    `;

    const nameInput = document.getElementById('bookingName');
    const entityInput = document.getElementById('bookingEntity');
    const phoneInput = document.getElementById('bookingPhone');
    const textarea = document.getElementById('bookingDetails');
    const charCount = document.getElementById('charCount');
    const confirmBtn = document.getElementById('confirmBooking');
    const cancelBtn = document.getElementById('cancelBooking');

    const validateForm = () => {
        const name = nameInput.value.trim();
        const entity = entityInput.value.trim();
        const phone = phoneInput.value.trim();
        const details = textarea.value.trim();
        
        confirmBtn.disabled = !(
            name.length > 0 && 
            entity.length > 0 && 
            phone.length > 0 && 
            details.length >= 10 && 
            details.length <= 50
        );
    };

    nameInput.addEventListener('input', () => {
        nameInput.value = nameInput.value.toUpperCase();
        validateForm();
    });
    
    entityInput.addEventListener('input', () => {
        entityInput.value = entityInput.value.toUpperCase();
        validateForm();
    });
    
    phoneInput.addEventListener('input', validateForm);
    
    textarea.addEventListener('input', () => {
        textarea.value = textarea.value.toUpperCase();
        const length = textarea.value.length;
        charCount.textContent = length;
        validateForm();
    });

    confirmBtn.disabled = true;

    confirmBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const entity = entityInput.value.trim();
        const phone = phoneInput.value.trim();
        const details = textarea.value.trim();
        
        if (name && entity && phone && details.length >= 10 && details.length <= 50) {
            bookPeriod(dateKey, periodIndex, { name, entity, phone, details });
            const dayNumber = parseInt(dateKey.split('-')[2]);
            openBookingModal(dayNumber);
        }
    });

    cancelBtn.addEventListener('click', () => {
        const dayNumber = parseInt(dateKey.split('-')[2]);
        openBookingModal(dayNumber);
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
    renderCalendar();
}

// Report functionality
function showReport() {
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
            const [year, month, day] = dateKey.split('-').map(Number);
            const config = state.configurations[`${year}-${month}`];
            
            html += `<div class="report-date-group">
                <h3>${day} de ${months[month]} de ${year}</h3>
                <div class="report-bookings">`;
            
            bookings.forEach((booking, bookingIndex) => {
                const period = config?.periods[booking.periodIndex];
                const periodName = period ? period.name : 'Período desconhecido';
                const periodTime = period ? `${period.start} - ${period.end}` : '';
                
                html += `
                    <div class="report-booking-card">
                        <div class="report-booking-header">
                            <strong>${periodName}</strong>
                            <span class="report-booking-time">${periodTime}</span>
                        </div>
                        <div class="report-booking-details">
                            <p><strong>Nome:</strong> ${booking.name}</p>
                            <p><strong>Entidade:</strong> ${booking.entity}</p>
                            <p><strong>Telefone:</strong> ${booking.phone}</p>
                            <p><strong>Descrição:</strong> ${booking.details}</p>
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
            });
            
            html += `</div></div>`;
        });
    }
    
    reportContent.innerHTML = html;
    
    reportContent.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dateKey = e.target.dataset.date;
            const bookingIndex = parseInt(e.target.dataset.index);
            showCancellationModal(dateKey, bookingIndex);
        });
    });
    
    reportModal.classList.add('active');
}

function showCancellationModal(dateKey, bookingIndex) {
    const modal = document.getElementById('cancellationModal');
    modal.dataset.dateKey = dateKey;
    modal.dataset.bookingIndex = bookingIndex;
    modal.classList.add('active');
    
    document.getElementById('cancelPassword').value = '';
    document.getElementById('cancelReason').value = '';
    document.getElementById('cancelRequestedBy').value = '';
    document.getElementById('confirmCancelBtn').disabled = true;
}

// Admin panel
function initializeAdminPanel() {
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
    document.getElementById('reportBtn').addEventListener('click', showReport);
    document.getElementById('manageBlockedDaysBtn').addEventListener('click', showBlockedDaysModal);
    document.getElementById('resetMonthBtn').addEventListener('click', resetMonth);

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
    
    const confirmMsg = `Tem certeza que deseja RESETAR todos os dados de ${months[month]} ${year}?\n\nIsto irá apagar:\n- Configurações do mês\n- Todos os agendamentos\n- Dias bloqueados\n\nEsta ação não pode ser desfeita!`;
    
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

// User panel
function initializeUserPanel() {
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

// Mode toggle
function initializeModeToggle() {
    const adminBtn = document.getElementById('adminModeBtn');
    const userBtn = document.getElementById('userModeBtn');
    const adminPanel = document.getElementById('adminPanel');
    const userPanel = document.getElementById('userPanel');

    adminBtn.addEventListener('click', () => {
        const password = prompt('Digite a senha de administrador:');
        if (password !== 'daqta') {
            alert('Senha incorreta!');
            return;
        }
        
        state.currentMode = 'admin';
        adminBtn.classList.add('active');
        userBtn.classList.remove('active');
        adminPanel.classList.add('active');
        userPanel.classList.remove('active');
    });

    userBtn.addEventListener('click', () => {
        state.currentMode = 'user';
        userBtn.classList.add('active');
        adminBtn.classList.remove('active');
        userPanel.classList.add('active');
        adminPanel.classList.remove('active');
        renderCalendar();
    });
}

// Modals initialization
function initializeModals() {
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
    
    initializeCancellationModal();
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
            showReport();
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

// Monitor online/offline status
window.addEventListener('online', () => {
    console.log('🌐 Conexão restaurada');
    showConnectionStatus(true);
    if (state.isInitialized) {
        saveToFirebase();
    }
});

window.addEventListener('offline', () => {
    console.log('📵 Conexão perdida - trabalhando offline');
    state.isOnline = false;
    showConnectionStatus(false);
});

// Initialize application
function initApp() {
    initializeModeToggle();
    initializeAdminPanel();
    initializeUserPanel();
    initializeModals();
    
    const checkInitialized = setInterval(() => {
        if (state.isInitialized) {
            clearInterval(checkInitialized);
            renderCalendar();
            
            if (state.isOnline) {
                console.log('✓ Conectado ao banco de dados Firebase');
            } else {
                console.log('⚠ Modo offline - os dados serão salvos localmente');
            }
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkInitialized);
        if (!state.isInitialized) {
            console.log('⚠ Timeout na inicialização - usando dados locais');
            renderCalendar();
        }
    }, 6000);
}

// Load initial state
loadState();

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}