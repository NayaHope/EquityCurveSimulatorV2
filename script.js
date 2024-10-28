let chart;

function calculateMetrics(equity) {
    const returns = [];
    for (let i = 1; i < equity.length; i++) {
        returns.push((equity[i] - equity[i-1]) / equity[i-1]);
    }
    
    const maxDrawdown = calculateMaxDrawdown(equity);
    const sharpeRatio = calculateSharpeRatio(returns);
    const profitFactor = calculateProfitFactor(returns);
    const totalReturn = ((equity[equity.length - 1] - equity[0]) / equity[0]) * 100;
    const averageReturn = returns.reduce((a, b) => a + b, 0) / returns.length * 100;
    const volatility = calculateVolatility(returns) * 100;
    
    return {
        maxDrawdown,
        sharpeRatio,
        profitFactor,
        totalReturn,
        averageReturn,
        volatility
    };
}

function calculateMaxDrawdown(equity) {
    let maxDrawdown = 0;
    let peak = equity[0];
    
    for (let i =1 < equity.length; i++) {
        if (equity[i] > peak) {
            peak = equity[i];
        }
        const drawdown = (peak - equity[i]) / peak * 100;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
}

function calculateSharpeRatio(returns) {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return mean / stdDev * Math.sqrt(252); // Annualized
}

function calculateProfitFactor(returns) {
    const gains = returns.filter(r => r > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0));
    return gains / losses;
}

