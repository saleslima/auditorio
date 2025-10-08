// Main application entry point
import { state, loadState } from './state.js';
import { renderCalendar, initializeUserPanel } from './calendar.js';
import { openBookingModal, showReport } from './booking.js';
import { initializeAdminPanel } from './admin.js';
import { initializeModals, showCancellationModal } from './modals.js';

function initializeModeToggle() {
    const adminBtn = document.getElementById('adminModeBtn');
    const userBtn = document.getElementById('userModeBtn');
    const adminPanel = document.getElementById('adminPanel');
    const userPanel = document.getElementById('userPanel');
    const themeModeBtn = document.getElementById('themeModeBtn');

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Theme toggle
    themeModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
    });

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

function initApp() {
    initializeModeToggle();
    initializeAdminPanel();
    initializeUserPanel();
    initializeModals();
    
    // Set up custom event listeners
    window.addEventListener('stateUpdated', () => {
        if (state.currentMode === 'user') {
            renderCalendar();
        }
    });

    window.addEventListener('openBookingModal', (e) => {
        openBookingModal(e.detail.day);
    });

    window.addEventListener('showReport', () => {
        showReport();
    });

    window.addEventListener('showCancellationModal', (e) => {
        showCancellationModal(e.detail.dateKey, e.detail.bookingIndex);
    });
    
    const checkInitialized = setInterval(() => {
        if (state.isInitialized) {
            clearInterval(checkInitialized);
            renderCalendar();
            
            if (state.isOnline) {
                console.log('✓ Conectado ao banco de dados Firebase');
            } else {
                console.log('❌ Sem conexão com Firebase');
            }
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(checkInitialized);
        if (!state.isInitialized) {
            console.error('⚠ Timeout na inicialização');
            alert('❌ ERRO: Tempo limite excedido ao tentar conectar ao Firebase.');
            renderCalendar();
        }
    }, 6000);
}

// Monitor online/offline status
window.addEventListener('online', async () => {
    console.log('🌐 Conexão restaurada');
    if (state.isInitialized) {
        const { loadFromFirebase } = await import('./state.js');
        loadFromFirebase();
    }
});

window.addEventListener('offline', () => {
    console.log('📵 Conexão perdida');
    state.isOnline = false;
    alert('⚠️ AVISO: Conexão com a internet perdida. Não será possível salvar ou receber atualizações até reconectar.');
});

// Load initial state
loadState();

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}