const form = document.getElementById('myform');
const messageInput = document.querySelector('#message');
const feedbackContainer = document.createElement('div');
document.body.appendChild(feedbackContainer);

if ("Notification" in window) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = messageInput.value.trim();

        if (!message) {
            showFeedback('El mensaje no puede estar vacío.', 'error');
            return;
        }

        if (Notification.permission === 'granted') {
            sendNotification('Mensaje enviado con éxito');
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                sendNotification('Mensaje enviado con éxito');
            } else {
                showFeedback('El permiso para recibir notificaciones no fue otorgado.', 'error');
            }
        }

        try {
            const response = await fetch('https://backend-pwa-3o91.onrender.com/new-message', {
                method: 'POST',
                body: JSON.stringify({ message }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                showFeedback('Mensaje enviado con éxito.', 'success');
                form.reset();
            } else {
                const error = await response.json();
                showFeedback(`Error: ${error.message || 'No se pudo enviar el mensaje.'}`, 'error');
            }
        } catch (error) {
            showFeedback('Error al conectar con el servidor.', 'error');
            console.error('Error en la solicitud:', error);
        }
    });
}

function sendNotification(message) {
    new Notification(message);
}

function showFeedback(message, type) {
    feedbackContainer.textContent = message;
    feedbackContainer.style.color = type === 'success' ? 'green' : 'red';
    feedbackContainer.style.fontWeight = 'bold';
    feedbackContainer.style.textAlign = 'center';

    setTimeout(() => {
        feedbackContainer.textContent = '';
    }, 3000);
}