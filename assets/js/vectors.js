document.addEventListener("DOMContentLoaded", () => {
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

  // Adicionar eventos aos botões "+" de cada vetor
  document.querySelectorAll(".add-component").forEach(button => {
    button.addEventListener("click", () => {
      const vectorId = button.dataset.vector;
      addComponent(vectorId);
    });
  });

  // Adicionar eventos aos botões de operação
  document.querySelectorAll(".vector-btn").forEach(button => {
    button.addEventListener("click", () => {
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
        default:
          result = "Operação inválida";
      }

      if (Array.isArray(result)) {
        showResult(`[${result.join(", ")}]`);
      } else {
        showResult(result);
      }
    });
  });
});
