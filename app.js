// ========================================================
// APLICATIVO MÓVIL LUZ DEL SUR - LÓGICA DE CONTROL
// ========================================================

let evidenceManager = null;
let currentLiveDateTime = '';
let selectedSed = null;
let selectedAlim = '';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Reloj en tiempo real
  initLiveClock();

  // 2. Monitoreo de conectividad
  initNetworkMonitor();

  // 3. Selector de SED
  initSedPicker();

  // 4. Validación de Celda (1 carácter: A, B, C o 1, 2, 3) y Cantidades
  initInputMasks();

  // 5. Botones de selección de Material (Cobre / Aluminio)
  initMaterialToggles();

  // 6. Recordar último responsable
  initResponsableStorage();

  // 7. Gestor de Evidencias
  initEvidenceSection();

  // 8. Envío de Formulario
  initFormSubmission();

  // 9. Historial y Modal de Detalle
  initTabsAndHistory();

  // 10. Copiar al Portapapeles
  initClipboardFeatures();
});

/* ==========================================================
   1. RELOJ EN TIEMPO REAL
   ========================================================== */
function initLiveClock() {
  const dateEl = document.getElementById('liveDate');
  const timeEl = document.getElementById('liveTime');

  function update() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    currentLiveDateTime = `${formattedDate} ${formattedTime}`;

    if (dateEl) dateEl.textContent = formattedDate;
    if (timeEl) timeEl.textContent = formattedTime;
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================
   2. MONITOREO DE CONECTIVIDAD
   ========================================================== */
function initNetworkMonitor() {
  const pill = document.getElementById('globalStatusPill');
  const pillText = document.getElementById('globalStatusText');
  const alertBanner = document.getElementById('networkAlert');

  function updateState(online) {
    if (online) {
      if (pill) {
        pill.style.background = 'rgba(16, 185, 129, 0.18)';
        pill.style.color = '#34D399';
      }
      if (pillText) pillText.textContent = 'En línea';
      if (alertBanner) alertBanner.style.display = 'none';
    } else {
      if (pill) {
        pill.style.background = 'rgba(239, 68, 68, 0.2)';
        pill.style.color = '#F87171';
      }
      if (pillText) pillText.textContent = 'Modo Offline';
      if (alertBanner) alertBanner.style.display = 'flex';
    }
  }

  window.addEventListener('online', () => updateState(true));
  window.addEventListener('offline', () => updateState(false));
  updateState(navigator.onLine);
}

/* ==========================================================
   3. SELECTOR INTELIGENTE DE SED
   ========================================================== */
function initSedPicker() {
  const sedPickerBtn = document.getElementById('sedPickerBtn');
  const sedModal = document.getElementById('sedModal');
  const closeModalBtn = document.getElementById('closeSedModal');
  const searchInput = document.getElementById('sedSearchInput');
  const resultsList = document.getElementById('sedResultsList');
  const alimInput = document.getElementById('alimInput');
  const sedHiddenInput = document.getElementById('sedHiddenInput');

  const sedKeys = Object.keys(SED_DATABASE);

  function openModal() {
    sedModal.classList.add('open');
    searchInput.value = '';
    renderResults('');
    setTimeout(() => searchInput.focus(), 150);
  }

  function closeModal() {
    sedModal.classList.remove('open');
  }

  function renderResults(filterText) {
    const query = filterText.trim().toUpperCase();
    resultsList.innerHTML = '';

    const matches = sedKeys.filter(sed => sed.toUpperCase().includes(query));

    if (matches.length === 0) {
      resultsList.innerHTML = `
        <li style="padding: 24px 16px; text-align: center; color: #94A3B8; font-size: 0.85rem;">
          No se encontró ninguna SED con: <strong>${escapeHtml(query)}</strong>
        </li>`;
      return;
    }

    matches.slice(0, 40).forEach(sed => {
      const alim = SED_DATABASE[sed];
      const li = document.createElement('li');
      li.className = 'sed-item';
      li.innerHTML = `
        <strong style="color:var(--lds-navy);">${escapeHtml(sed)}</strong>
        <span style="font-size:0.78rem; background:#F1F5F9; padding:2px 8px; border-radius:4px; color:#475569;">Alim: ${escapeHtml(alim)}</span>
      `;
      li.addEventListener('click', () => {
        selectSed(sed, alim);
        closeModal();
      });
      resultsList.appendChild(li);
    });
  }

  function selectSed(sed, alim) {
    selectedSed = sed;
    selectedAlim = alim;
    sedHiddenInput.value = sed;

    sedPickerBtn.classList.add('selected');
    sedPickerBtn.innerHTML = `
      <span class="sed-selected-code">${escapeHtml(sed)}</span>
      <span style="font-size:0.75rem; color:#64748B;">▾</span>
    `;

    alimInput.value = alim;

    const celdaInput = document.getElementById('celdaInput');
    if (celdaInput) celdaInput.focus();
  }

  sedPickerBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  sedModal.addEventListener('click', (e) => {
    if (e.target === sedModal) closeModal();
  });

  searchInput.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  window.resetSedPicker = function() {
    selectedSed = null;
    selectedAlim = '';
    sedHiddenInput.value = '';
    alimInput.value = '';
    sedPickerBtn.classList.remove('selected');
    sedPickerBtn.innerHTML = `
      <span class="sed-placeholder">Buscar SED...</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#94A3B8"><path d="M7 10l5 5 5-5z"/></svg>
    `;
  };
}

/* ==========================================================
   4. VALIDACIÓN DE CELDA (1 CARÁCTER: A, B, 1, 2...) Y TERNAS
   ========================================================== */
function initInputMasks() {
  const celdaInput = document.getElementById('celdaInput');
  const cantExistInput = document.getElementById('cantTernasExistentes');

  // Celda: estrictamente 1 carácter (A, B, C o 1, 2, 3), en mayúscula
  celdaInput.addEventListener('input', (e) => {
    let val = e.target.value.trim().toUpperCase();
    if (val.length > 1) {
      val = val.charAt(0);
    }
    e.target.value = val;
  });

  // Cantidad de ternas existentes: estrictamente 1 dígito numérico (0-9)
  cantExistInput.addEventListener('input', (e) => {
    let clean = e.target.value.replace(/\D/g, '');
    if (clean.length > 1) {
      clean = clean.charAt(0);
    }
    e.target.value = clean;
  });
}

/* ==========================================================
   5. BOTONES DE SELECCIÓN DE MATERIAL (COBRE / ALUMINIO)
   ========================================================== */
function initMaterialToggles() {
  function setupGroup(groupId, inputId) {
    const group = document.getElementById(groupId);
    const hiddenInput = document.getElementById(inputId);
    if (!group || !hiddenInput) return;

    const buttons = group.querySelectorAll('.mat-toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        hiddenInput.value = btn.getAttribute('data-value');
      });
    });
  }

  setupGroup('groupMatExistente', 'matTernaExistente');
  setupGroup('groupMatInstaladas', 'matTernaInstalada');
  setupGroup('groupCandado', 'candadoElectronico');
}

