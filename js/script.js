const PUBLIC_VAPID_KEY =
  "BBxLyh0vFImcZG65K6F4wZv17fbd501Jm1gxxuQLOJCsk6Pq3xJP_wmV9_vgqTcVk-l1-wadN3spEApWaWgASYE";

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/service-worker.js")
//       .then((registration) => {
//         console.log("Service Worker registrado con éxito:", registration.scope);
//       })
//       .catch((error) => {
//         console.log("Error al registrar el Service Worker:", error);
//       });
//   });
// }

const subscription = async () => {
  try {
    const serviceWorker = await navigator.serviceWorker.ready;

    const register = await navigator.serviceWorker.register(
      "/Ejercicio PWA/service-worker.js",
      {
        scope: "/Ejercicio PWA/",
      }
    );
    console.log("New Service Worker");

    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: PUBLIC_VAPID_KEY,
    });

    await fetch("https://backend-pwa-3o91.onrender.com/subscription", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Suscribed!!");
  } catch (error) {
    console.error("Error durante la suscripción:", error);
  }
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().then(() => {
          console.log("Service Worker desregistrado:", registration);
        });
      });
    })
    .catch((error) => {
      console.error(
        "Error al obtener los registros de Service Workers:",
        error
      );
    });
} else {
  console.log("El navegador no soporta Service Workers.");
}


subscription();
