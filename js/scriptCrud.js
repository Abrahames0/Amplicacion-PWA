// Abrir la base de datos con una versión específica
const request = indexedDB.open("FrasesDB", 1); // Si cambia el esquema, incrementa la versión

// Crear el object store si es necesario
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  if (!db.objectStoreNames.contains("frases")) {
    const store = db.createObjectStore("frases", { keyPath: "id", autoIncrement: true });
    store.createIndex("frase", "frase", { unique: false });
    store.createIndex("codigoMorse", "codigoMorse", { unique: false });
  }
};

// Cuando la base de datos está lista
request.onsuccess = function(event) {
  const db = event.target.result;

  // Aquí puedes realizar las transacciones o operaciones que desees
  console.log("Base de datos abierta correctamente.");
};

// En caso de error
request.onerror = function(event) {
  console.error("Error al abrir la base de datos:", event.target.error);
};

// Función para guardar datos en la base de datos
function guardarEnIndexedDB(frase, codigoMorse) {
  const transaction = db.transaction(["frases"], "readwrite");
  const store = transaction.objectStore("frases");
  store.add({ frase, codigoMorse });

  transaction.oncomplete = function() {
    console.log("Frase guardada correctamente.");
  };

  transaction.onerror = function(event) {
    console.error("Error al guardar la frase:", event.target.error);
  };
}


document.addEventListener("DOMContentLoaded", async () => {
    // Mapeo de caracteres a código Morse
    const morseCodeMap = {
      A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
      G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
      M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
      S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
      Y: "-.--", Z: "--..", 1: ".----", 2: "..---", 3: "...--",
      4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..",
      9: "----.", 0: "-----", " ": "/"
    };
  
    // Variables globales
    let db; // Base de datos IndexedDB
    const frases = []; // Array local para sincronizar con IndexedDB
    const formulario = document.getElementById("formulario");
    const fraseInput = document.getElementById("Frase");
    const tablaBody = document.querySelector("table tbody");
    const gifImagen = document.getElementById("gifImagen");
  
    // Inicializar IndexedDB
  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FrasesDB", 1);

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

  
    // Guardar frase en IndexedDB
  function guardarEnIndexedDB(frase, codigoMorse) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("frases", "readwrite");
      const store = transaction.objectStore("frases");

      const data = { frase, codigoMorse };
      const request = store.add(data);

      request.onsuccess = () => {
        resolve(data);
        gifImagen.style.display = "block"; // Mostrar la imagen al guardar correctamente
        setTimeout(() => {
          gifImagen.style.display = "none"; // Ocultar la imagen después de 3 segundos
        }, 6000); // 3 segundos
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }
  
    // Eliminar frase de IndexedDB
    function eliminarDeIndexedDB(id) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("frases", "readwrite");
        const store = transaction.objectStore("frases");
  
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    // Cargar frases desde IndexedDB
    function cargarDesdeIndexedDB() {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("frases", "readonly");
        const store = transaction.objectStore("frases");
  
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    async function sincronizarFrases() {
      const datos = await cargarDesdeIndexedDB();
      frases.splice(0, frases.length, ...datos);
      actualizarTabla();
    }
  
    function actualizarTabla() {
      tablaBody.innerHTML = "";
      frases.forEach((item, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <th scope="row">${index + 1}</th>
          <td>guardado</td>
          <td>guardado</td>
        `;
        tablaBody.appendChild(fila);
      });
  
      tablaBody.querySelectorAll("button[data-id]").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const id = Number(event.target.getAttribute("data-id"));
          await eliminarDeIndexedDB(id);
          frases.splice(frases.findIndex((item) => item.id === id), 1);
          actualizarTabla();
        });
      });
    }
  
    // Función para convertir texto a código Morse
    function convertirAMorse(texto) {
      return texto
        .toUpperCase()
        .split("")
        .map((char) => morseCodeMap[char] || "?")
        .join(" ");
    }
  
    // Manejar el evento de envío del formulario
    formulario.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const frase = fraseInput.value.trim();
      if (!frase) {
        alert("Por favor, introduce una frase.");
        return;
      }
  
      const codigoMorse = convertirAMorse(frase);
  
      // Guardar en IndexedDB y sincronizar
      const data = await guardarEnIndexedDB(frase, codigoMorse);
      frases.push(data);
      actualizarTabla();
  
      fraseInput.value = "";
    });
  
    // Inicializar la aplicación
    await initIndexedDB();
    await sincronizarFrases();
  });
  