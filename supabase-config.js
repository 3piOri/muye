window.supabaseConfig = {
    url: "https://qzqbkutvkkbnzidnsrku.supabase.co", // Corregido con 'g'
    anonKey: "sb_publishable_KJKIfqMVIwSM1IXGnrIZLw_6-3CP6bA"
};

// Crear la instancia global que admin.js está buscando
const { createClient } = window.supabase;
window.supabaseClient = createClient(
    window.supabaseConfig.url, 
    window.supabaseConfig.anonKey
);
