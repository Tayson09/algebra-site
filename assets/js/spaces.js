document.addEventListener('DOMContentLoaded', () => {
    // Estado da aplicação
    let vectors = [];
    let dimension = 3;
    
    // Elementos DOM
    const vectorsContainer = document.getElementById('vectorsContainer');
    const scalarsContainer = document.getElementById('scalarsContainer');
    const addVectorBtn = document.getElementById('addVectorBtn');
    const dimensionSelect = document.getElementById('dimension');
    const checkCombinationBtn = document.getElementById('checkCombination');
    const spaceResult = document.getElementById('spaceResult');
    const matrixDisplay = document.getElementById('matrixDisplay');
    const vectorDisplay = document.getElementById('vectorDisplay');
    const explanationPanel = document.createElement('div');
    explanationPanel.className = 'explanation-panel';
    explanationPanel.innerHTML = `
        <div class="explanation-content">
            <h3 id="explanationTitle">Informação</h3>
            <p id="explanationText"></p>
        </div>
    `;
    document.body.appendChild(explanationPanel);

    // Inicialização
    initVectorSpace();

    // Event Listeners
    addVectorBtn.addEventListener('click', addVector);
    dimensionSelect.addEventListener('change', () => {
        dimension = parseInt(dimensionSelect.value);
        updateAllVectors();
        updateScalars();
    });
    checkCombinationBtn.addEventListener('click', calculateLinearCombination);
    
    // Botões de operação
    document.querySelectorAll('.operation-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const operation = btn.dataset.operation;
            performVectorOperation(operation);
        });
    });

    // Info icons
    document.querySelectorAll('.info-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const infoType = e.target.dataset.info;
            showExplanation(infoType);
        });
    });

    // Funções de inicialização
    function initVectorSpace() {
        // Adiciona dois vetores iniciais
        addVector();
        addVector();
    }

    function addVector() {
        const vectorId = vectors.length;
        const vector = {
            id: vectorId,
            coords: new Array(dimension).fill(0)
        };
        vectors.push(vector);
        renderVector(vector);
        updateScalars();
    }

    function renderVector(vector) {
        const vectorGroup = document.createElement('div');
        vectorGroup.className = 'vector-input-group';
        vectorGroup.id = `vector-${vector.id}`;
        
        let coordsHTML = '';
        vector.coords.forEach((coord, index) => {
            coordsHTML += `
                <input type="number" class="coord-input" data-vector="${vector.id}" data-index="${index}" 
                       value="${coord}" step="any">
            `;
        });
        
        vectorGroup.innerHTML = `
            <span class="vector-label">v${vector.id + 1}</span>
            <div class="vector-coords">
                ${coordsHTML}
            </div>
            <button class="remove-vector-btn" data-vector="${vector.id}">×</button>
        `;
        
        vectorsContainer.appendChild(vectorGroup);
        
        // Event listeners para os inputs
        vectorGroup.querySelectorAll('.coord-input').forEach(input => {
            input.addEventListener('input', updateVectorCoord);
        });
        
        // Event listener para remover vetor
        vectorGroup.querySelector('.remove-vector-btn').addEventListener('click', removeVector);
    }

    function updateVectorCoord(e) {
        const vectorId = parseInt(e.target.dataset.vector);
        const coordIndex = parseInt(e.target.dataset.index);
        const value = parseFloat(e.target.value) || 0;
        
        vectors = vectors.map(v => {
            if (v.id === vectorId) {
                const newCoords = [...v.coords];
                newCoords[coordIndex] = value;
                return {...v, coords: newCoords};
            }
            return v;
        });
    }

    function removeVector(e) {
        const vectorId = parseInt(e.target.dataset.vector);
        vectors = vectors.filter(v => v.id !== vectorId);
        
        // Reindexar
        vectors = vectors.map((v, index) => ({...v, id: index}));
        
        // Atualizar UI
        vectorsContainer.innerHTML = '';
        vectors.forEach(renderVector);
        updateScalars();
    }

    function updateAllVectors() {
        vectors = vectors.map(vector => {
            const currentCoords = [...vector.coords];
            // Ajustar o tamanho do vetor para a nova dimensão
            const newCoords = new Array(dimension).fill(0).map((_, i) => {
                return i < currentCoords.length ? currentCoords[i] : 0;
            });
            return {...vector, coords: newCoords};
        });
        
        // Atualizar UI
        vectorsContainer.innerHTML = '';
        vectors.forEach(renderVector);
    }

    function updateScalars() {
        scalarsContainer.innerHTML = '';
        vectors.forEach((vector, index) => {
            const scalarGroup = document.createElement('div');
            scalarGroup.className = 'scalar-input-group';
            scalarGroup.innerHTML = `
                <label for="scalar-${index}">a<sub>${index + 1}</sub></label>
                <input type="number" id="scalar-${index}" class="scalar-input" 
                       data-vector="${vector.id}" value="${index === 0 ? 1 : 0}" step="any">
            `;
            scalarsContainer.appendChild(scalarGroup);
        });
    }

    function calculateLinearCombination() {
        // Obter escalares
        const scalars = Array.from(scalarsContainer.querySelectorAll('.scalar-input')).map(input => {
            return parseFloat(input.value) || 0;
        });
        
        // Verificar se temos escalares para todos os vetores
        if (scalars.length !== vectors.length) {
            showResult("Número de escalares não corresponde ao número de vetores");
            return;
        }
        
        // Calcular combinação linear
        const resultVector = new Array(dimension).fill(0);
        
        vectors.forEach((vector, index) => {
            const scalar = scalars[index];
            vector.coords.forEach((coord, coordIndex) => {
                resultVector[coordIndex] += scalar * coord;
            });
        });
        
        // Exibir resultado
        vectorDisplay.innerHTML = `
            <h4>Combinação Linear:</h4>
            <p>v = ${scalars.map((s, i) => `${s}·v${i+1}`).join(' + ')}</p>
            <p>v = (${resultVector.join(', ')})</p>
        `;
        
        showResult("Combinação linear calculada com sucesso!");
    }

    function performVectorOperation(operation) {
        if (vectors.length === 0) {
            showResult("Adicione pelo menos um vetor");
            return;
        }
        
        switch(operation) {
            case 'independence':
                checkLinearIndependence();
                break;
            case 'basis':
                checkBasis();
                break;
            case 'subspace':
                testSubspace();
                break;
            case 'span':
                calculateSpan();
                break;
        }
    }

    function checkLinearIndependence() {
        // Construir matriz (cada vetor é uma coluna)
        const matrix = [];
        for (let i = 0; i < dimension; i++) {
            matrix.push([]);
            for (let j = 0; j < vectors.length; j++) {
                matrix[i].push(vectors[j].coords[i]);
            }
        }
        
        // Reduzir a matriz à forma escalonada
        const rrefMatrix = rref(matrix);
        const rank = getMatrixRank(rrefMatrix);
        
        // Exibir matriz
        displayMatrix(rrefMatrix, "Matriz na Forma Escalonada:");
        
        // Determinar LI/LD
        if (rank === vectors.length) {
            showResult("Os vetores são Linearmente Independentes (LI)");
        } else {
            showResult(`Os vetores são Linearmente Dependentes (LD). Posto: ${rank}`);
        }
    }

    function checkBasis() {
        if (vectors.length !== dimension) {
            showResult(`Para ser base, precisamos de ${dimension} vetores em ${dimension}D`);
            return;
        }
        
        // Construir matriz (cada vetor é uma coluna)
        const matrix = [];
        for (let i = 0; i < dimension; i++) {
            matrix.push([]);
            for (let j = 0; j < vectors.length; j++) {
                matrix[i].push(vectors[j].coords[i]);
            }
        }
        
        // Calcular determinante
        const det = determinant(matrix);
        
        // Exibir matriz
        displayMatrix(matrix, "Matriz dos Vetores:");
        vectorDisplay.innerHTML = `<p>Determinante = ${det.toFixed(2)}</p>`;
        
        if (det !== 0) {
            showResult("Os vetores formam uma base do espaço");
        } else {
            showResult("Os vetores NÃO formam uma base do espaço");
        }
    }

    function testSubspace() {
        // Verificar se o vetor nulo está no conjunto
        const hasZeroVector = vectors.some(v => 
            v.coords.every(coord => coord === 0)
        );
        
        if (!hasZeroVector) {
            showResult("O subespaço deve conter o vetor nulo");
            return;
        }
        
        // Verificar fechamento por adição (simplificado)
        if (vectors.length < 2) {
            showResult("Adicione pelo menos dois vetores para testar");
            return;
        }
        
        // Somar os dois primeiros vetores
        const sumVector = new Array(dimension).fill(0);
        vectors[0].coords.forEach((coord, i) => {
            sumVector[i] = coord + vectors[1].coords[i];
        });
        
        // Verificar se a soma está no espaço (simplificado)
        const sumInSpace = vectors.some(v => 
            v.coords.every((coord, i) => Math.abs(coord - sumVector[i]) < 0.001)
        );
        
        showResult(sumInSpace ? 
            "O conjunto pode ser um subespaço (teste simplificado)" :
            "O conjunto NÃO é um subespaço (falha no fechamento por adição)"
        );
    }

    function calculateSpan() {
        if (vectors.length === 0) {
            showResult("Adicione vetores para calcular o espaço gerado");
            return;
        }
        
        // Construir matriz (cada vetor é uma coluna)
        const matrix = [];
        for (let i = 0; i < dimension; i++) {
            matrix.push([]);
            for (let j = 0; j < vectors.length; j++) {
                matrix[i].push(vectors[j].coords[i]);
            }
        }
        
        // Reduzir a matriz à forma escalonada
        const rrefMatrix = rref(matrix);
        const rank = getMatrixRank(rrefMatrix);
        
        // Exibir matriz
        displayMatrix(rrefMatrix, "Matriz Escalonada:");
        
        // Base do espaço gerado
        const basis = [];
        for (let j = 0; j < vectors.length; j++) {
            if (rrefMatrix.some(row => row[j] !== 0)) {
                basis.push(vectors[j]);
            }
        }
        
        // Exibir base
        const basisHtml = basis.map((v, i) => 
            `<p>b<sub>${i+1}</sub> = (${v.coords.join(', ')})</p>`
        ).join('');
        
        vectorDisplay.innerHTML = `
            <h4>Espaço Gerado:</h4>
            <p>Dimensão: ${rank}</p>
            <h5>Base:</h5>
            ${basisHtml}
        `;
        
        showResult(`O espaço gerado tem dimensão ${rank}`);
    }

    // Funções matemáticas
    function rref(matrix) {
        const mat = matrix.map(row => [...row]);
        let lead = 0;
        const rowCount = mat.length;
        const colCount = mat[0].length;
        
        for (let r = 0; r < rowCount; r++) {
            if (colCount <= lead) return mat;
            
            let i = r;
            while (mat[i][lead] === 0) {
                i++;
                if (rowCount === i) {
                    i = r;
                    lead++;
                    if (colCount === lead) return mat;
                }
            }
            
            // Swap rows i and r
            [mat[i], mat[r]] = [mat[r], mat[i]];
            
            // Normalize
            const val = mat[r][lead];
            for (let j = 0; j < colCount; j++) {
                mat[r][j] /= val;
            }
            
            // Eliminate
            for (let i = 0; i < rowCount; i++) {
                if (i === r) continue;
                const factor = mat[i][lead];
                for (let j = 0; j < colCount; j++) {
                    mat[i][j] -= factor * mat[r][j];
                }
            }
            
            lead++;
        }
        return mat;
    }

    function getMatrixRank(matrix) {
        let rank = 0;
        for (let i = 0; i < matrix.length; i++) {
            if (matrix[i].some(val => Math.abs(val) > 1e-6)) {
                rank++;
            }
        }
        return rank;
    }

    function determinant(matrix) {
        if (matrix.length !== matrix[0].length) return 0;
        if (matrix.length === 2) {
            return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        }
        
        let det = 0;
        for (let i = 0; i < matrix.length; i++) {
            const minor = [];
            for (let j = 1; j < matrix.length; j++) {
                minor.push(matrix[j].filter((_, k) => k !== i));
            }
            det += matrix[0][i] * determinant(minor) * (i % 2 === 0 ? 1 : -1);
        }
        return det;
    }

    function displayMatrix(matrix, title) {
        let matrixText = title + '\n';
        matrix.forEach(row => {
            matrixText += '| ' + row.map(val => val.toFixed(2).padStart(6)).join(' ') + ' |\n';
        });
        matrixDisplay.textContent = matrixText;
    }

    function showResult(message) {
        spaceResult.textContent = message;
    }

    function showExplanation(infoType) {
        const titleElement = explanationPanel.querySelector('#explanationTitle');
        const textElement = explanationPanel.querySelector('#explanationText');
        
        const explanations = {
            'vectors-info': {
                title: 'Vetores do Espaço',
                text: 'Defina os vetores que compõem seu espaço vetorial. Cada vetor deve ter coordenadas numéricas. Você pode adicionar ou remover vetores conforme necessário.'
            },
            'linear-combination-info': {
                title: 'Combinação Linear',
                text: 'Uma combinação linear é uma soma de vetores multiplicados por escalares. Aqui você pode calcular combinações lineares dos vetores definidos.'
            },
            'independence-info': {
                title: 'Independência Linear',
                text: 'Vetores são Linearmente Independentes (LI) se nenhum deles pode ser escrito como combinação linear dos outros. Caso contrário, são Linearmente Dependentes (LD).'
            },
            'basis-info': {
                title: 'Base do Espaço',
                text: 'Uma base é um conjunto de vetores LI que geram todo o espaço vetorial. O número de vetores na base é a dimensão do espaço.'
            },
            'subspace-info': {
                title: 'Subespaço Vetorial',
                text: 'Um subespaço é um subconjunto de um espaço vetorial que é fechado para as operações de adição e multiplicação por escalar.'
            }
        };
        
        if (explanations[infoType]) {
            titleElement.textContent = explanations[infoType].title;
            textElement.textContent = explanations[infoType].text;
            explanationPanel.style.display = 'block';
            
            // Esconder após 10 segundos
            setTimeout(() => {
                explanationPanel.style.display = 'none';
            }, 10000);
        }
    }

    // Fechar painel de explicação ao clicar fora
    document.addEventListener('click', (e) => {
        if (!explanationPanel.contains(e.target) && 
            !e.target.classList.contains('info-icon')) {
            explanationPanel.style.display = 'none';
        }
    });
});