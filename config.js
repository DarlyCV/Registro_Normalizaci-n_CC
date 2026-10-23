/**
 * ============================================================================
 * ARCHIVO DE CONFIGURACIÓN Y SEGURIDAD OFUSCADO - LUZ DEL SUR
 * ============================================================================
 * 
 * Protección para despliegue en repositorios públicos y GitHub Pages:
 * - Endpoints y llaves codificadas para prevenir lectura directa y rastreo de bots.
 * - Desofuscación dinámica en memoria de ejecución.
 */

// Función interna de desofuscación
const _0xlds = (encoded) => {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch (e) {
    return atob(encoded);
  }
};

const APP_CONFIG = {
  /**
   * Endpoint oficial de Power Automate (Ofuscado con protección base64)
   */
  SHAREPOINT_ENDPOINT_URL: _0xlds("aHR0cHM6Ly9kZWZhdWx0MWMwMDUxZGQ0NTk2NGIxYTk4NDlkMDYwNzM1MDU3LjY5LmVudmlyb25tZW50LmFwaS5wb3dlcnBsYXRmb3JtLmNvbTo0NDMvcG93ZXJhdXRvbWF0ZS9hdXRvbWF0aW9ucy9kaXJlY3QvY3UvMjQvd29ya2Zsb3dzLzhmNmM1MDQ5NDJiYzQzZmM4YzNiMjMwOWFmMGI3M2NmL3RyaWdnZXJzL21hbnVhbC9wYXRocy9pbnZva2U/YXBpLXZlcnNpb249MSZzcD0lMkZ0cmlnZ2VycyUyRm1hbnVhbCUyRnJ1biZzdj0xLjAmc2lnPWlIV1RrMXB5cFBoNmFyalhsU0I5VGp4SXBzZEk3Tk4yeld4X0tqc0ZMakU="),

  /**
   * Token secreto de validación de cliente
   */
  API_CLIENT_KEY: _0xlds("TERTX1RFUk5BU19GSUVMRF8yMDI2"),

  /**
   * Tiempo base de espera (3 minutos = 180,000 ms)
   */
  REQUEST_TIMEOUT_MS: 180000
};
