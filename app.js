// ========================================================
// APLICATIVO MÓVIL LUZ DEL SUR - LÓGICA DE CONTROL
// ========================================================

let evidenceManager = null;
let currentLiveDateTime = '';
let selectedSed = null;
let selectedAlim = '';

function safeInit(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[Error inicializando ${name}]:`, err);
  }
}

function startApp() {
  safeInit('liveClock', initLiveClock);
  safeInit('networkMonitor', initNetworkMonitor);
  safeInit('sedPicker', initSedPicker);
  safeInit('inputMasks', initInputMasks);
  safeInit('materialToggles', initMaterialToggles);
  safeInit('configuracionesEngine', initConfiguracionesEngine);
  safeInit('responsableStorage', initResponsableStorage);
  safeInit('evidenceSection', initEvidenceSection);
  safeInit('formSubmission', initFormSubmission);
  safeInit('tabsAndHistory', initTabsAndHistory);
  safeInit('clipboardFeatures', initClipboardFeatures);
  safeInit('infoModal', initInfoExistentesModal);
}

// Inicialización ultra-segura para navegadores móviles (Safari/Chrome)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

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

  const sedDb = (typeof SED_DATABASE !== 'undefined') ? SED_DATABASE : {};
  const sedKeys = Object.keys(sedDb);

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
      const alim = sedDb[sed];
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
    const cableType = document.getElementById('tipoCableExistenteSelect')?.value || 'N2XY';
    updateCalibreSelect('calibreExistente', cableType);
  });
}

/* ==========================================================
   5. BOTONES DE SELECCIÓN DE MATERIAL, TIPOS DE CABLE Y CALIBRES
   Tabla técnica oficial de Luz Del Sur:
   - NA2XY (Aluminio): [400, 240, 185, 120, 95] mm²
   - NAYY  (Aluminio): [500, 300, 185, 120] mm²
   - N2XY  (Cobre)   : [500, 300, 240, 185, 120, 70] mm²
   - NYY   (Cobre)   : [500, 300, 185, 120, 70] mm²
   ========================================================== */
const CABLE_TYPE_OPTIONS = {
  'Cobre (Cu)': ['N2XY', 'NYY'],
  'Aluminio (Al)': ['NA2XY', 'NAYY']
};

const CABLE_CALIBRES = {
  'NA2XY': [400, 240, 185, 120, 95],
  'NAXY':  [400, 240, 185, 120, 95],
  'NAYY':  [500, 300, 185, 120],
  'N2XY':  [500, 300, 240, 185, 120, 70],
  'NYY':   [500, 300, 185, 120, 70]
};

function updateCalibreSelect(calibreSelectId, cableType, defaultVal) {
  const selectEl = document.getElementById(calibreSelectId);
  if (!selectEl) return;

  // Manejo especial para calibre existente cuando cantidad es '0'
  if (calibreSelectId === 'calibreExistente') {
    const cantVal = document.getElementById('cantTernasExistentes')?.value?.trim();
    if (cantVal === '0') {
      selectEl.innerHTML = '<option value="0" selected>0 mm² (Sin terna)</option>';
      selectEl.disabled = true;
      return;
    } else {
      selectEl.disabled = false;
    }
  }

  const calibres = CABLE_CALIBRES[cableType] || [500, 300, 240, 185, 120, 95, 70];
  const prevVal = selectEl.value;

  selectEl.innerHTML = calibres.map(c => `<option value="${c}">${c} mm²</option>`).join('');

  if (defaultVal && calibres.includes(Number(defaultVal))) {
    selectEl.value = String(defaultVal);
  } else if (prevVal && calibres.includes(Number(prevVal))) {
    selectEl.value = prevVal;
  } else {
    // Si no coincide o es nuevo, seleccionar el valor preferencial disponible
    const preferred = calibres.includes(185) ? '185' : (calibres.includes(240) ? '240' : String(calibres[0]));
    selectEl.value = preferred;
  }
}

function updateCableTypeSelect(cableSelectId, calibreSelectId, material) {
  const selectEl = document.getElementById(cableSelectId);
  if (!selectEl) return;
  const isAl = material && material.includes('Aluminio');
  const opts = isAl ? CABLE_TYPE_OPTIONS['Aluminio (Al)'] : CABLE_TYPE_OPTIONS['Cobre (Cu)'];
  const current = selectEl.value;
  selectEl.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
  selectEl.value = opts.includes(current) ? current : opts[0];

  if (calibreSelectId) {
    updateCalibreSelect(calibreSelectId, selectEl.value);
  }
}

function initMaterialToggles() {
  function setupGroup(groupId, inputId, onChangeCallback) {
    const group = document.getElementById(groupId);
    const hiddenInput = document.getElementById(inputId);
    if (!group || !hiddenInput) return;

    const buttons = group.querySelectorAll('.mat-toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.getAttribute('data-value');
        hiddenInput.value = val;
        if (typeof onChangeCallback === 'function') {
          onChangeCallback(val);
        }
      });
    });
  }

  // Material existente -> actualiza tipo de cable y calibre existente
  setupGroup('groupMatExistente', 'matTernaExistente', (mat) => {
    updateCableTypeSelect('tipoCableExistenteSelect', 'calibreExistente', mat);
  });

  // Material Config 1 -> actualiza tipo cable y calibre conf 1
  setupGroup('groupMatConf1', 'matInstaladaConf1', (mat) => {
    updateCableTypeSelect('tipoCableConf1Select', 'calibreConf1', mat);
    recalcAllConfigurations();
  });

  // Material Config 2 -> actualiza tipo cable y calibre conf 2
  setupGroup('groupMatConf2', 'matInstaladaConf2', (mat) => {
    updateCableTypeSelect('tipoCableConf2Select', 'calibreConf2', mat);
    recalcAllConfigurations();
  });

  // Material Config 3 -> actualiza tipo cable y calibre conf 3
  setupGroup('groupMatConf3', 'matInstaladaConf3', (mat) => {
    updateCableTypeSelect('tipoCableConf3Select', 'calibreConf3', mat);
    recalcAllConfigurations();
  });

  // Candado electrónico
  setupGroup('groupCandado', 'candadoElectronico');
}

/* ==========================================================
   5.1 MOTOR DE CÁLCULO DE CONFIGURACIONES DINÁMICAS
   Fórmula técnica: {CantTernas}({Fases}-1x{Calibre}mm2)
   ========================================================== */
function calculateSingleConfig(num) {
  const cantInput = document.getElementById(`cantTernasConf${num}`);
  const calibreInput = document.getElementById(`calibreConf${num}`);
  const calcOutput = document.getElementById(`configCalcConf${num}`);

  const cant = cantInput ? cantInput.value.trim() : '';
  const calibre = calibreInput ? calibreInput.value.trim() : '';
  
  const transfSelect = document.getElementById('transformadorSelect');
  const fases = (transfSelect ? transfSelect.value : '3') || '3'; // 3 si Trifásico, 2 si Monofásico

  if (!cant || !calibre || isNaN(calibre) || Number(calibre) <= 0) {
    if (calcOutput) calcOutput.value = '';
    return '';
  }

  // Ejemplo: 2(3-1x185mm2)
  const formula = `${cant}(${fases}-1x${calibre}mm2)`;
  if (calcOutput) calcOutput.value = formula;
  return formula;
}

function recalcAllConfigurations() {
  const selectCant = document.getElementById('cantConfiguracionesSelect');
  const cantConfigs = selectCant ? parseInt(selectCant.value, 10) : 1;

  const f1 = calculateSingleConfig(1);
  const f2 = (cantConfigs >= 2) ? calculateSingleConfig(2) : '';
  const f3 = (cantConfigs >= 3) ? calculateSingleConfig(3) : '';

  const activeFormulas = [];
  if (f1) activeFormulas.push(f1);
  if (cantConfigs >= 2 && f2) activeFormulas.push(f2);
  if (cantConfigs >= 3 && f3) activeFormulas.push(f3);

  const finalStr = activeFormulas.join(' + ');
  const displayEl = document.getElementById('configFinalDisplay');
  const hiddenInput = document.getElementById('configuracionFinalInput');

  if (finalStr) {
    if (displayEl) displayEl.textContent = finalStr;
    if (hiddenInput) hiddenInput.value = finalStr;
  } else {
    if (displayEl) displayEl.textContent = 'Esperando datos...';
    if (hiddenInput) hiddenInput.value = '';
  }
}

function initConfiguracionesEngine() {
  const selectCant = document.getElementById('cantConfiguracionesSelect');
  const transfSelect = document.getElementById('transformadorSelect');
  const box2 = document.getElementById('boxConfig2');
  const box3 = document.getElementById('boxConfig3');

  function updateVisibility() {
    const val = parseInt(selectCant.value, 10) || 1;
    if (box2) box2.style.display = (val >= 2) ? 'flex' : 'none';
    if (box3) box3.style.display = (val >= 3) ? 'flex' : 'none';
    recalcAllConfigurations();
  }

  if (selectCant) {
    selectCant.addEventListener('change', updateVisibility);
    selectCant.addEventListener('input', updateVisibility);
  }

  if (transfSelect) {
    transfSelect.addEventListener('change', recalcAllConfigurations);
    transfSelect.addEventListener('input', recalcAllConfigurations);
  }

  // Escucha cuando el técnico cambia el Tipo de Cable directamente
  const tipoExistSelect = document.getElementById('tipoCableExistenteSelect');
  if (tipoExistSelect) {
    tipoExistSelect.addEventListener('change', (e) => {
      updateCalibreSelect('calibreExistente', e.target.value);
    });
  }

  const tipo1Select = document.getElementById('tipoCableConf1Select');
  if (tipo1Select) {
    tipo1Select.addEventListener('change', (e) => {
      updateCalibreSelect('calibreConf1', e.target.value);
      recalcAllConfigurations();
    });
  }

  const tipo2Select = document.getElementById('tipoCableConf2Select');
  if (tipo2Select) {
    tipo2Select.addEventListener('change', (e) => {
      updateCalibreSelect('calibreConf2', e.target.value);
      recalcAllConfigurations();
    });
  }

  const tipo3Select = document.getElementById('tipoCableConf3Select');
  if (tipo3Select) {
    tipo3Select.addEventListener('change', (e) => {
      updateCalibreSelect('calibreConf3', e.target.value);
      recalcAllConfigurations();
    });
  }

  // Escuchar inputs y selects disparadores de cálculo (.calc-trigger)
  const triggers = document.querySelectorAll('.calc-trigger');
  triggers.forEach(el => {
    el.addEventListener('input', recalcAllConfigurations);
    el.addEventListener('change', recalcAllConfigurations);
  });

  // Inicializar tipos de cable y sus calibres según materiales predeterminados
  updateCableTypeSelect('tipoCableExistenteSelect', 'calibreExistente', 'Cobre (Cu)');
  updateCableTypeSelect('tipoCableConf1Select', 'calibreConf1', 'Cobre (Cu)');
  updateCableTypeSelect('tipoCableConf2Select', 'calibreConf2', 'Cobre (Cu)');
  updateCableTypeSelect('tipoCableConf3Select', 'calibreConf3', 'Cobre (Cu)');

  updateVisibility();
}

/* ==========================================================
   5.2 MODAL INFORMATIVO PARA TERNAS EXISTENTES
   ========================================================== */
function initInfoExistentesModal() {
  const btnOpen = document.getElementById('btnInfoExistentes');
  const modal = document.getElementById('infoExistentesModal');
  const btnClose = document.getElementById('btnCloseInfoExistentes');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('open');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }
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

  if (typeof EvidenceManager !== 'undefined') {
    evidenceManager = new EvidenceManager({
      maxDimension: 1280,
      compressionQuality: 0.75,
      onQueueUpdate: (queue) => {
        renderEvidenceQueue(queue, queueList, badgeCount);
      }
    });
  }

  if (btnCamera && cameraInput) {
    btnCamera.addEventListener('click', () => {
      cameraInput.value = '';
      cameraInput.click();
    });
  }

  if (btnGallery && galleryInput) {
    btnGallery.addEventListener('click', () => {
      galleryInput.value = '';
      galleryInput.click();
    });
  }

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
    
    // Terna Existente
    const cantExist = document.getElementById('cantTernasExistentes').value.trim();
    const matExist = document.getElementById('matTernaExistente').value.trim();
    const calibreExist = document.getElementById('calibreExistente').value.trim();
    const tipoCableExist = document.getElementById('tipoCableExistenteSelect').value.trim();

    // Transformador y Cantidad de Configuraciones
    const transfSelect = document.getElementById('transformadorSelect');
    const transfFases = transfSelect ? transfSelect.value : '3';
    const transfTexto = transfSelect ? transfSelect.options[transfSelect.selectedIndex].text : 'Trifásico (3)';
    
    const selectCant = document.getElementById('cantConfiguracionesSelect');
    const cantConfigs = selectCant ? parseInt(selectCant.value, 10) : 1;

    // Configuración 1
    const cantConf1 = document.getElementById('cantTernasConf1').value.trim();
    const matConf1 = document.getElementById('matInstaladaConf1').value.trim();
    const calibreConf1 = document.getElementById('calibreConf1').value.trim();
    const tipoCableConf1 = document.getElementById('tipoCableConf1Select').value.trim();

    // Configuración 2
    const cantConf2 = document.getElementById('cantTernasConf2') ? document.getElementById('cantTernasConf2').value.trim() : '';
    const matConf2 = document.getElementById('matInstaladaConf2') ? document.getElementById('matInstaladaConf2').value.trim() : '';
    const calibreConf2 = document.getElementById('calibreConf2') ? document.getElementById('calibreConf2').value.trim() : '';
    const tipoCableConf2 = document.getElementById('tipoCableConf2Select') ? document.getElementById('tipoCableConf2Select').value.trim() : '';

    // Configuración 3
    const cantConf3 = document.getElementById('cantTernasConf3') ? document.getElementById('cantTernasConf3').value.trim() : '';
    const matConf3 = document.getElementById('matInstaladaConf3') ? document.getElementById('matInstaladaConf3').value.trim() : '';
    const calibreConf3 = document.getElementById('calibreConf3') ? document.getElementById('calibreConf3').value.trim() : '';
    const tipoCableConf3 = document.getElementById('tipoCableConf3Select') ? document.getElementById('tipoCableConf3Select').value.trim() : '';

    // Configuración Final
    recalcAllConfigurations();
    const configFinal = (document.getElementById('configuracionFinalInput')?.value || '').trim();

    // Candado, comentarios, responsable
    const candado = document.getElementById('candadoElectronico').value.trim() || 'No';
    const comentarios = document.getElementById('comentariosInput').value.trim();
    const responsable = document.getElementById('responsableSelect').value.trim();

    // Validaciones
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

    // Validar Configuración 1
    if (!cantConf1 || isNaN(cantConf1) || Number(cantConf1) < 1) {
      alert('Ingresa una cantidad válida de ternas en la Configuración 1.');
      document.getElementById('cantTernasConf1').focus();
      return;
    }

    if (!calibreConf1 || isNaN(calibreConf1) || Number(calibreConf1) <= 0) {
      alert('Por favor ingresa un calibre válido para la Configuración 1 en mm².');
      document.getElementById('calibreConf1').focus();
      return;
    }

    // Validar Configuración 2 si aplica
    if (cantConfigs >= 2) {
      if (!cantConf2 || isNaN(cantConf2) || Number(cantConf2) < 1) {
        alert('Ingresa una cantidad válida de ternas en la Configuración 2.');
        document.getElementById('cantTernasConf2').focus();
        return;
      }
      if (!calibreConf2 || isNaN(calibreConf2) || Number(calibreConf2) <= 0) {
        alert('Por favor ingresa un calibre válido para la Configuración 2 en mm².');
        document.getElementById('calibreConf2').focus();
        return;
      }
    }

    // Validar Configuración 3 si aplica
    if (cantConfigs >= 3) {
      if (!cantConf3 || isNaN(cantConf3) || Number(cantConf3) < 1) {
        alert('Ingresa una cantidad válida de ternas en la Configuración 3.');
        document.getElementById('cantTernasConf3').focus();
        return;
      }
      if (!calibreConf3 || isNaN(calibreConf3) || Number(calibreConf3) <= 0) {
        alert('Por favor ingresa un calibre válido para la Configuración 3 en mm².');
        document.getElementById('calibreConf3').focus();
        return;
      }
    }

    if (!configFinal) {
      alert('No se pudo generar la Configuración Final. Verifica los datos ingresados.');
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
    const dateFormatted = `${yyyy}-${mm}-${dd}`;

    const totalTernasInstaladas = Number(cantConf1) + (cantConfigs >= 2 ? Number(cantConf2) : 0) + (cantConfigs >= 3 ? Number(cantConf3) : 0);

    const configsDetalle = [
      {
        config: 1,
        cantTernas: Number(cantConf1),
        material: matConf1,
        calibre: Number(calibreConf1),
        tipoCable: tipoCableConf1,
        formula: calculateSingleConfig(1)
      }
    ];
    if (cantConfigs >= 2) {
      configsDetalle.push({
        config: 2,
        cantTernas: Number(cantConf2),
        material: matConf2,
        calibre: Number(calibreConf2),
        tipoCable: tipoCableConf2,
        formula: calculateSingleConfig(2)
      });
    }
    if (cantConfigs >= 3) {
      configsDetalle.push({
        config: 3,
        cantTernas: Number(cantConf3),
        material: matConf3,
        calibre: Number(calibreConf3),
        tipoCable: tipoCableConf3,
        formula: calculateSingleConfig(3)
      });
    }

    const record = {
      id: 'REC-' + Date.now().toString(36).toUpperCase(),
      clientKey: (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_CLIENT_KEY) || '',
      fechaHora: dateFormatted,
      fechaHoraTexto: currentLiveDateTime,
      sed: sed,
      alim: alim,
      celda: celda,

      // Existente
      cantTernasExistentes: Number(cantExist) || 0,
      materialTernaExistente: matExist,
      calibreTernaExistente: Number(calibreExist) || 0,
      tipoCableExistente: tipoCableExist,

      // Transformador & Configuraciones
      transformador: transfTexto,
      transformadorFases: Number(transfFases),
      cantConfiguraciones: cantConfigs,

      // Configuración 1 (Campos individuales directos para SharePoint)
      cantConf1: Number(cantConf1) || 0,
      materialConf1: matConf1,
      calibreConf1: Number(calibreConf1) || 0,
      tipoCableConf1: tipoCableConf1,
      formulaConf1: calculateSingleConfig(1),

      // Configuración 2 (Campos individuales directos para SharePoint)
      cantConf2: cantConfigs >= 2 ? (Number(cantConf2) || 0) : 0,
      materialConf2: cantConfigs >= 2 ? matConf2 : '',
      calibreConf2: cantConfigs >= 2 ? (Number(calibreConf2) || 0) : 0,
      tipoCableConf2: cantConfigs >= 2 ? tipoCableConf2 : '',
      formulaConf2: cantConfigs >= 2 ? calculateSingleConfig(2) : '',

      // Configuración 3 (Campos individuales directos para SharePoint)
      cantConf3: cantConfigs >= 3 ? (Number(cantConf3) || 0) : 0,
      materialConf3: cantConfigs >= 3 ? matConf3 : '',
      calibreConf3: cantConfigs >= 3 ? (Number(calibreConf3) || 0) : 0,
      tipoCableConf3: cantConfigs >= 3 ? tipoCableConf3 : '',
      formulaConf3: cantConfigs >= 3 ? calculateSingleConfig(3) : '',

      // Resumen general y Configuración Final generada
      cantTernasInstaladas: totalTernasInstaladas,
      cantTotalTernasInstaladas: totalTernasInstaladas,
      materialTernasInstaladas: matConf1,
      calibreTernasInstaladas: Number(calibreConf1) || 0,
      tipoCableInstaladas: tipoCableConf1,
      configuracion: configFinal,
      configuracionFinal: configFinal,

      // Detalle estructurado
      configuracionesDetalle: configsDetalle,

      // Candado, comentarios, responsable, evidencias
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
      // 1. Enviar primero a SharePoint a través de Power Automate
      await sendToSharePoint(record);

      // 2. Guardar respaldo local ligero en el teléfono
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
  
  // Restablecer material y tipo cable existente
  const matExistBtns = document.querySelectorAll('#groupMatExistente .mat-toggle-btn');
  matExistBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === 'Cobre (Cu)');
  });
  document.getElementById('matTernaExistente').value = 'Cobre (Cu)';
  updateCableTypeSelect('tipoCableExistenteSelect', 'calibreExistente', 'Cobre (Cu)');

  // Restablecer transformador y cantidad de configuraciones
  const transfSelect = document.getElementById('transformadorSelect');
  if (transfSelect) transfSelect.value = '3';

  const selectCant = document.getElementById('cantConfiguracionesSelect');
  if (selectCant) {
    selectCant.value = '1';
    const box2 = document.getElementById('boxConfig2');
    const box3 = document.getElementById('boxConfig3');
    if (box2) box2.style.display = 'none';
    if (box3) box3.style.display = 'none';
  }

  // Restablecer Configuración 1
  document.getElementById('cantTernasConf1').value = '1';
  const matConf1Btns = document.querySelectorAll('#groupMatConf1 .mat-toggle-btn');
  matConf1Btns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === 'Cobre (Cu)');
  });
  document.getElementById('matInstaladaConf1').value = 'Cobre (Cu)';
  updateCableTypeSelect('tipoCableConf1Select', 'calibreConf1', 'Cobre (Cu)');
  document.getElementById('configCalcConf1').value = '';

  // Restablecer Configuración 2
  if (document.getElementById('cantTernasConf2')) document.getElementById('cantTernasConf2').value = '1';
  const matConf2Btns = document.querySelectorAll('#groupMatConf2 .mat-toggle-btn');
  matConf2Btns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === 'Cobre (Cu)');
  });
  if (document.getElementById('matInstaladaConf2')) document.getElementById('matInstaladaConf2').value = 'Cobre (Cu)';
  updateCableTypeSelect('tipoCableConf2Select', 'calibreConf2', 'Cobre (Cu)');
  if (document.getElementById('configCalcConf2')) document.getElementById('configCalcConf2').value = '';

  // Restablecer Configuración 3
  if (document.getElementById('cantTernasConf3')) document.getElementById('cantTernasConf3').value = '1';
  const matConf3Btns = document.querySelectorAll('#groupMatConf3 .mat-toggle-btn');
  matConf3Btns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-value') === 'Cobre (Cu)');
  });
  if (document.getElementById('matInstaladaConf3')) document.getElementById('matInstaladaConf3').value = 'Cobre (Cu)';
  updateCableTypeSelect('tipoCableConf3Select', 'calibreConf3', 'Cobre (Cu)');
  if (document.getElementById('configCalcConf3')) document.getElementById('configCalcConf3').value = '';

  recalcAllConfigurations();

  // Restablecer Configuración Final
  const finalDisplay = document.getElementById('configFinalDisplay');
  if (finalDisplay) finalDisplay.textContent = 'Esperando datos...';
  const finalInput = document.getElementById('configuracionFinalInput');
  if (finalInput) finalInput.value = '';

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
      let detail = '';
      try {
        const text = await response.text();
        detail = text ? ` (${text.substring(0, 150)})` : '';
      } catch (e) {}
      throw new Error(`Servidor respondió con código ${response.status}${detail}`);
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
        <span class="detail-label">Tipo Cable Existente</span>
        <span class="detail-val">${escapeHtml(r.tipoCableExistente || '-')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Calibre Existente</span>
        <span class="detail-val">${r.calibreTernaExistente ? escapeHtml(r.calibreTernaExistente) + ' mm²' : '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Transformador</span>
        <span class="detail-val">${escapeHtml(r.transformador || 'Trifásico')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Cant. Configuraciones</span>
        <span class="detail-val">${escapeHtml(r.cantConfiguraciones || '1')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Configuración 1</span>
        <span class="detail-val">${escapeHtml(r.cantConf1 || r.cantTernasInstaladas || 1)} terna(s) [${escapeHtml(r.materialConf1 || r.materialTernasInstaladas || '')} - ${escapeHtml(r.tipoCableConf1 || r.tipoCableInstaladas || '')} ${escapeHtml(r.calibreConf1 || r.calibreTernasInstaladas || '')} mm²] &rarr; <strong>${escapeHtml(r.formulaConf1 || '')}</strong></span>
      </div>
      ${(Number(r.cantConfiguraciones) >= 2 && r.cantConf2) ? `
      <div class="detail-row">
        <span class="detail-label">Configuración 2</span>
        <span class="detail-val">${escapeHtml(r.cantConf2)} terna(s) [${escapeHtml(r.materialConf2 || '')} - ${escapeHtml(r.tipoCableConf2 || '')} ${escapeHtml(r.calibreConf2 || '')} mm²] &rarr; <strong>${escapeHtml(r.formulaConf2 || '')}</strong></span>
      </div>` : ''}
      ${(Number(r.cantConfiguraciones) >= 3 && r.cantConf3) ? `
      <div class="detail-row">
        <span class="detail-label">Configuración 3</span>
        <span class="detail-val">${escapeHtml(r.cantConf3)} terna(s) [${escapeHtml(r.materialConf3 || '')} - ${escapeHtml(r.tipoCableConf3 || '')} ${escapeHtml(r.calibreConf3 || '')} mm²] &rarr; <strong>${escapeHtml(r.formulaConf3 || '')}</strong></span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Cant. Total Ternas Inst.</span>
        <span class="detail-val">${escapeHtml(r.cantTotalTernasInstaladas || r.cantTernasInstaladas || '0')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Configuración Final</span>
        <span class="detail-val" style="font-weight:700; color:var(--lds-navy);">${escapeHtml(r.configuracionFinal || r.configuracion || '-')}</span>
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
      const tipoCableExist = document.getElementById('tipoCableExistenteSelect')?.value || '';
      
      const transfSelect = document.getElementById('transformadorSelect');
      const transfText = transfSelect ? transfSelect.options[transfSelect.selectedIndex].text : 'Trifásico';
      
      const configFinal = (document.getElementById('configuracionFinalInput')?.value || document.getElementById('configFinalDisplay')?.textContent || '-').trim();
      const candado = document.getElementById('candadoElectronico').value.trim() || 'No';
      const comentarios = document.getElementById('comentariosInput').value.trim();
      const responsable = document.getElementById('responsableSelect').value.trim();
      const numFotos = evidenceManager ? evidenceManager.queue.length : 0;

      if (!sed && !celda) {
        alert('Ingresa o selecciona al menos la SED y Celda antes de copiar.');
        return;
      }

      const selectCant = document.getElementById('cantConfiguracionesSelect');
      const cantConfigs = selectCant ? parseInt(selectCant.value, 10) : 1;

      const cantConf1 = document.getElementById('cantTernasConf1')?.value || '1';
      const matConf1 = document.getElementById('matInstaladaConf1')?.value || 'Cobre (Cu)';
      const tipoCableConf1 = document.getElementById('tipoCableConf1Select')?.value || 'N2XY';
      const calibreConf1 = document.getElementById('calibreConf1')?.value || '';
      const formulaConf1 = calculateSingleConfig(1);

      const cantConf2 = document.getElementById('cantTernasConf2')?.value || '1';
      const matConf2 = document.getElementById('matInstaladaConf2')?.value || 'Cobre (Cu)';
      const tipoCableConf2 = document.getElementById('tipoCableConf2Select')?.value || 'N2XY';
      const calibreConf2 = document.getElementById('calibreConf2')?.value || '';
      const formulaConf2 = calculateSingleConfig(2);

      const cantConf3 = document.getElementById('cantTernasConf3')?.value || '1';
      const matConf3 = document.getElementById('matInstaladaConf3')?.value || 'Cobre (Cu)';
      const tipoCableConf3 = document.getElementById('tipoCableConf3Select')?.value || 'N2XY';
      const calibreConf3 = document.getElementById('calibreConf3')?.value || '';
      const formulaConf3 = calculateSingleConfig(3);

      const totalInstaladas = Number(cantConf1 || 0) + (cantConfigs >= 2 ? Number(cantConf2 || 0) : 0) + (cantConfigs >= 3 ? Number(cantConf3 || 0) : 0);

      let configsBlock = `• Configuración 1: ${cantConf1} terna(s) [${matConf1} - ${tipoCableConf1} ${calibreConf1} mm²] → ${formulaConf1}\n`;
      if (cantConfigs >= 2) {
        configsBlock += `• Configuración 2: ${cantConf2} terna(s) [${matConf2} - ${tipoCableConf2} ${calibreConf2} mm²] → ${formulaConf2}\n`;
      }
      if (cantConfigs >= 3) {
        configsBlock += `• Configuración 3: ${cantConf3} terna(s) [${matConf3} - ${tipoCableConf3} ${calibreConf3} mm²] → ${formulaConf3}\n`;
      }

      const textToCopy = 
`⚡ REPORTE DE TERNA - LUZ DEL SUR ⚡
📅 Fecha/Hora: ${currentLiveDateTime}
• SED: ${sed || '(Sin definir)'}
• Alim: ${alim || '-'}
• Celda: ${celda || '-'}
• Cant. Existentes: ${cantExist || '0'} (${matExist} - ${tipoCableExist}) | Calibre: ${calibreExist || '-'} mm²
• Transformador: ${transfText}
• Cant. Configuraciones: ${cantConfigs}
${configsBlock}• Cant. Total Ternas Inst.: ${totalInstaladas}
• Configuración Final: ${configFinal}
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
        text += `• Conf 1: ${r.cantConf1 || r.cantTernasInstaladas || '0'} (${r.materialConf1 || r.materialTernasInstaladas || '-'} - ${r.tipoCableConf1 || r.tipoCableInstaladas || '-'} ${r.calibreConf1 || r.calibreTernasInstaladas || '-'} mm²)\n`;
        if (Number(r.cantConfiguraciones) >= 2 && r.cantConf2) {
          text += `• Conf 2: ${r.cantConf2} (${r.materialConf2} - ${r.tipoCableConf2} ${r.calibreConf2} mm²)\n`;
        }
        if (Number(r.cantConfiguraciones) >= 3 && r.cantConf3) {
          text += `• Conf 3: ${r.cantConf3} (${r.materialConf3} - ${r.tipoCableConf3} ${r.calibreConf3} mm²)\n`;
        }
        text += `• Config Final: ${r.configuracionFinal || r.configuracion || '-'}\n`;
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
  const cantConfigs = Number(r.cantConfiguraciones) || 1;
  let configsBlock = `• Configuración 1: ${r.cantConf1 || r.cantTernasInstaladas || '0'} terna(s) [${r.materialConf1 || r.materialTernasInstaladas || '-'} - ${r.tipoCableConf1 || r.tipoCableInstaladas || '-'} ${r.calibreConf1 || r.calibreTernasInstaladas || '-'} mm²] → ${r.formulaConf1 || '-'}\n`;
  if (cantConfigs >= 2 && r.cantConf2) {
    configsBlock += `• Configuración 2: ${r.cantConf2} terna(s) [${r.materialConf2} - ${r.tipoCableConf2} ${r.calibreConf2} mm²] → ${r.formulaConf2 || '-'}\n`;
  }
  if (cantConfigs >= 3 && r.cantConf3) {
    configsBlock += `• Configuración 3: ${r.cantConf3} terna(s) [${r.materialConf3} - ${r.tipoCableConf3} ${r.calibreConf3} mm²] → ${r.formulaConf3 || '-'}\n`;
  }

  const text = 
`⚡ TERNA LUZ DEL SUR ⚡
📅 Fecha/Hora: ${r.fechaHoraTexto || r.fechaHora}
• SED: ${r.sed}
• Alim: ${r.alim}
• Celda: ${r.celda}
• Cant. Existentes: ${r.cantTernasExistentes} (${r.materialTernaExistente} - ${r.tipoCableExistente || 'N2XY'}) | Calibre: ${r.calibreTernaExistente || '-'} mm²
• Transformador: ${r.transformador || 'Trifásico'}
• Cant. Configuraciones: ${cantConfigs}
${configsBlock}• Cant. Total Ternas Inst.: ${r.cantTotalTernasInstaladas || r.cantTernasInstaladas || '0'}
• Configuración Final: ${r.configuracionFinal || r.configuracion || '-'}
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
    'Cantidad de ternas existentes', 'Material de terna existente', 'Tipo cable existente', 'Calibre terna existente',
    'Transformador', 'Cantidad Configuraciones',
    'Cant. Ternas Conf 1', 'Material Conf 1', 'Tipo Cable Conf 1', 'Calibre Conf 1', 'Fórmula Conf 1',
    'Cant. Ternas Conf 2', 'Material Conf 2', 'Tipo Cable Conf 2', 'Calibre Conf 2', 'Fórmula Conf 2',
    'Cant. Ternas Conf 3', 'Material Conf 3', 'Tipo Cable Conf 3', 'Calibre Conf 3', 'Fórmula Conf 3',
    'Cantidad de Ternas Instaladas', 'Configuración Final', 'Candado Electrónico',
    'Comentarios', 'Responsable'
  ];

  const rows = records.map(r => [
    `"${r.fechaHoraTexto || r.fechaHora}"`, `"${r.sed}"`, `"${r.alim}"`, `"${r.celda}"`,
    `"${r.cantTernasExistentes}"`, `"${r.materialTernaExistente}"`, `"${r.tipoCableExistente || ''}"`, `"${r.calibreTernaExistente || ''}"`,
    `"${r.transformador || ''}"`, `"${r.cantConfiguraciones || '1'}"`,
    `"${r.cantConf1 || ''}"`, `"${r.materialConf1 || ''}"`, `"${r.tipoCableConf1 || ''}"`, `"${r.calibreConf1 || ''}"`, `"${r.formulaConf1 || ''}"`,
    `"${r.cantConf2 || ''}"`, `"${r.materialConf2 || ''}"`, `"${r.tipoCableConf2 || ''}"`, `"${r.calibreConf2 || ''}"`, `"${r.formulaConf2 || ''}"`,
    `"${r.cantConf3 || ''}"`, `"${r.materialConf3 || ''}"`, `"${r.tipoCableConf3 || ''}"`, `"${r.calibreConf3 || ''}"`, `"${r.formulaConf3 || ''}"`,
    `"${r.cantTernasInstaladas || r.cantTotalTernasInstaladas || ''}"`, `"${r.configuracion || r.configuracionFinal || ''}"`, `"${r.candadoElectronico || ''}"`,
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
