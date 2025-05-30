let currentDegree = 2;
let chart = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeDegreeButtons();
    generateCoefficientInputs(currentDegree);
    document.querySelector('.generate-btn').addEventListener('click', generateGraph);
});

function initializeDegreeButtons() {
    document.querySelectorAll('.degree-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.degree-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDegree = parseInt(btn.dataset.degree);
            generateCoefficientInputs(currentDegree);
        });
    });
}

function generateCoefficientInputs(degree) {
    const form = document.getElementById('coefficientsForm');
    form.innerHTML = '';

    for(let i = degree; i >= 0; i--) {
        const label = i === 0 ? 'Termo Independente' : 
                     `Coeficiente x${i > 1 ? `<sup>${i}</sup>` : ''}`;
        
        const inputGroup = document.createElement('div');
        inputGroup.className = 'coefficient-group';
        inputGroup.innerHTML = `
            <label class="coefficient-label">${label}</label>
            <input type="number" step="any" class="coefficient-input" 
                   placeholder="Ex: ${i === 0 ? '5' : '0.5'}" required>
        `;
        form.appendChild(inputGroup);
    }
}

function generateGraph() {
    const coefficients = Array.from(document.querySelectorAll('.coefficient-input'))
                             .map(input => parseFloat(input.value));

    if(coefficients.some(isNaN)) {
        alert('Por favor, preencha todos os coeficientes corretamente!');
        return;
    }

    // Gerar função matemática
    const functionExpression = coefficients
        .map((coef, index) => {
            const exp = currentDegree - index;
            return exp === 0 ? `${coef}` : `${coef}*x^${exp}`;
        })
        .join(' + ');

    // Calcular pontos
    const labels = [];
    const data = [];
    for(let x = -10; x <= 10; x += 0.25) {
        const y = coefficients.reduce((acc, coef, index) => {
            return acc + coef * Math.pow(x, currentDegree - index);
        }, 0);
        labels.push(x.toFixed(2));
        data.push(y);
    }

    // Configurar gráfico
    const ctx = document.getElementById('functionChart').getContext('2d');
    
    if(chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `f(x) = ${functionExpression}`,
                data: data,
                borderColor: '#7f7fd5',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Eixo X',
                        color: '#ffffff'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#ffffff' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Eixo Y',
                        color: '#ffffff'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#ffffff' }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 14 }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy'
                    }
                }
            }
        }
    });
}