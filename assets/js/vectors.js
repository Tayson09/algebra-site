// ===============================
// 1) Funções de cálculo
// ===============================
const vectorNorm = (v) => {
  return Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));
};

const vectorAngle = (v1, v2) => {
  const dot = v1.reduce((acc, val, i) => acc + val * (v2[i] || 0), 0);
  const norm1 = vectorNorm(v1);
  const norm2 = vectorNorm(v2);
  if (norm1 === 0 || norm2 === 0) return 0;
  const cosTheta = dot / (norm1 * norm2);
  return (Math.acos(Math.min(Math.max(cosTheta, -1), 1)) * 180 / Math.PI);
};

const vectorProjection = (v1, v2) => {
  const dot = v1.reduce((acc, val, i) => acc + val * (v2[i] || 0), 0);
  const norm2 = vectorNorm(v2);
  if (norm2 === 0) return v1.map(() => 0);
  const scalar = dot / (norm2 * norm2);
  return v2.map(val => val * scalar);
};

const addVectors = (v1, v2) => {
  if (v1.length !== v2.length) return "Vetores de tamanhos diferentes!";
  return v1.map((val, i) => val + v2[i]);
};

const dotProduct = (v1, v2) => {
  if (v1.length !== v2.length) return "Vetores de tamanhos diferentes!";
  return v1.reduce((acc, val, i) => acc + val * v2[i], 0);
};

const crossProduct = (v1, v2) => {
  if (v1.length !== 3 || v2.length !== 3) return "Produto vetorial só é definido em ℝ³!";
  const [a1, a2, a3] = v1;
  const [b1, b2, b3] = v2;
  return [
    a2 * b3 - a3 * b2,
    a3 * b1 - a1 * b3,
    a1 * b2 - a2 * b1
  ];
};

// ===============================
// 2) Funções de manipulação de DOM
// ===============================
const createInput = () => {
  const wrapper = document.createElement("div");
  wrapper.classList.add("component-wrapper");

  const input = document.createElement("input");
  input.type = "number";
  input.classList.add("vector-component");

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.classList.add("remove-component");
  removeBtn.textContent = "×";
  removeBtn.title = "Remover componente";

  removeBtn.addEventListener("click", () => {
    wrapper.remove();
    // Ao remover um componente, redesenha os vetores
    setTimeout(renderVectors, 100);
  });

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);

  return wrapper;
};

const addComponent = (vectorId) => {
  const vectorGroup = document.querySelector(`#vector${vectorId} .components`);
  if (vectorGroup) {
    const input = createInput();
    vectorGroup.appendChild(input);
    // Ao adicionar um componente, redesenha os vetores
    setTimeout(renderVectors, 100);
  }
};

const getVectorValues = (vectorId) => {
  const inputs = document.querySelectorAll(`#vector${vectorId} .vector-component`);
  return Array.from(inputs).map(input => parseFloat(input.value) || 0);
};

const showResult = (text) => {
  const resultBox = document.getElementById("vectorResult");
  if (resultBox) resultBox.textContent = text;
};

const loadVector = (vectorId, components) => {
  const vectorGroup = document.querySelector(`#vector${vectorId} .components`);
  if (vectorGroup) {
    vectorGroup.innerHTML = '';
    components.forEach((val) => {
      const wrapper = createInput();
      // o createInput() gera algo como <div><input class="vector-component"><button>×</button></div>
      // precisamos setar o valor dentro do <input> que está no wrapper
      const inputField = wrapper.querySelector("input.vector-component");
      if (inputField) inputField.value = val;
      vectorGroup.appendChild(wrapper);
    });
    renderVectors();
  }
};

const addToHistory = (operation, result) => {
  const historyList = document.getElementById('history-list');
  const opNames = {
    add: "Soma de Vetores",
    dot: "Produto Escalar",
    cross: "Produto Vetorial",
    norm: "Cálculo de Norma",
    angle: "Cálculo de Ângulo",
    projection: "Projeção Vetorial",
    save: "Salvar Vetores",
    load: "Carregar Vetores"
  };

  const historyItem = document.createElement('div');
  historyItem.className = 'history-item';
  historyItem.innerHTML = `
    <div><strong>${opNames[operation] || operation}</strong></div>
    <div>${result}</div>
    <div class="history-time">${new Date().toLocaleTimeString()}</div>
  `;

  historyList.prepend(historyItem);
};

