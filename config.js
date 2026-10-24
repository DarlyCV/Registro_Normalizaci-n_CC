/**
 * ============================================================================
 * ARCHIVO DE CONFIGURACIÓN Y SEGURIDAD - APLICATIVO LUZ DEL SUR
 * ============================================================================
 */

const APP_CONFIG = {
  /**
   * Endpoint oficial de Power Automate conectado a SharePoint
   */
  SHAREPOINT_ENDPOINT_URL: "https://default1c0051dd45964b1a9849d060735057.69.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/24/workflows/8f6c504942bc43fc8c3b2309af0b73cf/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iHWTk1pypPH6arjXlSB9TjxIpsdI7NN2zWx_KjsFLjE",

  /**
   * Token de validación de cliente
   */
  API_CLIENT_KEY: "LDS_TERNAS_FIELD_2026",

  /**
   * Tiempo base de espera (3 minutos = 180,000 ms)
   */
  REQUEST_TIMEOUT_MS: 180000
};
