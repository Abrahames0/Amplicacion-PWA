document.addEventListener("DOMContentLoaded", async () => {
  let db; // Base de datos IndexedDB
  const formulario = document.getElementById("formulario");
  const fraseInput = document.getElementById("Frase");
  const tablaBody = document.querySelector("table tbody");
  const gifImagen = document.getElementById("gifImagen");
  const cameraButton = document.getElementById("cameraButton");
  const photoPreview = document.getElementById("photoPreview");

  let photoData = null; // Almacenar la imagen tomada

  // Validar si IndexedDB está disponible
  if (!window.indexedDB) {
    alert("Tu navegador no soporta IndexedDB. Algunas funcionalidades pueden no estar disponibles.");
    return;
  }

  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FrasesDB", 2);
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("frases")) {
          db.createObjectStore("frases", { keyPath: "id", autoIncrement: true });
        }
      };
  
      request.onsuccess = (event) => {
        db = event.target.result;
        resolve();
      };
  
      request.onerror = (event) => {
        console.error("Error al inicializar IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
  }  

  // Guardar frase e imagen en IndexedDB
  function guardarEnIndexedDB(frase, foto) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("frases", "readwrite");
      const store = transaction.objectStore("frases");

      const data = { frase, foto };
      const request = store.add(data);

      request.onsuccess = () => {
        resolve(data);
        gifImagen.style.display = "block"; // Mostrar el gif de guardado
        setTimeout(() => {
          gifImagen.style.display = "none"; // Ocultar el gif después de 3 segundos
        }, 3000);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Función para capturar una foto
  function capturarFoto() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        const videoElement = document.createElement("video");
        videoElement.srcObject = stream;
        videoElement.play();

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        document.body.appendChild(videoElement); // Agregar video a la página

        // Hacer una foto después de 3 segundos
        setTimeout(() => {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const foto = canvas.toDataURL("image/png"); // Convertir la imagen a base64
          photoData = foto; // Almacenar la foto

          // Mostrar la foto en la página
          photoPreview.src = foto;
          photoPreview.style.display = "block";
          videoElement.srcObject.getTracks().forEach(track => track.stop()); // Detener el stream
          videoElement.remove(); // Remover el video
        }, 3000);
      })
      .catch((error) => {
        console.error("Error al acceder a la cámara:", error);
      });
  }

  // Manejar el evento de envío del formulario
  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const frase = fraseInput.value.trim();
    if (!frase) {
      alert("Por favor, introduce una frase.");
      return;
    }

    if (!photoData) {
      alert("Por favor, captura una foto.");
      return;
    }

    // Guardar en IndexedDB y sincronizar
    try {
      const data = await guardarEnIndexedDB(frase, photoData);
      actualizarTabla();
      fraseInput.value = "";
      photoPreview.style.display = "none"; // Ocultar la imagen después de guardar
    } catch (error) {
      console.error("Error al guardar la frase:", error);
    }
  });

  // Actualizar la tabla con las frases e imágenes
  function actualizarTabla() {
    tablaBody.innerHTML = "";
    const transaction = db.transaction("frases", "readonly");
    const store = transaction.objectStore("frases");
    const request = store.getAll();

    request.onsuccess = (event) => {
      const frases = event.target.result;
      frases.forEach((item, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <th scope="row">${index + 1}</th>
          <td>${item.frase}</td>
          <td><img src="${item.foto}" alt="Foto" width="50" height="50" /></td>
        `;
        tablaBody.appendChild(fila);
      });
    };

    request.onerror = (event) => {
      console.error("Error al obtener las frases de IndexedDB:", event.target.error);
    };
  }

  // Inicializar la aplicación
  await initIndexedDB();

  // Capturar foto al hacer clic en el botón
  cameraButton.addEventListener("click", capturarFoto);
});
