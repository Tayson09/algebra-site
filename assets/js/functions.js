document.addEventListener("DOMContentLoaded", () => {
  // ==== CONSTANTES E VARIÁVEIS GLOBAIS ====
  const canvas = document.getElementById("functionCanvas");
  const ctx = canvas.getContext("2d");
  const DPR = window.devicePixelRatio || 1;
  const WIDTH = canvas.clientWidth * DPR;
  const HEIGHT = canvas.clientHeight * DPR;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  
  // Estado da aplicação
  let currentMode = 'single';
  let explanationActive = true;
  let viewScale = 1;
  let viewOffsetX = 0;
  let viewOffsetY = 0;
  let dragging = false;
  let lastX, lastY;
  let legendCount = 0;
  let currentOperation = null;
  
  // Funções atuais
  const functions = {
    primary: { type: 'polynomial', params: { coefficients: [0, 0, 1] } }, // x²
    secondary: { type: 'polynomial', params: { coefficients: [0, 1] } },  // x
    result: null
  };
  
  // ==== SISTEMA DE MODOS ====
  const modeButtons = document.querySelectorAll('.mode-btn');
  const modePanels = {
    single: document.getElementById('single-panel'),
    compare: document.getElementById('compare-panel'),
    operations: document.getElementById('operations-panel')
  };
  
  // Inicialização dos modos
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      switchMode(mode);
    });
  });
  
  function switchMode(mode) {
    currentMode = mode;
    
    // Atualizar botões
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Atualizar painéis
    Object.values(modePanels).forEach(panel => {
      panel.style.display = 'none';
    });
    modePanels[mode].style.display = 'block';
    
    // Atualizar explicação
    updateExplanation('mode-selection', `Modo ${getModeName(mode)} ativado. ${getModeDescription(mode)}`);
    
    // Redesenhar
    redrawAll();
  }
  
  function getModeName(mode) {
    const names = {
      'single': 'Função Única',
      'compare': 'Comparação',
      'operations': 'Operações'
    };
    return names[mode] || mode;
  }
  
  function getModeDescription(mode) {
    const descriptions = {
      'single': 'Analise uma única função em detalhes.',
      'compare': 'Compare duas funções lado a lado.',
      'operations': 'Combine funções com operações matemáticas.'
    };
    return descriptions[mode] || '';
  }
  
  // ==== MODO EXPLICAÇÃO ====
  const explanationPanel = document.getElementById('explanationPanel');
  const explanationTitle = document.getElementById('explanationTitle');
  const explanationText = document.getElementById('explanationText');
  
  document.getElementById('helpToggle').addEventListener('click', () => {
    explanationActive = !explanationActive;
    explanationPanel.style.display = explanationActive ? 'block' : 'none';
    document.getElementById('helpToggle').textContent = 
      explanationActive ? 'Ocultar Explicações' : 'Modo Explicação';
  });
  
  // Atualizar explicações
  function updateExplanation(context, message, title = "Informação") {
    if (!explanationActive) return;
    
    explanationTitle.textContent = title;
    explanationText.textContent = message;
  }
  
  // Tooltips informativos
  document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      const infoType = e.target.dataset.info;
      const messages = {
        'single-function': 'Define uma única função para análise. Você pode escolher entre diferentes tipos de funções e ajustar seus parâmetros.',
        'compare-function': 'Compare duas funções diferentes no mesmo gráfico para analisar suas relações.',
        'operations-function': 'Combine duas funções usando operações matemáticas para criar novas funções.',
        'function-props': 'Mostra propriedades matemáticas importantes da função selecionada, como raízes, domínio e imagem.',
        'cartesian-plane': 'O plano cartesiano é um sistema de coordenadas bidimensional formado por dois eixos perpendiculares: o eixo x (horizontal) e o eixo y (vertical). O ponto onde eles se cruzam é chamado de origem (0,0).'
      };
      
      if (messages[infoType]) {
        updateExplanation(infoType, messages[infoType]);
      }
    });
  });
  
  // ==== SISTEMA DE FUNÇÕES ====
  // Gerar controles para o tipo de função
  document.getElementById('functionType').addEventListener('change', function() {
    generateFunctionControls('primary', this.value, 'function-controls');
    redrawAll();
    analyzeFunction();
  });
  
  // Função para gerar controles baseados no tipo
  function generateFunctionControls(funcKey, type, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    functions[funcKey].type = type;
    
    switch(type) {
      case 'polynomial':
        container.innerHTML = `
          <label>Grau:</label>
          <input type="number" class="poly-degree" min="0" max="10" value="2">
          <div class="coefficients"></div>
        `;
        const degreeInput = container.querySelector('.poly-degree');
        degreeInput.addEventListener('change', function() {
          updatePolynomialCoefficients(container, parseInt(this.value));
          updateFunctionFromControls(funcKey, containerId);
        });
        updatePolynomialCoefficients(container, parseInt(degreeInput.value));
        break;
        
      case 'linear':
        container.innerHTML = `
          <div class="coef-wrapper">
            <label>a:</label>
            <input type="number" class="linear-a" value="1" step="0.1">
          </div>
          <div class="coef-wrapper">
            <label>b:</label>
            <input type="number" class="linear-b" value="0" step="0.1">
          </div>
          <p class="info-text">Formato: f(x) = ax + b</p>
        `;
        break;
        
      case 'quadratic':
        container.innerHTML = `
          <div class="coef-wrapper">
            <label>a:</label>
            <input type="number" class="quadratic-a" value="1" step="0.1">
          </div>
          <div class="coef-wrapper">
            <label>b:</label>
            <input type="number" class="quadratic-b" value="0" step="0.1">
          </div>
          <div class="coef-wrapper">
            <label>c:</label>
            <input type="number" class="quadratic-c" value="0" step="0.1">
          </div>
          <p class="info-text">Formato: f(x) = ax² + bx + c</p>
        `;
        break;
        
      case 'trigonometric':
        container.innerHTML = `
          <div class="coef-wrapper">
            <label>Tipo:</label>
            <select class="trig-function">
              <option value="sin">sen(x)</option>
              <option value="cos">cos(x)</option>
              <option value="tan">tan(x)</option>
            </select>
          </div>
          <div class="coef-wrapper">
            <label>Amplitude:</label>
            <input type="number" class="trig-amplitude" value="1" step="0.1">
          </div>
          <div class="coef-wrapper">
            <label>Frequência:</label>
            <input type="number" class="trig-frequency" value="1" step="0.1">
          </div>
          <div class="coef-wrapper">
            <label>Fase:</label>
            <input type="number" class="trig-phase" value="0" step="0.1">
          </div>
          <p class="info-text">Formato: f(x) = A · trig(Bx + C)</p>
        `;
        break;
        
      case 'exponential':
        container.innerHTML = `
          <div class="coef-wrapper">
            <label>Base:</label>
            <input type="number" class="exp-base" value="2" step="0.1">
          </div>
          <div class="coef-wrapper">
            <label>Coeficiente:</label>
            <input type="number" class="exp-coeff" value="1" step="0.1">
          </div>
          <p class="info-text">Formato: f(x) = a · bˣ</p>
        `;
        break;
    }
    
    // Adicionar listeners para atualização
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        updateFunctionFromControls(funcKey, containerId);
      });
    });
    
    // Atualizar função imediatamente
    updateFunctionFromControls(funcKey, containerId);
  }
  
  // Atualizar coeficientes polinomiais
  function updatePolynomialCoefficients(container, degree) {
    const coeffContainer = container.querySelector('.coefficients');
    coeffContainer.innerHTML = '';
    
    for (let i = 0; i <= degree; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'coef-wrapper';
      
      const label = document.createElement('label');
      label.textContent = `a${i}:`;
      
      const input = document.createElement('input');
      input.type = 'number';
      input.value = i === degree ? '1' : '0';
      input.step = 'any';
      input.className = 'coef-input';
      
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      coeffContainer.appendChild(wrapper);
    }
  }
  
  // Atualizar função a partir dos controles
  function updateFunctionFromControls(funcKey, containerId) {
    const container = document.getElementById(containerId);
    const type = functions[funcKey].type;
    
    switch(type) {
      case 'polynomial':
        const degree = parseInt(container.querySelector('.poly-degree').value);
        const coeffInputs = container.querySelectorAll('.coef-input');
        const coefficients = Array.from(coeffInputs).map(input => parseFloat(input.value) || 0);
        functions[funcKey].params = { coefficients };
        break;
        
      case 'linear':
        const a = parseFloat(container.querySelector('.linear-a').value) || 1;
        const b = parseFloat(container.querySelector('.linear-b').value) || 0;
        functions[funcKey].params = { coefficients: [b, a] };
        break;
        
      case 'quadratic':
        const a2 = parseFloat(container.querySelector('.quadratic-a').value) || 1;
        const b2 = parseFloat(container.querySelector('.quadratic-b').value) || 0;
        const c2 = parseFloat(container.querySelector('.quadratic-c').value) || 0;
        functions[funcKey].params = { coefficients: [c2, b2, a2] };
        break;
        
      case 'trigonometric':
        const trigFunction = container.querySelector('.trig-function').value;
        const amplitude = parseFloat(container.querySelector('.trig-amplitude').value) || 1;
        const frequency = parseFloat(container.querySelector('.trig-frequency').value) || 1;
        const phase = parseFloat(container.querySelector('.trig-phase').value) || 0;
        functions[funcKey].params = { function: trigFunction, amplitude, frequency, phase };
        break;
        
      case 'exponential':
        const base = parseFloat(container.querySelector('.exp-base').value) || 2;
        const coefficient = parseFloat(container.querySelector('.exp-coeff').value) || 1;
        functions[funcKey].params = { base, coefficient };
        break;
    }
    
    if (funcKey === 'primary') {
      analyzeFunction();
    }
    
    redrawAll();
  }
  
  // ==== AVALIAÇÃO DE FUNÇÕES ====
  function evaluateFunction(func, x) {
    if (!func) return 0;
    
    switch(func.type) {
      case 'polynomial':
      case 'linear':
      case 'quadratic':
        return func.params.coefficients.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
        
      case 'trigonometric':
        const trigFunc = {
          'sin': Math.sin,
          'cos': Math.cos,
          'tan': Math.tan
        }[func.params.function];
        return func.params.amplitude * trigFunc(func.params.frequency * x + func.params.phase);
        
      case 'exponential':
        return func.params.coefficient * Math.pow(func.params.base, x);
        
      default:
        return 0;
    }
  }
  
  // ==== OPERAÇÕES ENTRE FUNÇÕES ====
  function addFunctions(f, g, x) {
    return evaluateFunction(f, x) + evaluateFunction(g, x);
  }
  
  function subFunctions(f, g, x) {
    return evaluateFunction(f, x) - evaluateFunction(g, x);
  }
  
  function mulFunctions(f, g, x) {
    return evaluateFunction(f, x) * evaluateFunction(g, x);
  }
  
  // ==== ANÁLISE DE FUNÇÃO ====
  function analyzeFunction() {
    const propsContainer = document.getElementById('functionProperties');
    const func = functions.primary;
    
    if (!func) {
      propsContainer.innerHTML = '<p>Nenhuma função definida.</p>';
      return;
    }
    
    let html = `<p><strong>Tipo:</strong> ${func.type}</p>`;
    
    // Análise específica por tipo
    switch(func.type) {
      case 'linear':
        const a = func.params.coefficients[1];
        const b = func.params.coefficients[0];
        const root = -b / a;
        html += `<p><strong>Raiz:</strong> x = ${root.toFixed(2)}</p>`;
        html += `<p><strong>Coeficiente angular:</strong> ${a}</p>`;
        break;
        
      case 'quadratic':
        const a2 = func.params.coefficients[2];
        const b2 = func.params.coefficients[1];
        const c2 = func.params.coefficients[0];
        const discriminant = b2*b2 - 4*a2*c2;
        
        if (discriminant >= 0) {
          const root1 = (-b2 + Math.sqrt(discriminant)) / (2*a2);
          const root2 = (-b2 - Math.sqrt(discriminant)) / (2*a2);
          html += `<p><strong>Raízes:</strong> x1 = ${root1.toFixed(2)}, x2 = ${root2.toFixed(2)}</p>`;
        } else {
          html += `<p><strong>Nenhuma raiz real</strong></p>`;
        }
        
        const vertexX = -b2 / (2*a2);
        const vertexY = evaluateFunction(func, vertexX);
        html += `<p><strong>Vértice:</strong> (${vertexX.toFixed(2)}, ${vertexY.toFixed(2)})</p>`;
        break;
    }
    
    // Domínio
    const domainMin = document.getElementById('domainMin').value;
    const domainMax = document.getElementById('domainMax').value;
    html += `<p><strong>Domínio:</strong> [${domainMin}, ${domainMax}]</p>`;
    
    propsContainer.innerHTML = html;
  }
  
  // ==== GRÁFICO COM PLANO CARTESIANO ====
  function clearCanvas() {
    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, "#0a081f");
    gradient.addColorStop(1, "#1a173a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  
  function drawCartesianPlane() {
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const axisLength = Math.min(WIDTH, HEIGHT) * 0.9;
    const axisStartX = centerX - axisLength / 2;
    const axisEndX = centerX + axisLength / 2;
    const axisStartY = centerY - axisLength / 2;
    const axisEndY = centerY + axisLength / 2;
    
    // Transformação para centralizar
    ctx.save();
    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(viewScale, viewScale);
    
    // Configurações dos eixos
    ctx.strokeStyle = "#86a8e7";
    ctx.lineWidth = 2 * DPR;
    
    // Desenhar eixo X (horizontal)
    ctx.beginPath();
    ctx.moveTo(axisStartX, centerY);
    ctx.lineTo(axisEndX, centerY);
    ctx.stroke();
    
    // Desenhar eixo Y (vertical)
    ctx.beginPath();
    ctx.moveTo(centerX, axisStartY);
    ctx.lineTo(centerX, axisEndY);
    ctx.stroke();
    
    // Setas
    ctx.fillStyle = "#86a8e7";
    
    // Seta eixo X
    ctx.beginPath();
    ctx.moveTo(axisEndX, centerY);
    ctx.lineTo(axisEndX - 10, centerY - 5);
    ctx.lineTo(axisEndX - 10, centerY + 5);
    ctx.fill();
    
    // Seta eixo Y
    ctx.beginPath();
    ctx.moveTo(centerX, axisStartY);
    ctx.lineTo(centerX - 5, axisStartY + 10);
    ctx.lineTo(centerX + 5, axisStartY + 10);
    ctx.fill();
    
    // Marcacoes e rótulos
    ctx.fillStyle = "#d1d1ff";
    ctx.font = `${12 * DPR}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Unidades por marcação
    const unit = axisLength / 20;
    const maxUnits = 10;
    
    // Marcacoes eixo X (positivo)
    for (let i = 1; i <= maxUnits; i++) {
        const xPos = centerX + i * unit;
        
        // Marcacao
        ctx.beginPath();
        ctx.moveTo(xPos, centerY - 5);
        ctx.lineTo(xPos, centerY + 5);
        ctx.stroke();
        
        // Rótulo
        ctx.fillText(i.toString(), xPos, centerY + 15);
    }
    
    // Marcacoes eixo X (negativo)
    for (let i = 1; i <= maxUnits; i++) {
        const xPos = centerX - i * unit;
        
        // Marcacao
        ctx.beginPath();
        ctx.moveTo(xPos, centerY - 5);
        ctx.lineTo(xPos, centerY + 5);
        ctx.stroke();
        
        // Rótulo
        ctx.fillText((-i).toString(), xPos, centerY + 15);
    }
    
    // Marcacoes eixo Y (positivo)
    for (let i = 1; i <= maxUnits; i++) {
        const yPos = centerY - i * unit;
        
        // Marcacao
        ctx.beginPath();
        ctx.moveTo(centerX - 5, yPos);
        ctx.lineTo(centerX + 5, yPos);
        ctx.stroke();
        
        // Rótulo
        ctx.fillText(i.toString(), centerX - 15, yPos);
    }
    
    // Marcacoes eixo Y (negativo)
    for (let i = 1; i <= maxUnits; i++) {
        const yPos = centerY + i * unit;
        
        // Marcacao
        ctx.beginPath();
        ctx.moveTo(centerX - 5, yPos);
        ctx.lineTo(centerX + 5, yPos);
        ctx.stroke();
        
        // Rótulo
        ctx.fillText((-i).toString(), centerX - 15, yPos);
    }
    
    // Origem (0,0)
    ctx.fillStyle = "#FF6B6B";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4 * DPR, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "white";
    ctx.font = `${10 * DPR}px 'Inter', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("(0,0)", centerX + 8, centerY - 5);
    
    // Rótulos dos eixos
    ctx.fillStyle = "#86a8e7";
    ctx.font = `${14 * DPR}px 'Inter', sans-serif`;
    ctx.fillText("x", axisEndX - 15, centerY + 20);
    ctx.fillText("y", centerX + 10, axisStartY + 10);
    
    ctx.restore();
}

function plotFunction(func, color, label) {
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const axisLength = Math.min(WIDTH, HEIGHT) * 0.9;
    const unit = axisLength / 20;
    
    ctx.save();
    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(viewScale, viewScale);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * DPR;
    ctx.lineJoin = "round";
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * DPR;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.beginPath();
    const samples = 500;
    const domainMin = parseFloat(document.getElementById('domainMin').value) || -10;
    const domainMax = parseFloat(document.getElementById('domainMax').value) || 10;
    
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const xVal = domainMin + t * (domainMax - domainMin);
        const yVal = evaluateFunction(func, xVal);
        
        if (isNaN(yVal)) continue;
        
        const clampedY = Math.max(-10, Math.min(10, yVal));
        const px = centerX + xVal * unit;
        const py = centerY - yVal * unit;
        
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
    
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    
    // Legenda
    if (label) {
        const legendX = WIDTH - 100 * DPR;
        const legendY = 50 * DPR * legendCount;
        legendCount++;
        
        ctx.fillStyle = color;
        ctx.font = `${14 * DPR}px 'Inter', sans-serif`;
        ctx.fillText(label, legendX, legendY);
    }
    
    ctx.restore();
}

  
  function plotOperation(op) {
    const margin = 50 * DPR;
    const x0 = margin;
    const y0 = HEIGHT - margin;
    const xEnd = WIDTH - margin;
    const yEnd = margin;
    
    ctx.save();
    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(viewScale, viewScale);
    
    ctx.strokeStyle = "#F6E05E";
    ctx.lineWidth = 3 * DPR;
    ctx.lineJoin = "round";
    
    ctx.shadowColor = "#F6E05E";
    ctx.shadowBlur = 10 * DPR;
    
    ctx.beginPath();
    const samples = 500;
    const domainMin = parseFloat(document.getElementById('domainMin').value) || -10;
    const domainMax = parseFloat(document.getElementById('domainMax').value) || 10;
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const xVal = domainMin + t * (domainMax - domainMin);
      let yVal;
      
      switch(op) {
        case 'add': yVal = addFunctions(functions.primary, functions.secondary, xVal); break;
        case 'sub': yVal = subFunctions(functions.primary, functions.secondary, xVal); break;
        case 'mul': yVal = mulFunctions(functions.primary, functions.secondary, xVal); break;
      }
      
      if (isNaN(yVal)) continue;
      
      const clampedY = Math.max(-100, Math.min(100, yVal));
      const px = x0 + ((xVal - domainMin) / (domainMax - domainMin)) * (xEnd - x0);
      const py = y0 - ((clampedY + 10) / 20) * (y0 - yEnd);
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    
    // Legenda
    const legendX = WIDTH - margin - 100 * DPR;
    const legendY = margin + 30 * DPR * legendCount;
    legendCount++;
    
    ctx.fillStyle = "#F6E05E";
    ctx.font = `${14 * DPR}px 'Inter', sans-serif`;
    ctx.fillText("Resultado", legendX, legendY);
    
    ctx.restore();
  }
  
  function redrawAll() {
    clearCanvas();
    drawCartesianPlane();
    legendCount = 0;
    
    switch(currentMode) {
      case 'single':
        plotFunction(functions.primary, "#4FD1C5", "f(x)");
        break;
        
      case 'compare':
        plotFunction(functions.primary, "#4FD1C5", "f(x)");
        plotFunction(functions.secondary, "#FF6B6B", "g(x)");
        break;
        
      case 'operations':
        plotFunction(functions.primary, "#4FD1C5", "f(x)");
        plotFunction(functions.secondary, "#FF6B6B", "g(x)");
        if (currentOperation) {
          plotOperation(currentOperation);
        }
        break;
    }
  }

  document.querySelectorAll('.operation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentOperation = btn.dataset.op;
      redrawAll();
    });
  });
  
  // Zoom
  document.getElementById('zoomIn').addEventListener('click', () => {
    viewScale *= 1.2;
    redrawAll();
  });
  
  document.getElementById('zoomOut').addEventListener('click', () => {
    viewScale /= 1.2;
    redrawAll();
  });
  
  document.getElementById('resetView').addEventListener('click', () => {
    viewScale = 1;
    viewOffsetX = 0;
    viewOffsetY = 0;
    redrawAll();
  });
  
  // Arrastar
  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });
  
  window.addEventListener('mousemove', (e) => {
    if (dragging) {
      viewOffsetX += (e.clientX - lastX) * 2;
      viewOffsetY += (e.clientY - lastY) * 2;
      lastX = e.clientX;
      lastY = e.clientY;
      redrawAll();
    }
  });
  
  window.addEventListener('mouseup', () => {
    dragging = false;
    canvas.style.cursor = 'default';
  });
  
  // ==== INICIALIZAÇÃO ====
  generateFunctionControls('primary', 'polynomial', 'function-controls');
  analyzeFunction();
  redrawAll();
  updateExplanation('welcome', 'Bem-vindo ao Analisador de Funções! Comece selecionando um tipo de função e ajustando seus parâmetros.', 'Plano Cartesiano');
});