// ===============================
// 3) Função principal de renderização
// ===============================
function renderVectors() {
  const container = document.getElementById('vector-viz');
  if (!container) return;
  container.innerHTML = '';

  const v1 = getVectorValues(1);
  const v2 = getVectorValues(2);

  // Dimensões do container
  const width = container.clientWidth;
  const height = container.clientHeight;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 6;

  // Desenhar eixos
  const drawAxis = (x1, y1, x2, y2, label) => {
    const axis = document.createElement('div');
    axis.className = 'vector-line';
    axis.style.left = `${x1}px`;
    axis.style.top = `${y1}px`;
    axis.style.width = `${Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)}px`;
    axis.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
    axis.style.background = 'rgba(255, 255, 255, 0.3)';
    container.appendChild(axis);

    const axisLabel = document.createElement('div');
    axisLabel.className = 'vector-label';
    axisLabel.style.left = `${x2 + 5}px`;
    axisLabel.style.top = `${y2 - 10}px`;
    axisLabel.textContent = label;
    container.appendChild(axisLabel);
  };

  // Eixos X, Y, Z
  drawAxis(centerX, centerY, centerX + scale * 2.5, centerY, 'X');
  drawAxis(centerX, centerY, centerX, centerY - scale * 2.5, 'Y');
  drawAxis(centerX, centerY, centerX - scale * 1.2, centerY + scale * 1.2, 'Z');

  // Função para desenhar um vetor
  const drawVector = (v, color, label) => {
    if (v.length < 2) return;

    // Converter para coordenadas de tela
    const x = centerX + v[0] * scale;
    const y = centerY - v[1] * scale;

    // Linha do vetor
    const line = document.createElement('div');
    line.className = 'vector-line';
    line.style.left = `${centerX}px`;
    line.style.top = `${centerY}px`;
    line.style.width = `${Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)}px`;
    line.style.transform = `rotate(${Math.atan2(centerY - y, x - centerX)}rad)`;
    line.style.background = color;
    container.appendChild(line);

    // Seta
    const arrow = document.createElement('div');
    arrow.className = 'vector-arrow';
    const arrowSize = 8;
    arrow.style.borderWidth = `0 ${arrowSize}px ${arrowSize}px 0`;
    arrow.style.borderColor = `transparent ${color} transparent transparent`;
    arrow.style.left = `${x - arrowSize}px`;
    arrow.style.top = `${y - arrowSize / 2}px`;
    arrow.style.transform = `rotate(${Math.atan2(centerY - y, x - centerX) - Math.PI / 4}rad)`;
    container.appendChild(arrow);

    // Label
    const vectorLabel = document.createElement('div');
    vectorLabel.className = 'vector-label';
    vectorLabel.style.left = `${x + 5}px`;
    vectorLabel.style.top = `${y - 10}px`;
    vectorLabel.textContent = label;
    vectorLabel.style.color = color;
    container.appendChild(vectorLabel);

    // Info tooltip
    const vectorInfo = document.createElement('div');
    vectorInfo.className = 'vector-info';
    vectorInfo.textContent = `${label}: [${v.map(n => n.toFixed(2)).join(', ')}]`;
    vectorInfo.style.left = `${x + 10}px`;
    vectorInfo.style.top = `${y + 10}px`;
    vectorInfo.style.display = 'none';
    container.appendChild(vectorInfo);

    // Evento para mostrar info
    line.addEventListener('mouseenter', () => {
      vectorInfo.style.display = 'block';
    });

    line.addEventListener('mouseleave', () => {
      vectorInfo.style.display = 'none';
    });
  };

  // Desenhar vetores V1 e V2
  if (v1.length >= 2 && v1.some(val => val !== 0)) {
    drawVector(v1, '#7f7fd5', 'V1');
  }
  if (v2.length >= 2 && v2.some(val => val !== 0)) {
    drawVector(v2, '#86a8e7', 'V2');
  }

  // Desenhar resultado (caso já exista texto em #vectorResult no formato "[x, y, ...]")
  const resultBox = document.getElementById('vectorResult');
  if (resultBox && resultBox.textContent && resultBox.textContent.startsWith('[')) {
    const resultText = resultBox.textContent.replace(/[\[\]]/g, '');
    const resultValues = resultText.split(',').map(parseFloat);
    if (resultValues.length >= 2 && resultValues.some(val => val !== 0)) {
      drawVector(resultValues, '#91eae4', 'Resultado');
    }
  }

  // Atualizar propriedades numéricas abaixo do gráfico
  document.getElementById('norm-v1').textContent = vectorNorm(v1).toFixed(2);
  document.getElementById('norm-v2').textContent = vectorNorm(v2).toFixed(2);
  document.getElementById('angle-value').textContent = vectorAngle(v1, v2).toFixed(2) + '°';
  document.getElementById('dot-value').textContent = dotProduct(v1, v2);
}