function calculateVolatility(returns) {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

function runSimulation() {
    const params = getParams();
    if (!params) return;
    
    const simulationData = generateSimulations(params);
    renderChart(simulationData);
    displayStats(simulationData);
    renderTable(simulationData);
}

function getParams() {
    return {
        startingEquity: parseFloat(document.getElementById('startingEquity').value),
        numTrades: parseInt(document.getElementById('numTrades').value),
        numSimulations: parseInt(document.getElementById('numSimulations').value),
        winRate: parseFloat(document.getElementById('winRate').value) / 100,
        rewardRisk: parseFloat(document.getElementById('rewardRisk').value),
        riskType: document.getElementById('riskType').value,
        riskSize: parseFloat(document.getElementById('riskSize').value) / 100,
        useMartingale: document.getElementById('useMartingale').checked,
        martingaleMultiplier: parseFloat(document.getElementById('martingaleMultiplier').value),
        martingaleReset: parseInt(document.getElementById('martingaleReset').value)
    };
}
function generateSimulations(params) {
    const results = [];
    for (let sim = 0; sim < params.numSimulations; sim++) {
        let equity = params.startingEquity;
        const trades = [equity];
        let consecutiveLosses = 0;
        let currentRisk = params.riskType === 'fixed' ? params.riskSize * equity : params.startingEquity * params.riskSize;

        for (let trade = 0; trade < params.numTrades; trade++) {
            const isWin = Math.random() < params.winRate;
            const reward = isWin ? currentRisk * params.rewardRisk : -currentRisk;
            equity += reward;
            trades.push(equity);

            if (isWin) {
                consecutiveLosses = 0;
                currentRisk = params.riskType === 'fixed' ? params.riskSize * equity : equity * params.riskSize;
            } else {
                consecutiveLosses++;
                if (params.useMartingale && consecutiveLosses % params.martingaleReset === 0) {
                    currentRisk *= params.martingaleMultiplier;
                }
            }
        }
        results.push(trades);
    }
    return results;
}

function renderChart(simulationData) {
    const chartData = {
        labels: Array.from({ length: simulationData[0].length }, (_, i) => i),
        datasets: simulationData.map((data, index) => ({
            label: `Simulation ${index + 1}`,
            data: data,
            borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
            borderWidth: 1,
            fill: false,
            tension: 0.1
        }))
    };

    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('equityChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Trade Number'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Equity'
                    }
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            }
        }
    });
}
function displayStats(simulationData) {
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = '';

    const allMetrics = simulationData.map(data => calculateMetrics(data));
    
    const metrics = {
        'Final Equity': simulationData.map(data => data[data.length - 1]),
        'Total Return (%)': allMetrics.map(m => m.totalReturn),
        'Max Drawdown (%)': allMetrics.map(m => m.maxDrawdown),
        'Sharpe Ratio': allMetrics.map(m => m.sharpeRatio),
        'Profit Factor': allMetrics.map(m => m.profitFactor),
        'Volatility (%)': allMetrics.map(m => m.volatility)
    };

    Object.entries(metrics).forEach(([label, values]) => {
        const average = values.reduce((a, b) => a + b) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-label">${label}</div>
            <div class="stat-value">
                Avg: ${average.toFixed(2)}<br>
                Min: ${min.toFixed(2)}<br>
                Max: ${max.toFixed(2)}
            </div>
        `;
        statsContainer.appendChild(card);
    });
}

function renderTable(simulationData) {
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = '';

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Simulation</th>
        <th>Final Equity</th>
        <th>Total Return (%)</th>
        <th>Max Drawdown (%)</th>
        <th>Sharpe Ratio</th>
        <th>Profit Factor</th>
        <th>Volatility (%)</th>
    `;
    table.appendChild(headerRow);

    simulationData.forEach((data, index) => {
        const metrics = calculateMetrics(data);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${data[data.length - 1].toFixed(2)}</td>
            <td>${metrics.totalReturn.toFixed(2)}</td>
            <td>${metrics.maxDrawdown.toFixed(2)}</td>
            <td>${metrics.sharpeRatio.toFixed(2)}</td>
            <td>${metrics.profitFactor.toFixed(2)}</td>
            <td>${metrics.volatility.toFixed(2)}</td>
        `;
        table.appendChild(row);
    });

    tableContainer.appendChild(table);
}

function toggleDarkTheme() {
    const isDarkTheme = document.getElementById('darkThemeToggle').checked;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    
    if (chart) {
        chart.options.plugins.legend.labels.color = isDarkTheme ? '#87CEEB' : '#000000';
        chart.options.scales.x.grid.color = isDarkTheme ? '#333333' : '#E2E8F0';
        chart.options.scales.y.grid.color = isDarkTheme ? '#333333' : '#E2E8F0';
        chart.options.scales.x.ticks.color = isDarkTheme ? '#87CEEB' : '#000000';
        chart.options.scales.y.ticks.color = isDarkTheme ? '#87CEEB' : '#000000';
        chart.update();
    }
}
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let currentY = margin;

    // Title
    doc.setFontSize(16);
    doc.text("Equity Curve Simulation Report", margin, currentY);
    currentY += 15;

    // Parameters Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Simulation Parameters", margin, currentY);
    doc.setFont(undefined, 'normal');
    currentY += 10;

    const params = getParams();
    const paramsList = [
        `Starting Equity: ${params.startingEquity.toLocaleString()}`,
        `Number of Trades: ${params.numTrades}`,
        `Number of Simulations: ${params.numSimulations}`,
        `Win Rate: ${(params.winRate * 100).toFixed(1)}%`,
        `Reward/Risk Ratio: ${params.rewardRisk}`,
        `Risk Type: ${params.riskType}`,
        `Risk Size: ${(params.riskSize * 100).toFixed(1)}%`
    ];

    paramsList.forEach(param => {
        if (currentY > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }
        doc.text(param, margin, currentY);
        currentY += 7;
    });
    currentY += 10;

    // Chart Section
    if (currentY > pageHeight - 120) {
        doc.addPage();
        currentY = margin;
    }
    doc.setFont(undefined, 'bold');
    doc.text("Equity Curves", margin, currentY);
    currentY += 10;

    const chartImg = document.getElementById('equityChart').toDataURL('image/png');
    doc.addImage(chartImg, 'PNG', margin, currentY, pageWidth - 2 * margin, 80);
    currentY += 90;

    // Summary Statistics
    doc.addPage();
    currentY = margin;
    doc.setFont(undefined, 'bold');
    doc.text("Summary Statistics", margin, currentY);
    currentY += 10;
    doc.setFont(undefined, 'normal');

    const statsContainer = document.getElementById('statsContainer');
    const statCards = statsContainer.getElementsByClassName('stat-card');
    Array.from(statCards).forEach(card => {
        if (currentY > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }
        const label = card.querySelector('.stat-label').textContent;
        const value = card.querySelector('.stat-value').textContent;
        doc.text(`${label}:`, margin, currentY);
        currentY += 7;
        value.split('\n').forEach(line => {
            doc.text(line.trim(), margin + 10, currentY);
            currentY += 7;
        });
        currentY += 3;
    });

    // Detailed Results Table
    doc.addPage();
    currentY = margin;
    doc.setFont(undefined, 'bold');
    doc.text("Detailed Simulation Results", margin, currentY);
    currentY += 10;

    const table = document.getElementById('tableContainer').querySelector('table');
    const headers = Array.from(table.getElementsByTagName('th')).map(th => th.textContent);
    const rows = Array.from(table.getElementsByTagName('tr')).slice(1)
        .map(row => Array.from(row.getElementsByTagName('td')).map(td => td.textContent));

    // Table headers
    doc.setFontSize(10);
    const colWidths = headers.map(header => 25);
    headers.forEach((header, i) => {
        doc.text(header, margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY);
    });
    currentY += 7;

    // Table rows
    doc.setFont(undefined, 'normal');
    rows.forEach(row => {
        if (currentY > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
            // Repeat headers on new page
            doc.setFont(undefined, 'bold');
            headers.forEach((header, i) => {
                doc.text(header, margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY);
            });
            currentY += 7;
            doc.setFont(undefined, 'normal');
        }
        row.forEach((cell, i) => {
            doc.text(cell, margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY);
        });
        currentY += 7;
    });

    doc.save("simulation_report.pdf");
}

function exportToExcel() {
    try {
        const workbook = XLSX.utils.book_new();

        // Parameters sheet
        const params = getParams();
        const paramsData = [
            ["Parameter", "Value"],
            ["Starting Equity", params.startingEquity],
            ["Number of Trades", params.numTrades],
            ["Number of Simulations", params.numSimulations],
            ["Win Rate", `${(params.winRate * 100).toFixed(1)}%`],
            ["Reward/Risk Ratio", params.rewardRisk],
            ["Risk Type", params.riskType],
            ["Risk Size", `${(params.riskSize * 100).toFixed(1)}%`],
            ["Use Martingale", params.useMartingale ? 'Yes' : 'No'],
            ["Martingale Multiplier", params.martingaleMultiplier],
            ["Martingale Reset", params.martingaleReset]
        ];
        const paramsSheet = XLSX.utils.aoa_to_sheet(paramsData);
        XLSX.utils.book_append_sheet(workbook, paramsSheet, "Parameters");

        // Summary Statistics sheet
        const statsContainer = document.getElementById('statsContainer');
        const statCards = statsContainer.getElementsByClassName('stat-card');
        const summaryData = [["Metric", "Average", "Minimum", "Maximum"]];
        Array.from(statCards).forEach(card => {
            const metric = card.querySelector('.stat-label').textContent;
            const values = card.querySelector('.stat-value').textContent
                .split('\n')
                .map(line => {
                    const parts = line.split(':');
                    return parts.map(part => part.trim());
                });
            summaryData.push([metric, ...values]);
        });
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary Statistics");

        // Detailed Results sheet
        const table = document.getElementById('tableContainer').querySelector('table');
        const resultsSheet = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(workbook, resultsSheet, "Detailed Results");

        // Raw Data sheet
        if (chart && chart.data && chart.data.datasets) {
            const chartData = chart.data.datasets.map(dataset => ({
                simulation: dataset.label,
                data: dataset.data
            }));
            const maxLength = Math.max(...chartData.map(d => d.data.length));
            const rawData = [["Trade Number", ...chartData.map(d => d.simulation)]];
            for (let i = 0; i < maxLength; i++) {
                const row = [i];
                chartData.forEach(dataset => {
                    row.push(dataset.data[i] || 0);
                });
                rawData.push(row);
            }
            const rawDataSheet = XLSX.utils.aoa_to_sheet(rawData);
            XLSX.utils.book_append_sheet(workbook, rawDataSheet, "Raw Data");
        }

        XLSX.writeFile(workbook, "simulation_report.xlsx");
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        alert("An error occurred while exporting to Excel. Please check the console for details.");
    }
}

function exportToHTML() {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Equity Curve Simulation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .chart-container { margin: 20px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Equity Curve Simulation Report</h1>
    
    <h2>Parameters</h2>
    <table>
        <tr><th>Parameter</th><th>Value</th></tr>
`;

    const params = getParams();
    const paramsList = [
        ["Starting Equity", params.startingEquity.toLocaleString()],
        ["Number of Trades", params.numTrades],
        ["Number of Simulations", params.numSimulations],
        ["Win Rate", `${(params.winRate * 100).toFixed(1)}%`],
        ["Reward/Risk Ratio", params.rewardRisk],
        ["Risk Type", params.riskType],
        ["Risk Size", `${(params.riskSize * 100).toFixed(1)}%`]
    ];
    paramsList.forEach(([param, value]) => {
        html += `<tr><td>${param}</td><td>${value}</td></tr>`;
    });
    html += `</table>`;

    // Add chart
    html += `
    <h2>Equity Curves</h2>
    <div class="chart-container">
        <img src="${document.getElementById('equityChart').toDataURL()}" style="width: 100%; max-width: 1000px;" />
    </div>
`;

    // Add summary statistics
    html += `<h2>Summary Statistics</h2><div class="stats-grid">`;
    const statsContainer = document.getElementById('statsContainer');
    const statCards = statsContainer.getElementsByClassName('stat-card');
    Array.from(statCards).forEach(card => {
        const label = card.querySelector('.stat-label').textContent;
        const value = card.querySelector('.stat-value').textContent;
        html += `
        <div class="stat-card">
            <h3>${label}</h3>
            <pre>${value}</pre>
        </div>`;
    });
    html += `</div>`;

    // Add detailed results table
    html += `<h2>Detailed Results</h2>`;
    html += document.getElementById('tableContainer').innerHTML;

    html += `
</body>
</html>`;

    // Create download link
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_report.html';
    a.click();
    window.URL.revokeObjectURL(url);
}