/* ==========================================================
   6. RECORDAR ÚLTIMO RESPONSABLE
   ========================================================== */
function initResponsableStorage() {
  const select = document.getElementById('responsableSelect');
  const saved = localStorage.getItem('lds_last_responsable');
  if (saved && select) {
    select.value = saved;
  }

  if (select) {
    select.addEventListener('change', () => {
      localStorage.setItem('lds_last_responsable', select.value);
    });
  }
}

/* ==========================================================
   7. GESTOR DE EVIDENCIAS FOTOGRÁFICAS
   ========================================================== */
function initEvidenceSection() {
  const btnCamera = document.getElementById('btnCaptureCamera');
  const btnGallery = document.getElementById('btnSelectGallery');
  const cameraInput = document.getElementById('cameraFileInput');
  const galleryInput = document.getElementById('galleryFileInput');
  const queueList = document.getElementById('evidenceQueueList');
  const badgeCount = document.getElementById('evidenceBadgeCount');

  evidenceManager = new EvidenceManager({
    maxDimension: 1280,
    compressionQuality: 0.75,
    onQueueUpdate: (queue) => {
      renderEvidenceQueue(queue, queueList, badgeCount);
    }
  });

  btnCamera.addEventListener('click', () => {
    cameraInput.value = '';
    cameraInput.click();
  });

  btnGallery.addEventListener('click', () => {
    galleryInput.value = '';
    galleryInput.click();
  });

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    for (let i = 0; i < fileList.length; i++) {
      try {
        await evidenceManager.addFile(fileList[i]);
      } catch (err) {
        alert(err.message || 'Error con el archivo.');
      }
    }
  }

  cameraInput.addEventListener('change', (e) => handleFiles(e.target.files));
  galleryInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

