// Ocultar pantalla de carga al terminar de cargar la página principal
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }, 400);
});

// Lógica del Botón "Entrar al Sistema"
const btnEntrar = document.getElementById('btnEntrar');

if (btnEntrar) {
    btnEntrar.addEventListener('click', () => {
        // Mostrar nuevamente la pantalla de carga para una transición suave
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            const textElement = overlay.querySelector('p');
            if (textElement) {
                textElement.textContent = 'Accediendo al sistema...';
            }
        }

        // Redirigir al menú principal después de un breve efecto visual (ej. 600ms)
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 600);
    });
}