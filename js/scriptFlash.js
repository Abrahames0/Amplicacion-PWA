document.addEventListener("DOMContentLoaded", async () => {
  // Variables globales
  let db; // Base de datos IndexedDB
  const tablaBody = document.getElementById("tabla-body");

  // Verificar si el navegador soporta la autenticación biométrica
  async function autenticarBiometricamente() {
    if ('credentials' in navigator) {
      try {
        const credential = await navigator.credentials.get({ password: false, biometric: true });
        if (credential) {
          console.log('Autenticación biométrica exitosa');
          return true;
        } else {
          console.error('Autenticación fallida');
          return false;
        }
      } catch (error) {
        console.error('Error en la autenticación biométrica:', error);
        return false;
      }
    } else {
      console.error('La autenticación biométrica no es soportada en este dispositivo');
      return false;
    }
  }

  // Inicializar IndexedDB
  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FrasesDB", 1);

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

  // Cargar frases desde IndexedDB
  function cargarDesdeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FrasesDB", 1);
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
  function eliminarFrase(id) {
    const transaction = db.transaction(["frases"], "readwrite");
    const store = transaction.objectStore("frases");
    store.delete(id);

    transaction.oncomplete = function() {
      console.log("Frase eliminada correctamente");
      cargarYActualizarTabla();
    };

    transaction.onerror = function(event) {
      console.error("Error al eliminar la frase:", event.target.error);
    };
  }

  // Función para actualizar frase
  function actualizarFrase(id, nuevaFrase, nuevoCodigoMorse) {
    const transaction = db.transaction(["frases"], "readwrite");
    const store = transaction.objectStore("frases");
    const request = store.get(id);

    request.onsuccess = function(event) {
      const frase = event.target.result;
      if (frase) {
        frase.frase = nuevaFrase;
        frase.codigoMorse = nuevoCodigoMorse;
        store.put(frase);

        transaction.oncomplete = function() {
          console.log("Frase actualizada correctamente");
          cargarYActualizarTabla();
        };
      }
    };

    request.onerror = function(event) {
      console.error("Error al obtener la frase:", event.target.error);
    };
  }

  function actualizarTabla(frases) {
    tablaBody.innerHTML = ""; // Limpia la tabla
    frases.forEach((item, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
          <th scope="row">${item.id}</th>
          <td>${item.frase}</td>
          <td>${item.codigoMorse}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="mostrarFormularioActualizar(${item.id}, '${item.frase}', '${item.codigoMorse}')">Actualizar</button>
            <button class="btn btn-danger btn-sm" onclick="eliminarFrase(${item.id})">Eliminar</button>
          </td>
        `;
      tablaBody.appendChild(fila);
    });
  }

  // Cargar y actualizar la tabla después de la autenticación
  async function cargarYActualizarTabla() {
    const frases = await cargarDesdeIndexedDB();
    actualizarTabla(frases);
  }

  // Mostrar el formulario para actualizar frase
  function mostrarFormularioActualizar(id, frase, codigoMorse) {
    const nuevaFrase = prompt("Actualiza la frase:", frase);
    const nuevoCodigoMorse = prompt("Actualiza el código Morse:", codigoMorse);

    if (nuevaFrase !== null && nuevoCodigoMorse !== null) {
      actualizarFrase(id, nuevaFrase, nuevoCodigoMorse);
    }
  }

  // Función principal para verificar la autenticación biométrica y cargar los datos
  async function main() {
    const autentico = await autenticarBiometricamente();
    if (autentico) {
      await initIndexedDB();
      cargarYActualizarTabla();
    } else {
      console.log("Autenticación fallida. No se puede acceder a los datos.");
    }
  }

  main();
});