function renderEvidenceQueue(queue, container, badge) {
  if (badge) {
    badge.textContent = `${queue.length} foto${queue.length === 1 ? '' : 's'}`;
  }

  if (queue.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 6px; color: #94A3B8; font-size: 0.75rem;">
        No hay fotos adjuntas. Pulsa Tomar Foto o De Galería.
      </div>`;
    return;
  }

  container.innerHTML = queue.map(item => {
    let statusText = '';
    let statusClass = item.status;
    let progressBarHtml = '';
    let retryBtnHtml = '';

    const origKb = Math.round(item.originalSize / 1024);
    const compKb = item.compressedSize ? Math.round(item.compressedSize / 1024) : null;
    const sizeInfo = compKb ? `${origKb}KB → ${compKb}KB` : `${origKb}KB`;

    switch (item.status) {
      case 'optimizing':
        statusText = 'Optimizando...';
        progressBarHtml = `<div class="progress-bar-sm"><div class="progress-fill-sm" style="width:30%;"></div></div>`;
        break;
      case 'queued':
        statusText = 'En cola';
        progressBarHtml = `<div class="progress-bar-sm"><div class="progress-fill-sm" style="width:10%;"></div></div>`;
        break;
      case 'uploading':
        statusText = `Subiendo ${item.progress}%`;
        progressBarHtml = `<div class="progress-bar-sm"><div class="progress-fill-sm" style="width:${item.progress}%;"></div></div>`;
        break;
      case 'completed':
        statusText = '✓ Lista';
        progressBarHtml = `<div class="progress-bar-sm"><div class="progress-fill-sm" style="width:100%; background:#059669;"></div></div>`;
        break;
      case 'error':
        statusText = '⚠️ Error red';
        progressBarHtml = `<div class="progress-bar-sm"><div class="progress-fill-sm" style="width:100%; background:#DC2626;"></div></div>`;
        retryBtnHtml = `<button type="button" class="btn-retry-sm" onclick="evidenceManager.retryItem('${item.id}')">Reintentar</button>`;
        break;
    }

    return `
      <div class="evidence-item-compact">
        <img src="${item.previewUrl}" alt="Foto" class="evidence-thumb-sm">
        <div class="evidence-info-compact">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="evidence-name-sm">${escapeHtml(item.originalName)}</span>
            <span style="font-size:0.68rem; color:#64748B;">${sizeInfo}</span>
          </div>
          ${progressBarHtml}
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="evidence-status-sm ${statusClass}">${statusText}</span>
            <div style="display:flex; gap:6px; align-items:center;">
              ${retryBtnHtml}
              <button type="button" class="btn-remove-sm" onclick="evidenceManager.removeItem('${item.id}')" title="Eliminar">✕</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================
   8. ENVÍO Y VALIDACIÓN DEL FORMULARIO
   ========================================================== */
function initFormSubmission() {
  const form = document.getElementById('ternasForm');
  const btnClear = document.getElementById('btnClearForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const sed = document.getElementById('sedHiddenInput').value.trim();
    const alim = document.getElementById('alimInput').value.trim();
    const celda = document.getElementById('celdaInput').value.trim().toUpperCase();
    const cantExist = document.getElementById('cantTernasExistentes').value.trim();
    const matExist = document.getElementById('matTernaExistente').value.trim();
    const calibreExist = document.getElementById('calibreExistente').value.trim();
    const cantInst = document.getElementById('cantTernasInstaladas').value.trim();
    const matInst = document.getElementById('matTernaInstalada').value.trim();
    const calibreInst = document.getElementById('calibreInstaladas').value.trim();
    const configuracion = document.getElementById('configuracionInput').value.trim();
    const candado = document.getElementById('candadoElectronico').value.trim() || 'No';
    const comentarios = document.getElementById('comentariosInput').value.trim();
    const responsable = document.getElementById('responsableSelect').value.trim();

    if (!sed) {
      alert('Por favor selecciona una SED.');
      document.getElementById('sedPickerBtn').focus();
      return;
    }

    if (!celda || celda.length !== 1) {
      alert('La Celda debe ser exactamente 1 carácter (ej. A, B, C o 1, 2, 3).');
      document.getElementById('celdaInput').focus();
      return;
    }

    if (!cantExist || !/^[0-9]$/.test(cantExist)) {
      alert('La cantidad de ternas existentes debe ser 1 dígito numérico (0-9).');
      document.getElementById('cantTernasExistentes').focus();
      return;
    }

    if (cantExist !== '0' && (!calibreExist || isNaN(calibreExist) || Number(calibreExist) <= 0)) {
      alert('Por favor ingresa un calibre válido para la terna existente en mm².');
      document.getElementById('calibreExistente').focus();
      return;
    }

    if (cantInst === '' || isNaN(cantInst) || parseInt(cantInst, 10) < 0) {
      alert('Ingresa una cantidad válida de ternas instaladas.');
      document.getElementById('cantTernasInstaladas').focus();
      return;
    }

    if (!calibreInst || isNaN(calibreInst) || Number(calibreInst) <= 0) {
      alert('Por favor ingresa un calibre válido para las ternas instaladas en mm².');
      document.getElementById('calibreInstaladas').focus();
      return;
    }

    if (!configuracion) {
      alert('Por favor ingresa la Configuración de las ternas (ej. 2(3-1x185mm2)).');
      document.getElementById('configuracionInput').focus();
      return;
    }

    if (!responsable) {
      alert('Por favor selecciona un Responsable.');
      document.getElementById('responsableSelect').focus();
      return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    // Formato exacto 'String/date' (YYYY-MM-DD) requerido por la API de SharePoint
    const dateFormatted = `${yyyy}-${mm}-${dd}`;

    const record = {
      id: 'REC-' + Date.now().toString(36).toUpperCase(),
      clientKey: (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_CLIENT_KEY) || '',
      fechaHora: dateFormatted, // YYYY-MM-DD para satisfacer el validador 'String/date' de SharePoint
      fechaHoraTexto: currentLiveDateTime, // Fecha y hora completa para la app móvil
      sed: sed,
      alim: alim,
      celda: celda,
      cantTernasExistentes: Number(cantExist) || 0,
      materialTernaExistente: matExist,
      calibreTernaExistente: Number(calibreExist) || 0,
      cantTernasInstaladas: Number(cantInst) || 0,
      materialTernasInstaladas: matInst,
      calibreTernasInstaladas: Number(calibreInst) || 0,
      configuracion: configuracion,
      candadoElectronico: candado,
      comentarios: comentarios,
      responsable: responsable,
      evidencias: evidenceManager ? await evidenceManager.getUploadedEvidenceWithBase64() : [],
      timestamp: now.toISOString()
    };

    // Protección de seguridad anti-doble clic y estado de progreso
    const submitBtn = document.getElementById('btnSubmit');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    const numFotos = record.evidencias ? record.evidencias.length : 0;
    submitBtn.innerHTML = numFotos > 0 
      ? `<span>Enviando (${numFotos} fotos)... no cierre</span>` 
      : `<span>Transmitiendo a SharePoint...</span>`;

    try {
      // 1. Enviar primero a SharePoint a través de Power Automate (con las fotos para el flujo)
      await sendToSharePoint(record);

      // 2. Guardar respaldo local ligero en el teléfono (sin saturar la cuota de memoria)
      saveRecordLocal(record);

      showToast(`✓ Registro guardado en SharePoint: SED ${record.sed} - Celda ${record.celda}`);
      resetFormKeepingResponsable();
      renderHistory();
    } catch (err) {
      console.error('Error durante la transmisión:', err);
      // Guardar copia local de respaldo
      saveRecordLocal(record);
      alert(`Aviso de transmisión: ${err.message}\n\nEl registro se guardó localmente en la memoria del teléfono.`);
      showToast(`⚠️ Guardado localmente`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  btnClear.addEventListener('click', () => {
    if (confirm('¿Deseas limpiar todos los campos del formulario?')) {
      resetFormKeepingResponsable();
    }
  });
}

function resetFormKeepingResponsable() {
  window.resetSedPicker();
  document.getElementById('celdaInput').value = '';
  document.getElementById('cantTernasExistentes').value = '';
  document.getElementById('calibreExistente').value = '';
  document.getElementById('cantTernasInstaladas').value = '1';
  document.getElementById('calibreInstaladas').value = '';
  
  const configInput = document.getElementById('configuracionInput');
  if (configInput) configInput.value = '';

  // Restablecer material existente
  const matExistBtns = document.querySelectorAll('#groupMatExistente .mat-toggle-btn');
  matExistBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === 'Cobre (Cu)');
  });
  document.getElementById('matTernaExistente').value = 'Cobre (Cu)';

  // Restablecer material instalado
  const matInstBtns = document.querySelectorAll('#groupMatInstaladas .mat-toggle-btn');
  matInstBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === 'Cobre (Cu)');
  });
  document.getElementById('matTernaInstalada').value = 'Cobre (Cu)';

  // Restablecer candado electrónico a 'No'
  const candadoBtns = document.querySelectorAll('#groupCandado .mat-toggle-btn');
  candadoBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === 'No');
  });
  document.getElementById('candadoElectronico').value = 'No';

  document.getElementById('comentariosInput').value = '';

  if (evidenceManager) {
    evidenceManager.clear();
  }
}