// ===============================
// 4) Configuração dos eventos após o carregamento do DOM
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // ---- 4.1) Botões "+" para adicionar componentes dinamicamente ----
  document.querySelectorAll(".add-component").forEach(button => {
    button.addEventListener("click", () => {
      const vectorId = button.dataset.vector; // deve ser "1" ou "2"
      addComponent(vectorId);
    });
  });

  // ---- 4.2) Botões de operação (somar, dot, cross, norm, angle, projection, save, load) ----
  const originalButtonHandler = (button) => {
    const op = button.dataset.operation;
    const v1 = getVectorValues(1);
    const v2 = getVectorValues(2);

    let result;
    switch (op) {
      case "add":
        result = addVectors(v1, v2);
        break;
      case "dot":
        result = dotProduct(v1, v2);
        break;
      case "cross":
        result = crossProduct(v1, v2);
        break;
      case "norm":
        result = `Norma V1: ${vectorNorm(v1).toFixed(2)} | V2: ${vectorNorm(v2).toFixed(2)}`;
        break;
      case "angle":
        result = `Ângulo: ${vectorAngle(v1, v2).toFixed(2)}°`;
        break;
      case "projection":
        result = `Projeção: [${vectorProjection(v1, v2).map(n => n.toFixed(2)).join(', ')}]`;
        break;
      case "save":
        localStorage.setItem('vector1', JSON.stringify(v1));
        localStorage.setItem('vector2', JSON.stringify(v2));
        result = "Vetores salvos com sucesso!";
        break;
      case "load":
        const savedV1 = JSON.parse(localStorage.getItem('vector1') || "[]");
        const savedV2 = JSON.parse(localStorage.getItem('vector2') || "[]");
        loadVector(1, savedV1);
        loadVector(2, savedV2);
        result = "Vetores carregados com sucesso!";
        break;
      default:
        result = "Operação inválida";
    }

    if (result !== undefined) {
      if (Array.isArray(result)) {
        showResult(`[${result.join(", ")}]`);
      } else {
        showResult(result);
      }
      addToHistory(op, result);
      // Após operação, redesenha vetores (por exemplo, se load alterou inputs)
      setTimeout(renderVectors, 100);
    }
  };

  document.querySelectorAll(".vector-btn").forEach(button => {
    button.addEventListener("click", () => originalButtonHandler(button));
  });

  // ---- 4.3) Botões "Limpar" para cada vetor ----
  document.querySelectorAll('.vector-action-btn').forEach(button => {
    button.addEventListener('click', () => {
      const vectorId = button.dataset.vector; // "1" ou "2"
      const vectorGroup = document.querySelector(`#vector${vectorId} .components`);
      if (vectorGroup) {
        vectorGroup.innerHTML = '';
        renderVectors();
      }
    });
  });

  // ---- 4.4) Botão de rotação do container 3D ----
  const rotateBtn = document.getElementById('rotate-btn');
  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      const viz = document.getElementById('vector-viz');
      if (viz) {
        viz.style.transform = viz.style.transform === 'rotateY(30deg)'
          ? 'rotateY(60deg)'
          : 'rotateY(30deg)';
      }
    });
  }

  // ---- 4.5) Eventos de 'input' em cada componente de vetor (para redesenhar em tempo real) ----
  document.querySelectorAll('.vector-component').forEach(input => {
    input.addEventListener('input', () => {
      setTimeout(renderVectors, 100);
    });
  });

  // ---- 4.6) Renderização inicial ----
  renderVectors();
});
