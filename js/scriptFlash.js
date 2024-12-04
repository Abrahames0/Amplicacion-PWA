document.addEventListener("DOMContentLoaded", async () => {
  let db; // Base de datos IndexedDB
  const tablaBody = document.getElementById("tabla-body");

  // Inicializar IndexedDB
  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FrasesDB", 2); // Cambiar la versión a 2

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        console.error("Error al inicializar IndexedDB:", event.target.error);
        reject(event.target.error);
      };

      // Manejo de la actualización del esquema de la base de datos
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log("Actualizando base de datos...");
        if (!db.objectStoreNames.contains("frases")) {
          const store = db.createObjectStore("frases", { keyPath: "id", autoIncrement: true });
          store.createIndex("fraseIndex", "frase", { unique: false });
          store.createIndex("imagenIndex", "imagen", { unique: false });
          console.log("Store 'frases' creado correctamente.");
        }
      };
    });
  }

  // Cargar frases desde IndexedDB
  function cargarDesdeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FrasesDB", 2); // Cambiar la versión a 2
      request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(["frases"], "readonly");
        const store = transaction.objectStore("frases");

        const allRecords = store.getAll(); // Obtener todos los registros

        allRecords.onsuccess = function() {
          resolve(allRecords.result); // Devuelve los datos
        };

        allRecords.onerror = function(event) {
          reject("Error al cargar los datos: " + event.target.error);
        };
      };

      request.onerror = function(event) {
        reject("Error al abrir la base de datos: " + event.target.error);
      };
    });
  }

  // Función para eliminar frase
  window.eliminarFrase = function(id) { // Se agrega a window para hacerlo global
    const transaction = db.transaction(["frases"], "readwrite");
    const store = transaction.objectStore("frases");
    store.delete(id);

    transaction.oncomplete = function() {
      console.log("Frase eliminada correctamente");
      cargarYActualizarTabla(); // Recargar la tabla después de eliminar
    };

    transaction.onerror = function(event) {
      console.error("Error al eliminar la frase:", event.target.error);
    };
  }

  // Actualizar la tabla con las frases y sus imágenes
  function actualizarTabla(frases) {
    tablaBody.innerHTML = ""; // Limpia la tabla
    frases.forEach((item) => {
      const fila = document.createElement("tr");
      fila.innerHTML = ` 
        <th scope="row">${item.id}</th>
        <td>${item.frase}</td>
        <td><img src="${item.foto}" alt="Foto" width="50" height="50" /></td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="eliminarFrase(${item.id})">Eliminar</button>
        </td>
      `;
      tablaBody.appendChild(fila);
    });
  }

  async function cargarYActualizarTabla() {
    const frases = await cargarDesdeIndexedDB();
    actualizarTabla(frases); // Actualizar la tabla con las frases cargadas
  }

  // Inicializamos la base de datos y cargamos las frases al iniciar
  await initIndexedDB();
  cargarYActualizarTabla();
});
