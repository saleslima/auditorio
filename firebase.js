// Firebase configuration and initialization module

const firebaseConfig = {
    apiKey: "AIzaSyA_ibCSwyOXETOpYEiZrLee2WuyuuZ-yDE",
    authDomain: "agenda-auditorio-3a0bf.firebaseapp.com",
    databaseURL: "https://agenda-auditorio-3a0bf-default-rtdb.firebaseio.com",
    projectId: "agenda-auditorio-3a0bf",
    storageBucket: "agenda-auditorio-3a0bf.firebasestorage.app",
    messagingSenderId: "77064715447",
    appId: "1:77064715447:web:1e065dc64b26e95a372132"
};

let firebaseDB = null;
let firebaseInitPromise = null;

// Create initialization promise
firebaseInitPromise = new Promise((resolve, reject) => {
    try {
        // Wait for Firebase to be available
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined') {
                clearInterval(checkFirebase);
                try {
                    console.log('🔥 Inicializando Firebase...');
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    firebaseDB = firebase.database();
                    console.log('✓ Firebase App inicializado');
                    console.log('📊 Database URL:', firebaseConfig.databaseURL);
                    resolve(firebaseDB);
                } catch (error) {
                    console.error('❌ Falha na inicialização do Firebase:', error);
                    reject(error);
                }
            }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkFirebase);
            if (!firebaseDB) {
                reject(new Error('Firebase initialization timeout'));
            }
        }, 10000);
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        reject(error);
    }
});

export async function waitForFirebase() {
    try {
        await firebaseInitPromise;
        return true;
    } catch (error) {
        console.error('❌ Firebase não disponível:', error);
        return false;
    }
}

export function isFirebaseAvailable() {
    return firebaseDB !== null && firebaseDB !== undefined;
}

export function getFirebaseDB() {
    return firebaseDB;
}

export { firebaseDB, firebaseInitPromise };