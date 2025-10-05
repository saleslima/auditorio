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

try {
    console.log('🔥 Inicializando Firebase...');
    firebase.initializeApp(firebaseConfig);
    firebaseDB = firebase.database();
    console.log('✓ Firebase App inicializado');
    console.log('📊 Database URL:', firebaseConfig.databaseURL);
} catch (error) {
    console.error('❌ Falha na inicialização do Firebase:', error);
    alert('❌ ERRO CRÍTICO: Não foi possível conectar ao Firebase. A aplicação não pode funcionar sem conexão com o banco de dados.');
    firebaseDB = null;
}

export function isFirebaseAvailable() {
    return firebaseDB !== null && firebaseDB !== undefined;
}

export function getFirebaseDB() {
    return firebaseDB;
}

export { firebaseDB };