/* ==========================================================
   TRANSMISIÓN SEGURA A SHAREPOINT VÍA POWER AUTOMATE
   ========================================================== */
async function sendToSharePoint(record) {
  const endpoint = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.SHAREPOINT_ENDPOINT_URL)
    ? APP_CONFIG.SHAREPOINT_ENDPOINT_URL.trim()
    : '';

  if (!endpoint) {
    console.info('[Modo Offline / Local]: URL de SharePoint aún no configurada en config.js. Se guarda localmente.');
    return;
  }

  if (!navigator.onLine) {
    throw new Error('Sin conexión a internet en el smartphone.');
  }

  // Tiempo dinámico según volumen de fotos: 60s base + 15s por foto (mínimo el tiempo de config.js)
  const numEvid = (record.evidencias && record.evidencias.length) || 0;
  const baseTimeoutMs = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.REQUEST_TIMEOUT_MS) || 180000;
  const timeoutMs = Math.max(baseTimeoutMs, 60000 + (numEvid * 15000));
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Servidor respondió con código ${response.status}`);
    }

    const resText = await response.text();
    try {
      return JSON.parse(resText);
    } catch {
      return resText;
    }
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado (señal débil).');
    }
    throw err;
  }
}

/* ==========================================================
   9. HISTORIAL COMPACTO (SED + CELDA) Y MODAL DE DETALLE
   ========================================================== */
function getSavedRecords() {
  try {
    const data = localStorage.getItem('lds_ternas_records');
    if (!data) {
      // Inyectar registros iniciales para prueba si está vacío
      const sample = [
        {
          id: 'REC-DEMO01',
          fechaHora: '2026-10-22',
          fechaHoraTexto: '22/10/2026 15:40:12',
          sed: '00379S',
          alim: 'A13',
          celda: 'A',
          cantTernasExistentes: 1,
          materialTernaExistente: 'Cobre (Cu)',
          calibreTernaExistente: 240,
          cantTernasInstaladas: 2,
          materialTernasInstaladas: 'Aluminio (Al)',
          calibreTernasInstaladas: 500,
          configuracion: 'Trébol',
          candadoElectronico: 'Sí',
          comentarios: 'Conexión verificada en superficie.',
          responsable: 'Carlos Vizcarra',
          evidencias: [],
          timestamp: new Date().toISOString()
        },
        {
          id: 'REC-DEMO02',
          fechaHora: '2026-10-22',
          fechaHoraTexto: '22/10/2026 16:15:30',
          sed: '01225S',
          alim: 'Z41',
          celda: '1',
          cantTernasExistentes: 0,
          materialTernaExistente: 'Cobre (Cu)',
          calibreTernaExistente: 0,
          cantTernasInstaladas: 1,
          materialTernasInstaladas: 'Cobre (Cu)',
          calibreTernasInstaladas: 240,
          configuracion: 'Plano',
          candadoElectronico: 'No',
          comentarios: 'Terna energizada sin incidencias.',
          responsable: 'Noe Santos',
          evidencias: [],
          timestamp: new Date().toISOString()
        }
      ];
      localStorage.setItem('lds_ternas_records', JSON.stringify(sample));
      return sample;
    }
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveRecordLocal(record) {
  try {
    // Buenas prácticas: guardar solo metadatos ligeros en el teléfono para no desbordar el límite de 5MB de localStorage
    const lightRecord = {
      ...record,
      evidencias: (record.evidencias || []).map(ev => ({
        id: ev.id,
        name: ev.name,
        status: ev.status,
        sizeOriginalKB: ev.sizeOriginalKB,
        sizeCompressedKB: ev.sizeCompressedKB
        // No almacenamos contentBytes (Base64 pesado) en localStorage
      }))
    };

    const records = getSavedRecords();
    records.unshift(lightRecord);
    // Limitar a los últimos 30 registros
    const trimmed = records.slice(0, 30);
    localStorage.setItem('lds_ternas_records', JSON.stringify(trimmed));
    updateRecordBadge();
  } catch (e) {
    console.warn('Exceso de cuota en almacenamiento local, limpiando historial antiguo:', e);
    try {
      localStorage.removeItem('lds_ternas_records');
    } catch {}
  }
}

function updateRecordBadge() {
  const records = getSavedRecords();
  const badge = document.getElementById('historyCountBadge');
  const title = document.getElementById('historyTitleHeader');
  if (badge) badge.textContent = records.length;
  if (title) title.textContent = `Registros en Base (${records.length})`;
}

function initTabsAndHistory() {
  const tabForm = document.getElementById('tabForm');
  const tabHistory = document.getElementById('tabHistory');
  const viewForm = document.getElementById('viewForm');
  const viewHistory = document.getElementById('viewHistory');
  const btnExportCsv = document.getElementById('btnExportCsv');

  tabForm.addEventListener('click', () => {
    tabForm.classList.add('active');
    tabHistory.classList.remove('active');
    viewForm.style.display = 'block';
    viewHistory.classList.remove('active');
  });

  tabHistory.addEventListener('click', () => {
    tabHistory.classList.add('active');
    tabForm.classList.remove('active');
    viewForm.style.display = 'none';
    viewHistory.classList.add('active');
    renderHistory();
  });

  btnExportCsv.addEventListener('click', exportRecordsToCSV);

  // Inicializar modal de detalle
  const detailModal = document.getElementById('recordDetailModal');
  const closeDetailBtn = document.getElementById('closeDetailModal');
  if (closeDetailBtn) {
    closeDetailBtn.addEventListener('click', () => detailModal.classList.remove('open'));
  }
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) detailModal.classList.remove('open');
    });
  }

  updateRecordBadge();
}

/**
 * Renderiza la lista compacta solicitada:
 * Se muestra el N° de SED y la Celda, y al dar clic se abre todo lo que se envió.
 */
function renderHistory() {
  const listEl = document.getElementById('historyList');
  const records = getSavedRecords();
  updateRecordBadge();

  if (records.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:36px 16px; color:#94A3B8;">
        <p style="font-weight:600; font-size:0.88rem;">No hay registros en la base</p>
        <p style="font-size:0.75rem; margin-top:4px;">Los registros enviados desde campo aparecerán aquí.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = records.map(r => `
    <div class="db-record-row" onclick="openRecordDetail('${r.id}')" title="Clic para ver detalle completo">
      <div class="db-record-primary">
        <div class="db-sed-celda-title">
          <span>SED: ${escapeHtml(r.sed)}</span>
          <span class="badge-celda">Celda: ${escapeHtml(r.celda)}</span>
        </div>
        <div class="db-sub-info">
          Alim: ${escapeHtml(r.alim)} &bull; ${escapeHtml(r.fechaHoraTexto || r.fechaHora)} &bull; ${escapeHtml(r.responsable)}
        </div>
      </div>
      <div class="db-chevron">›</div>
    </div>
  `).join('');
}

/**
 * Abre el detalle completo al dar clic en un registro
 */
window.openRecordDetail = function(recordId) {
  const records = getSavedRecords();
  const r = records.find(item => item.id === recordId);
  if (!r) return;

  const modal = document.getElementById('recordDetailModal');
  const title = document.getElementById('detailModalTitle');
  const body = document.getElementById('detailModalBody');

  title.textContent = `SED: ${r.sed} — Celda ${r.celda}`;

  const numEvid = r.evidencias ? r.evidencias.length : 0;

  body.innerHTML = `
    <div class="detail-table-card">
      <div class="detail-row">
        <span class="detail-label">Fecha y Hora</span>
        <span class="detail-val">${escapeHtml(r.fechaHoraTexto || r.fechaHora)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">1. SED</span>
        <span class="detail-val">${escapeHtml(r.sed)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">2. Alimentador (Alim.)</span>
        <span class="detail-val">${escapeHtml(r.alim)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">3. Celda</span>
        <span class="detail-val">${escapeHtml(r.celda)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">4. Cant. Ternas Existentes</span>
        <span class="detail-val">${escapeHtml(r.cantTernasExistentes)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">5. Mat. Terna Existente</span>
        <span class="detail-val">${escapeHtml(r.materialTernaExistente)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Calibre Existente</span>
        <span class="detail-val">${r.calibreTernaExistente ? escapeHtml(r.calibreTernaExistente) + ' mm²' : '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">6. Cant. Ternas Instaladas</span>
        <span class="detail-val">${escapeHtml(r.cantTernasInstaladas)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">7. Mat. Ternas Instaladas</span>
        <span class="detail-val">${escapeHtml(r.materialTernasInstaladas)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Calibre Instaladas</span>
        <span class="detail-val">${r.calibreTernasInstaladas ? escapeHtml(r.calibreTernasInstaladas) + ' mm²' : '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Configuración</span>
        <span class="detail-val">${escapeHtml(r.configuracion || '-')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">¿Candado Electrónico?</span>
        <span class="detail-val">${escapeHtml(r.candadoElectronico || '-')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">8. Comentarios</span>
        <span class="detail-val" style="font-weight:400; text-align:right; max-width:200px;">${escapeHtml(r.comentarios)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">9. Responsable</span>
        <span class="detail-val">${escapeHtml(r.responsable)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">10. Evidencias</span>
        <span class="detail-val">${numEvid} archivo(s) adjunto(s)</span>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:4px;">
      <button type="button" class="btn-submit-main" style="flex:1; height:38px; font-size:0.82rem;" onclick="copyRecordDetail('${r.id}')">
        Copiar este reporte
      </button>
      <button type="button" class="tool-btn" style="height:38px; padding:0 14px;" onclick="document.getElementById('recordDetailModal').classList.remove('open')">
        Cerrar
      </button>
    </div>
  `;

  modal.classList.add('open');
};

/* ==========================================================
   10. COPIADO AL PORTAPAPELES
   ========================================================== */
function initClipboardFeatures() {
  const btnCopyCurrent = document.getElementById('btnCopyClipboard');
  const btnCopyAll = document.getElementById('btnCopyAllHistory');

  if (btnCopyCurrent) {
    btnCopyCurrent.addEventListener('click', () => {
      const sed = document.getElementById('sedHiddenInput').value.trim();
      const alim = document.getElementById('alimInput').value.trim();
      const celda = document.getElementById('celdaInput').value.trim().toUpperCase();
      const cantExist = document.getElementById('cantTernasExistentes').value.trim();
      const matExist = document.getElementById('matTernaExistente').value.trim();
      const calibreExist = document.getElementById('calibreExistente').value.trim();
      const cantInst = document.getElementById('cantTernasInstaladas').value.trim();
      const matInst = document.getElementById('matTernaInstalada').value.trim();
      const calibreInst = document.getElementById('calibreInstaladas').value.trim();
      const configuracion = document.getElementById('configuracionInput').value.trim();
      const candado = document.getElementById('candadoElectronico').value.trim() || 'No';
      const comentarios = document.getElementById('comentariosInput').value.trim();
      const responsable = document.getElementById('responsableSelect').value.trim();
      const numFotos = evidenceManager ? evidenceManager.queue.length : 0;

      if (!sed && !celda) {
        alert('Ingresa o selecciona al menos la SED y Celda antes de copiar.');
        return;
      }

      const textToCopy = 
`⚡ REPORTE DE TERNA - LUZ DEL SUR ⚡
📅 Fecha/Hora: ${currentLiveDateTime}
• SED: ${sed || '(Sin definir)'}
• Alim: ${alim || '-'}
• Celda: ${celda || '-'}
• Cant. Existentes: ${cantExist || '0'} (${matExist}) | Calibre: ${calibreExist || '-'} mm²
• Cant. Instaladas: ${cantInst || '0'} (${matInst}) | Calibre: ${calibreInst || '-'} mm²
• Configuración: ${configuracion || '-'}
• ¿Candado Electrónico?: ${candado}
• Responsable: ${responsable || 'No seleccionado'}
• Comentarios: ${comentarios || 'Ninguno'}
📷 Evidencias: ${numFotos} foto(s)`;

      copyTextSafely(textToCopy, '✓ Formulario copiado al portapapeles');
    });
  }

  if (btnCopyAll) {
    btnCopyAll.addEventListener('click', () => {
      const records = getSavedRecords();
      if (records.length === 0) {
        alert('No hay registros en la base para copiar.');
        return;
      }

      let text = `⚡ RESUMEN DE REGISTROS - LUZ DEL SUR ⚡\nTotal: ${records.length} registro(s)\n\n`;
      records.forEach((r, idx) => {
        text += `[#${idx + 1}] SED: ${r.sed} | Celda: ${r.celda} | Alim: ${r.alim}\n`;
        text += `• Existentes: ${r.cantTernasExistentes} (${r.materialTernaExistente}) - Calibre: ${r.calibreTernaExistente || '-'} mm²\n`;
        text += `• Instaladas: ${r.cantTernasInstaladas} (${r.materialTernasInstaladas}) - Calibre: ${r.calibreTernasInstaladas || '-'} mm²\n`;
        text += `• Config: ${r.configuracion || '-'} | Candado: ${r.candadoElectronico || '-'}\n`;
        text += `• Fecha: ${r.fechaHoraTexto || r.fechaHora} | Resp: ${r.responsable}\n`;
        text += `----------------------------------------\n`;
      });

      copyTextSafely(text, `✓ ${records.length} registros copiados`);
    });
  }
}

window.copyRecordDetail = function(recordId) {
  const records = getSavedRecords();
  const r = records.find(item => item.id === recordId);
  if (!r) return;

  const numEvid = r.evidencias ? r.evidencias.length : 0;
  const text = 
`⚡ TERNA LUZ DEL SUR ⚡
📅 Fecha/Hora: ${r.fechaHoraTexto || r.fechaHora}
• SED: ${r.sed}
• Alim: ${r.alim}
• Celda: ${r.celda}
• Cant. Existentes: ${r.cantTernasExistentes} (${r.materialTernaExistente}) | Calibre: ${r.calibreTernaExistente || '-'} mm²
• Cant. Instaladas: ${r.cantTernasInstaladas} (${r.materialTernasInstaladas}) | Calibre: ${r.calibreTernasInstaladas || '-'} mm²
• Configuración: ${r.configuracion || '-'}
• ¿Candado Electrónico?: ${r.candadoElectronico || '-'}
• Responsable: ${r.responsable}
• Comentarios: ${r.comentarios}
📷 Evidencias: ${numEvid} foto(s)`;

  copyTextSafely(text, `✓ Registro SED ${r.sed} - Celda ${r.celda} copiado`);
};

function copyTextSafely(text, successMessage) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMessage))
      .catch(() => fallbackCopyText(text, successMessage));
  } else {
    fallbackCopyText(text, successMessage);
  }
}

function fallbackCopyText(text, successMessage) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast(successMessage);
  } catch (err) {
    alert('No se pudo copiar automáticamente.');
  }
}

/* ==========================================
   EXPORTAR CSV
   ========================================== */
function exportRecordsToCSV() {
  const records = getSavedRecords();
  if (records.length === 0) {
    alert('No hay registros para exportar.');
    return;
  }

  const headers = [
    'Fecha y Hora', 'SED', 'Alim.', 'Celda',
    'Cantidad de ternas existentes', 'Material de terna existente', 'Calibre terna existente',
    'Cantidad de Ternas Instaladas', 'Material de Ternas Instaladas', 'Calibre ternas instaladas',
    'Configuración', 'Candado Electrónico',
    'Comentarios', 'Responsable'
  ];

  const rows = records.map(r => [
    `"${r.fechaHoraTexto || r.fechaHora}"`, `"${r.sed}"`, `"${r.alim}"`, `"${r.celda}"`,
    `"${r.cantTernasExistentes}"`, `"${r.materialTernaExistente}"`, `"${r.calibreTernaExistente || ''}"`,
    `"${r.cantTernasInstaladas}"`, `"${r.materialTernasInstaladas}"`, `"${r.calibreTernasInstaladas || ''}"`,
    `"${r.configuracion || ''}"`, `"${r.candadoElectronico || ''}"`,
    `"${(r.comentarios || '').replace(/"/g, '""')}"`, `"${r.responsable}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date();
  link.setAttribute('download', `LuzDelSur_Ternas_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showToast(message) {
  const toast = document.getElementById('appToast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast) return;

  toastMsg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
