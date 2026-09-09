// Ocultar pantalla de carga al finalizar la lectura de la página
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }, 500);
});

// Evento para el botón de cerrar sesión
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            window.location.href = 'index.html';
        }
    });
}
