// Application state management module
import { firebaseDB, isFirebaseAvailable, waitForFirebase } from './firebase.js';

export const state = {
    currentMode: 'user',
    configurations: {},
    bookings: {},
    blockedDays: {},
    customDayConfigurations: {},
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    blockedCalendarMonth: new Date().getMonth(),
    blockedCalendarYear: new Date().getFullYear(),
    customizeCalendarMonth: new Date().getMonth(),
    customizeCalendarYear: new Date().getFullYear(),
    isOnline: false,
    syncInProgress: false,
    isInitialized: false,
};

export function loadFromLocalStorage() {
    try {
        const savedConfig = localStorage.getItem('festasConfig');
        const savedBookings = localStorage.getItem('festasBookings');
        const savedBlockedDays = localStorage.getItem('festasBlockedDays');
        const savedCustomDayConfigurations = localStorage.getItem('festasCustomDayConfigurations');

        if (savedConfig) state.configurations = JSON.parse(savedConfig);
        if (savedBookings) state.bookings = JSON.parse(savedBookings);
        if (savedBlockedDays) state.blockedDays = JSON.parse(savedBlockedDays);
        if (savedCustomDayConfigurations) state.customDayConfigurations = JSON.parse(savedCustomDayConfigurations);

        console.log('✓ Dados carregados do localStorage');
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

export function saveToLocalStorage() {
    try {
        localStorage.setItem('festasConfig', JSON.stringify(state.configurations));
        localStorage.setItem('festasBookings', JSON.stringify(state.bookings));
        localStorage.setItem('festasBlockedDays', JSON.stringify(state.blockedDays));
        localStorage.setItem('festasCustomDayConfigurations', JSON.stringify(state.customDayConfigurations));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

export async function loadFromFirebase() {
    // Wait for Firebase to be ready
    const isReady = await waitForFirebase();
    
    if (!isReady || !isFirebaseAvailable()) {
        console.error('❌ Firebase não está disponível');
        alert('❌ ERRO: Não foi possível conectar ao Firebase. Recarregue a página.');
        state.isInitialized = true;
        return;
    }

    try {
        console.log('🔄 Conectando ao Firebase...');

        const db = firebaseDB;
        const configurationsRef = db.ref('configurations');
        const bookingsRef = db.ref('bookings');
        const blockedDaysRef = db.ref('blockedDays');
        const customDayConfigurationsRef = db.ref('customDayConfigurations');

        const [configurationsSnapshot, bookingsSnapshot, blockedDaysSnapshot, customDayConfigurationsSnapshot] = await Promise.all([
            configurationsRef.once('value'),
            bookingsRef.once('value'),
            blockedDaysRef.once('value'),
            customDayConfigurationsRef.once('value')
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
        if (customDayConfigurationsSnapshot.exists()) {
            state.customDayConfigurations = customDayConfigurationsSnapshot.val();
            console.log('✓ Configurações personalizadas carregadas do Firebase');
        }

        setupRealtimeListeners(configurationsRef, bookingsRef, blockedDaysRef, customDayConfigurationsRef);

        state.isOnline = true;
        state.isInitialized = true;
        console.log('✓ Firebase conectado e sincronizado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao conectar com Firebase:', error);
        alert('❌ ERRO: Não foi possível sincronizar com o Firebase. Verifique sua conexão e recarregue a página.');
        state.isOnline = false;
        state.isInitialized = true;
    }
}

function setupRealtimeListeners(configurationsRef, bookingsRef, blockedDaysRef, customDayConfigurationsRef) {
    configurationsRef.on('value', (snapshot) => {
        if (snapshot.exists() && !state.syncInProgress) {
            state.configurations = snapshot.val();
            console.log('🔄 Configurações atualizadas em tempo real');
            window.dispatchEvent(new CustomEvent('stateUpdated'));
        }
    });

    bookingsRef.on('value', (snapshot) => {
        if (snapshot.exists() && !state.syncInProgress) {
            state.bookings = snapshot.val();
            console.log('🔄 Agendamentos atualizados em tempo real');
            window.dispatchEvent(new CustomEvent('stateUpdated'));
        }
    });

    blockedDaysRef.on('value', (snapshot) => {
        if (snapshot.exists() && !state.syncInProgress) {
            state.blockedDays = snapshot.val();
            console.log('🔄 Dias bloqueados atualizados em tempo real');
            window.dispatchEvent(new CustomEvent('stateUpdated'));
        }
    });

    customDayConfigurationsRef.on('value', (snapshot) => {
        if (snapshot.exists() && !state.syncInProgress) {
            state.customDayConfigurations = snapshot.val();
            console.log('🔄 Configurações personalizadas atualizadas em tempo real');
            window.dispatchEvent(new CustomEvent('stateUpdated'));
        }
    });
}

export async function saveToFirebase() {
    // Wait for Firebase to be ready
    const isReady = await waitForFirebase();
    
    if (!isReady || !isFirebaseAvailable()) {
        console.error('❌ Firebase não disponível');
        alert('❌ ERRO: Não é possível salvar. Sem conexão com Firebase.');
        return;
    }

    try {
        state.syncInProgress = true;

        const db = firebaseDB;
        await db.ref('configurations').set(state.configurations);
        await db.ref('bookings').set(state.bookings);
        await db.ref('blockedDays').set(state.blockedDays);
        await db.ref('customDayConfigurations').set(state.customDayConfigurations);

        state.isOnline = true;
        console.log('✓ Dados sincronizados com Firebase');
    } catch (error) {
        console.error('❌ Erro ao salvar no Firebase:', error);
        alert('❌ ERRO: Não foi possível salvar os dados. Verifique sua conexão.');
        state.isOnline = false;
    } finally {
        state.syncInProgress = false;
    }
}

export function saveState() {
    console.log('💾 Salvando dados no Firebase...');
    if (state.isInitialized) {
        saveToFirebase().catch(err => {
            console.error('❌ Falha ao salvar no Firebase:', err);
            alert('❌ ERRO: Não foi possível salvar. Verifique sua conexão com a internet.');
        });
    }
}

export async function loadState() {
    console.log('📂 Carregando dados do Firebase...');
    
    // Wait for Firebase to be ready before loading
    await loadFromFirebase();
}