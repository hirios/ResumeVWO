// ==UserScript==
// @name         Looker Resume
// @namespace    http://tampermonkey.net/
// @version      2025-09-12
// @description  try to take over the world!
// @author       You
// @match        https://lookerstudio.google.com/reporting/*
// @icon         https://www.gstatic.com/analytics-lego/svg/ic_looker_studio.svg
// @grant        none
// ==/UserScript==



(function () {
  // Adicionar estilos CSS
  const style = document.createElement('style');
  style.textContent = `
    .floating-table-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .floating-table-container {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      font-family: Arial, sans-serif;
      position: relative;
    }

    .floating-table-close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 5px 10px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .floating-table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 30px;
      font-size: 14px;
      text-align: center;
    }

    .floating-table th, .floating-table td {
      border: 1px solid rgb(220 220 220);
      padding: 10px;
      text-align: center;
      vertical-align: middle;
    }

    .floating-table-header {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    .metric-name-cell {
      text-align: left;
      font-weight: bold;
      background-color: #23A576;
      color: white;
    }

    /* ESTILO ESPECIAL PARA CÉLULA USUÁRIOS */
    .user-metric-cell {
      text-align: left;
      font-weight: bold;
      background-color: black;
      color: white;
    }

    .metric-row {
      background-color: #f0f0f0; /* Linha cinza clara para métricas */
    }

    .rate-cell {
      font-style: italic;
      color: #555;
    }

    .positive-variation {
      color: #2e7d32;
      font-weight: bold;
    }

    .negative-variation {
      color: #c62828;
      font-weight: bold;
    }

    .floating-button {
      position: fixed;
      right: 10px;
      z-index: 1000;
      padding: 10px 15px;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .generate-csv-button {
      top: 50px;
      background-color: #4CAF50;
    }

    .days-experiment-button {
      top: 50px;
      right: 145px;
      background-color: #2196F3;
    }

    .table-title {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }

    .column-color-row-cedule {
      background-color: rgb(188 188 188 / 10%)
    }

    /* Classes para cores das colunas */
    .column-color-0 { background-color: rgba(255, 165, 0, 0.1); }
    .column-color-1 { background-color: rgba(0, 191, 255, 0.1); }
    .column-color-2 { background-color: rgba(255, 182, 193, 0.1); }
    .column-color-3 { background-color: rgba(144, 238, 144, 0.1); }
    .column-color-4 { background-color: rgba(221, 160, 221, 0.1); }
    .column-color-5 { background-color: rgba(255, 218, 185, 0.1); }
    .column-color-6 { background-color: rgba(173, 216, 230, 0.1); }
    .column-color-7 { background-color: rgba(240, 128, 128, 0.1); }

    /* Controle de altura */
    .row-height-control {
      position: fixed;
      top: 15px;
      right: 70px;
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #f5f5f5;
      padding: 5px 10px;
      border-radius: 4px;
      z-index: 1;
    }

    .row-height-label {
      font-size: 12px;
      color: #333;
      white-space: nowrap;
    }

    .row-height-slider {
      width: 80px;
      cursor: pointer;
    }

    .row-height-value {
      font-size: 12px;
      font-weight: bold;
      min-width: 30px;
      text-align: center;
    }

    /* Ajuste para linhas compactas */
    .compact-mode .floating-table th,
    .compact-mode .floating-table td {
      padding: 2px 5px;
      font-size: 12px;
    }

        .toggle-ptb-pvalor-button {
      margin-left: 8px;
      padding: 6px 10px;
      font-size: 13px;
      background-color: #e0e0e0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .toggle-ptb-pvalor-button:hover {
      background-color: #d0d0d0;
    }

    .floating-table-container .button-group {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .hidden-column {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // Função para criar e exibir a tabela flutuante
  function showFloatingTable(csvData) {
    const overlay = document.createElement('div');
    overlay.className = 'floating-table-overlay';

    const tableContainer = document.createElement('div');
    tableContainer.className = 'floating-table-container';

    const closeButton = document.createElement('button');
    closeButton.className = 'floating-table-close-button';
    closeButton.innerText = 'Fechar';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Controle de altura melhorado
    const rowHeightControl = document.createElement('div');
    rowHeightControl.className = 'row-height-control';

    const rowHeightLabel = document.createElement('span');
    rowHeightLabel.className = 'row-height-label';
    rowHeightLabel.textContent = 'Altura das linhas:';

    const rowHeightSlider = document.createElement('input');
    rowHeightSlider.type = 'range';
    rowHeightSlider.className = 'row-height-slider';
    rowHeightSlider.min = '15';
    rowHeightSlider.max = '60';
    rowHeightSlider.value = '30';
    rowHeightSlider.step = '1';

    const rowHeightValue = document.createElement('span');
    rowHeightValue.className = 'row-height-value';
    rowHeightValue.textContent = '30px';

    rowHeightControl.appendChild(rowHeightLabel);
    rowHeightControl.appendChild(rowHeightSlider);
    rowHeightControl.appendChild(rowHeightValue);
    tableContainer.appendChild(rowHeightControl);

    // Parse CSV
    const rows = csvData.split('\n').map(row => row.split(';'));
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Encontrar índice da coluna de controle
    const controlIndex = headers.findIndex(header =>
      header.toLowerCase().includes('control') ||
      header.toLowerCase().includes('controle')
    ) || 1;

    // Encontrar a linha de usuários
    const userRow = dataRows.find(row => row[0] === "Usuários");
    if (!userRow) {
      alert("Erro: Linha de 'Usuários' não encontrada no CSV.");
      return;
    }

    // Criar tabela
    const table = document.createElement('table');
    table.className = 'floating-table';

    // Adicionar cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.className = 'floating-table-header';

    // Primeiro cabeçalho vazio para a coluna de métricas
    const emptyHeader = document.createElement('th');
    headerRow.appendChild(emptyHeader);

    // Demais cabeçalhos com classes de cor
    headers.forEach((header, index) => {
      if (index === 0) return; // Pular a coluna "Métricas"

      const th = document.createElement('th');
      th.textContent = header;

      if (!th.textContent.includes('PTB') && !th.textContent.includes('P-Valor')) {
        const colorIndex = (index - 1) % 8;
        th.classList.add(`column-color-${colorIndex}`);
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Adicionar corpo da tabela
    const tbody = document.createElement('tbody');

    // Processar cada métrica
    dataRows.forEach((row, rowIndex) => {
      const metricName = row[0];
      const isUserRow = metricName === "Usuários";

      // Linha 1: Valores absolutos
      const absoluteRow = document.createElement('tr');

      // Adicionar classe para linha de métrica (cinza claro)
      if (!isUserRow) {
        absoluteRow.classList.add('metric-row');
      }

      const metricCell = document.createElement('td');

      // Aplicar estilo especial para célula "Usuários"
      if (isUserRow) {
        metricCell.className = 'user-metric-cell';
      } else {
        metricCell.className = 'metric-name-cell';
      }

      metricCell.textContent = metricName;
      absoluteRow.appendChild(metricCell);

      // Adicionar valores absolutos para cada coluna
      for (let i = 1; i < row.length; i++) {
        const td = document.createElement('td');
        td.textContent = row[i];
        td.classList.add(`column-color-row-cedule`);
        absoluteRow.appendChild(td);
      }

      tbody.appendChild(absoluteRow);

      // Para métricas que não são "Usuários", adicionar linha de taxas e variações
      if (!isUserRow) {
        // Linha 2: Taxas percentuais
        const rateRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        rateRow.appendChild(emptyCell);

        for (let i = 1; i < row.length; i++) {
          const td = document.createElement('td');
          td.className = 'rate-cell';

          // Calcular taxa: valor / usuários da coluna * 100
          const absoluteValue = parseFloat(row[i]);
          const userCount = parseFloat(userRow[i]);

          if (!isNaN(absoluteValue) && !isNaN(userCount) && userCount > 0) {
            const rate = (absoluteValue / userCount * 100).toFixed(2) + '%';
            td.textContent = rate;
          }

          td.classList.add(`column-color-row-cedule`);
          rateRow.appendChild(td);
        }

        tbody.appendChild(rateRow);

        // Linha 3: Variação em relação ao controle (apenas para colunas não controle)
        const variationRow = document.createElement('tr');
        const emptyCell2 = document.createElement('td');
        variationRow.appendChild(emptyCell2);

        for (let i = 1; i < row.length; i++) {
          const td = document.createElement('td');

          if (i === controlIndex) {
            td.textContent = '-';
          } else {
            // Calcular a taxa do controle e da variante
            const controlValue = parseFloat(row[controlIndex]);
            const controlUsers = parseFloat(userRow[controlIndex]);
            const variantValue = parseFloat(row[i]);
            const variantUsers = parseFloat(userRow[i]);

            if (!isNaN(controlValue) && !isNaN(controlUsers) && controlUsers > 0 &&
                !isNaN(variantValue) && !isNaN(variantUsers) && variantUsers > 0) {
              const controlRate = controlValue / controlUsers;
              const variantRate = variantValue / variantUsers;

              if (controlRate > 0) {
                const variation = ((variantRate - controlRate) / controlRate * 100).toFixed(2) + '%';
                td.textContent = variation;

                // Formatação condicional
                const variationValue = parseFloat(variation);
                if (variationValue > 0) {
                  td.classList.add('positive-variation');
                } else if (variationValue < 0) {
                  td.classList.add('negative-variation');
                }
              }
            }
          }

          td.classList.add(`column-color-row-cedule`);
          variationRow.appendChild(td);
        }

        tbody.appendChild(variationRow);
      }
    });

    table.appendChild(tbody);

    // Montar a estrutura
    tableContainer.appendChild(closeButton);

    // Adicionar título
    const title = document.createElement('h2');
    title.className = 'table-title';
    title.textContent = 'Relatório de Teste A/B';
    tableContainer.appendChild(title);

    tableContainer.appendChild(table);
    overlay.appendChild(tableContainer);
    document.body.appendChild(overlay);

    // Função para aplicar a altura nas linhas (versão melhorada)
    function applyRowHeight(height) {
      const rows = table.querySelectorAll('tbody tr');
      const cells = table.querySelectorAll('tbody td, tbody th');

      // Aplicar modo compacto para alturas menores
      if (height < 25) {
        tableContainer.classList.add('compact-mode');
      } else {
        tableContainer.classList.remove('compact-mode');
      }

      rows.forEach(row => {
        row.style.height = `${height}px`;
        row.style.minHeight = `${height}px`;
        row.style.lineHeight = `${height - 4}px`; // Ajuste fino para texto centralizado
      });

      cells.forEach(cell => {
        cell.style.paddingTop = '0';
        cell.style.paddingBottom = '0';
      });
    }

    // Event listener para o slider
    rowHeightSlider.addEventListener('input', () => {
      const height = parseInt(rowHeightSlider.value);
      rowHeightValue.textContent = `${height}px`;
      applyRowHeight(height);
    });

    // Aplicar altura inicial
    applyRowHeight(parseInt(rowHeightSlider.value));

    // Fechar ao clicar no overlay (fora da tabela)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  // Função para processar CSV em string e calcular PBB e Significância
  function analyzeABTest(csvString) {
    // Converter CSV para matriz de dados
    const rows = csvString.trim().split("\n").map(row => row.split(";").map(cell => cell.trim()));

    // Extrair cabeçalhos e métricas
    const headers = rows[0].slice(1);
    const metrics = rows.slice(1).map(row => ({
      metric: row[0],
      values: row.slice(1).map(val => parseInt(val, 10))
    }));

    // Identificar usuários do controle e variações
    const userRow = metrics.find(row => row.metric === "Usuários");
    if (!userRow) return csvString;
    const usersControl = userRow.values[0];
    const variantUsers = userRow.values.slice(1);

    // Função para calcular a CDF da normal
    function normalCDF(x, mean, std) {
      const t = 1 / (1 + 0.2316419 * Math.abs((x - mean) / std));
      const d = 0.3989423 * Math.exp(-((x - mean) / std) * ((x - mean) / (2 * std * std)));
      const probability =
        d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > mean ? 1 - probability : probability;
    }

    // Função para calcular Probability to be Better
    function probabilityToBeBetter(controlConversions, variantConversions, usersControl, usersVariant) {
      const pControl = (controlConversions + 1) / (usersControl + 2);
      const pVariant = (variantConversions + 1) / (usersVariant + 2);

      const seControl = Math.sqrt((pControl * (1 - pControl)) / usersControl);
      const seVariant = Math.sqrt((pVariant * (1 - pVariant)) / usersVariant);

      const seDifference = Math.sqrt((seControl * seControl) + (seVariant * seVariant));
      const zScore = (pVariant - pControl) / seDifference;

      return normalCDF(zScore, 0, 1);
    }

    // Função para calcular Significância Estatística (valor p)
    function calculatePValue(controlConversions, variantConversions, usersControl, usersVariant) {
      const pControl = controlConversions / usersControl;
      const pVariant = variantConversions / usersVariant;
      const pooledP = (controlConversions + variantConversions) / (usersControl + usersVariant);

      const sePooled = Math.sqrt(pooledP * (1 - pooledP) * (1 / usersControl + 1 / usersVariant));
      const zScore = (pVariant - pControl) / sePooled;
      const pValue = 2 * (1 - normalCDF(Math.abs(zScore), 0, 1));

      return ((1 - pValue) * 100).toFixed(2) + "%";
    }

    // Calcular PBB e Significância para cada métrica e variação
    const results = [];
    for (let row of metrics) {
      if (row.metric === "Usuários") continue;

      const controlConversions = row.values[0];
      const variants = row.values.slice(1);

      const variantResults = variants.map((variantConversions, i) => ({
        probabilityToBeBetter: `${(probabilityToBeBetter(controlConversions, variantConversions, usersControl, variantUsers[i]) * 100).toFixed(2)}%`,
        pValue: calculatePValue(controlConversions, variantConversions, usersControl, variantUsers[i])
      }));

      results.push({ metric: row.metric, comparisons: variantResults });
    }

    // Adicionar colunas de probabilidade e significância ao CSV
    const updatedCSV = rows.map((row, index) => {
      if (index === 0) {
        return [...row, ...headers.slice(1).map(header => `PTB (${header})`), ...headers.slice(1).map(header => `P-Valor (${header})`)].join(";");
      } else if (row[0] === "Usuários") {
        return row.join(";");
      } else {
        const metricResult = results.find(result => result.metric === row[0]);
        if (metricResult) {
          const probabilities = metricResult.comparisons.map(comp => comp.probabilityToBeBetter);
          const pValues = metricResult.comparisons.map(comp => comp.pValue);
          return [...row, ...probabilities, ...pValues].join(";");
        }
        return row.join(";");
      }
    }).join("\n");

    return updatedCSV;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function getMetricsResume() {
    const allMetrics = document.querySelectorAll('[ng-repeat*="vm.campaignGoals"]') || [];
    const metricResume = [];

    for (const metric of allMetrics) {
      metric.click();
      await sleep(2000);

      const variations = document.querySelectorAll('tbody tr.ng-scope:not(.table-total-row)[vwo-rearrange-children="getTableColumnsOrder()"]') || [];

      if (variations.length) {
        const variationResume = [];

        for (const variation of variations) {
          const metricName = document.querySelector('[data-qa="tovaxivumi"]').innerText;
          const variantName = variation.querySelector('[data-qa="dogabiziye"]').innerText;
          const numeros = variation.querySelector('[data-qa="zodofocaxu"]').innerText.split('/');
          variationResume.push([metricName, variantName, ...numeros]);
        }

        metricResume.push(variationResume);
      }
    }

    return metricResume;
  }

  async function getCSVDate(data) {
    const csvContent = data.map(row => row.join(';').replaceAll(',', '')).join('\n');
    const csvData = analyzeABTest(csvContent);
    // await navigator.clipboard.writeText(csvData);
    return csvData;
  }


  function adicionarMetricaTotal(data) {
    // Função para converter string numérica com vírgula em número
    const parseNumber = str => parseFloat(str.replace(/,/g, ''));

    // Inicializa um objeto para acumular totais por variante
    const totals = {};

    // Acumula os valores por variante
    data.forEach(metricGroup => {
        metricGroup.forEach(item => {
            const variante = item[1];
            const valorMetrica = parseNumber(item[2]);
            const totalUsuarios = item[3]; // apenas replicar, não somar

            if (!totals[variante]) totals[variante] = [0, totalUsuarios];

            totals[variante][0] += valorMetrica;
        });
    });

    // Cria a métrica "Total" para cada variante
    const totalMetrics = Object.entries(totals).map(([variante, valores]) => {
        return ["Total", variante, valores[0].toString(), valores[1]];
    });

    // Retorna o objeto original com a nova métrica adicionada
    return [...data, totalMetrics];
}

  function getDataLookerStudio() {
    const ignore = ['caminho da página', 'conversões', 'usuários ativos', 'taxa de conversao'];
    const headerNames = Array.from(document.querySelectorAll('[class="headerRow"] [class="colName"][title]')).map((e) => e.innerText);


    function getRowByIndex(index) {
        const rowValues = Array.from(document.querySelectorAll(`[class="centerColsContainer"] [class="row block-0 index-${index}"] div[class*="cell"]`), (e) => e.innerText.replaceAll('\n', ''));
        return rowValues;
    }

    function normalizeString(str) {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    }

    const normalizedIgnore = ignore.map(normalizeString);
    const headersWithStatus = headerNames.map((header, index) => {
        const normalizedHeader = normalizeString(header);
        const shouldIgnore = normalizedIgnore.includes(normalizedHeader);
        return {
            index: index,
            name: header,
            ignore: shouldIgnore
        };
    });


    var variante_controle = getRowByIndex(0);
    var variante_B = getRowByIndex(1);
    var variante_C = getRowByIndex(2);

    var output = []
    for (let header of headersWithStatus) {
        if (header.ignore != true) {
            if (variante_C.length > 0) {
                output.push([
                    [header.name, 'Controle', variante_controle[header.index].replace('.', ','), variante_controle[1].replace('.', ',')],
                    [header.name, 'Variante B', variante_B[header.index].replace('.', ','), variante_B[1].replace('.', ',')],
                    [header.name, 'Variante C', variante_C[header.index].replace('.', ','), variante_C[1].replace('.', ',')]
                ]);
            } else {
                output.push([
                    [header.name, 'Controle', variante_controle[header.index].replace('.', ','), variante_controle[1].replace('.', ',')],
                    [header.name, 'Variante B', variante_B[header.index].replace('.', ','), variante_B[1].replace('.', ',')]
                ]);
            }
        }
    }

    return output;

}


  function createToggleButton() {
    const closeButton = document.querySelector(".floating-table-close-button");
    if (!closeButton) return;

    // Evita duplicar o botão
    if (document.querySelector(".toggle-ptb-pvalor-button")) return;

    // Cria botão
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "Ocultar PTB / P-Valor";
    toggleBtn.className = "toggle-ptb-pvalor-button";

    // Agrupador de botões
    const group = document.createElement("div");
    group.className = "button-group";
    closeButton.parentNode.insertBefore(group, closeButton);
    group.appendChild(closeButton);
    group.appendChild(toggleBtn);

    let hidden = false;

    toggleBtn.addEventListener("click", () => {
      const table = document.querySelector(".floating-table");
      if (!table) return;

      const headerCells = table.querySelectorAll("thead th");
      const columnsToToggle = [];

      headerCells.forEach((th, index) => {
        const text = th.textContent.trim().toLowerCase();
        if (text.includes("ptb") || text.includes("p-valor")) {
          columnsToToggle.push(index);
        }
      });

      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("th, td");
        columnsToToggle.forEach((colIndex) => {
          const cell = cells[colIndex];
          if (cell) {
            cell.classList.toggle("hidden-column", !hidden);
          }
        });
      });

      hidden = !hidden;
      toggleBtn.textContent = hidden
        ? "Mostrar PTB / P-Valor"
        : "Ocultar PTB / P-Valor";
    });
  }

   function isNumericCell(cellText) {
    return /^[\d\s.,]+$/.test(cellText) && !cellText.includes('%');
  }

  function parseNumber(text) {
    return parseFloat(text.replace(/\./g, '').replace(',', '.'));
  }

  function createSumColumn() {
    const table = document.querySelector(".floating-table");
    if (!table) return;

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    if (!thead || !tbody) return;

    const headerCells = [...thead.querySelectorAll("th")];
    const ptbOrPvalorIndex = headerCells.findIndex(th => {
      const t = th.textContent.trim().toLowerCase();
      return t.includes("ptb") || t.includes("p-valor");
    });

    const insertIndex = ptbOrPvalorIndex > 0 ? ptbOrPvalorIndex : headerCells.length;

    // Inserir o novo cabeçalho
    const newTh = document.createElement("th");
    newTh.textContent = "Total";
    newTh.style.textAlign = "center";
    thead.querySelector("tr").insertBefore(newTh, headerCells[insertIndex]);

    // Processar cada linha do corpo da tabela
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => {
      const cells = [...row.querySelectorAll("td")];
      let sum = 0;
      let hasValidValue = false;

      cells.forEach((cell, index) => {
        const text = cell.textContent.trim();
        const isPTB = headerCells[index]?.textContent.toLowerCase().includes("ptb");
        const isPvalor = headerCells[index]?.textContent.toLowerCase().includes("p-valor");

        if (!isPTB && !isPvalor && isNumericCell(text)) {
          const num = parseNumber(text);
          if (!isNaN(num)) {
            sum += num;
            hasValidValue = true;
          }
        }
      });

      const newTd = document.createElement("td");
      newTd.textContent = hasValidValue
        ? sum.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })
        : "";
      newTd.style.textAlign = "center";

      const refCell = row.children[insertIndex];
      row.insertBefore(newTd, refCell);
    });
  }




function botaoProjeção() {
  function processData(data) {
    const metrics = {};
    const allVariants = new Set();
    const flatData = data.flat();

    flatData.forEach(item => {
      const [metric, variant, events, usersStr] = item;
      const users = parseInt(usersStr.replace(/,/g, ''));
      const eventsNum = parseInt(events);
      allVariants.add(variant);
      if (!metrics[metric]) {
        metrics[metric] = { variants: {}, totalUsers: 0 };
      }
      metrics[metric].variants[variant] = { events: eventsNum, users: users };
      metrics[metric].totalUsers += users;
    });

    const sortedVariants = [...allVariants].sort();
    const absoluteValues = [];
    const projections = [];

    const totalAbsolute = {};
    const totalProjection = {};
    sortedVariants.forEach(v => {
        totalAbsolute[v] = 0;
        totalProjection[v] = 0;
    });

    for (const metric in metrics) {
      const totalTrafficUsers = metrics[metric].totalUsers;
      const absoluteRow = { Métrica: metric };
      const projectionRow = { Métrica: metric };

      const controlEvents = metrics[metric].variants["Controle"].events;
      const controlUsers = metrics[metric].variants["Controle"].users;
      const controlRate = controlEvents / controlUsers;
      const projectedControl = Math.round(controlRate * totalTrafficUsers);

      absoluteRow["Controle"] = controlEvents;
      projectionRow["Controle"] = projectedControl;
      totalAbsolute["Controle"] += controlEvents;
      totalProjection["Controle"] += projectedControl;

      sortedVariants.filter(v => v !== "Controle").forEach(variant => {
        const variantData = metrics[metric].variants[variant];
        const variantShortName = variant.replace("Variante ", "");
        const absoluteDiff = variantData.events - controlEvents;
        absoluteRow[variant] = variantData.events;
        absoluteRow[`Diferença ${variantShortName}`] = absoluteDiff;
        totalAbsolute[variant] += variantData.events;

        const variantRate = variantData.events / variantData.users;
        const projectedVariant = Math.round(variantRate * totalTrafficUsers);
        const projectedDiff = projectedVariant - projectedControl;

        projectionRow[variant] = projectedVariant;
        projectionRow[`Diferença ${variantShortName}`] = projectedDiff;
        totalProjection[variant] += projectedVariant;
      });

      absoluteValues.push(absoluteRow);
      projections.push(projectionRow);
    }

    const absoluteTotalRow = { Métrica: "Total" };
    const projectionTotalRow = { Métrica: "Total" };

    sortedVariants.forEach(variant => {
        absoluteTotalRow[variant] = totalAbsolute[variant];
        projectionTotalRow[variant] = totalProjection[variant];
        if (variant !== "Controle") {
            const variantShortName = variant.replace("Variante ", "");
            absoluteTotalRow[`Diferença ${variantShortName}`] = totalAbsolute[variant] - totalAbsolute["Controle"];
            projectionTotalRow[`Diferença ${variantShortName}`] = totalProjection[variant] - totalProjection["Controle"];
        }
    });

    absoluteValues.push(absoluteTotalRow);
    projections.push(projectionTotalRow);

    const headers = ["Métrica", ...sortedVariants, ...sortedVariants.filter(v => v !== "Controle").map(v => `Diferença ${v.replace("Variante ", "")}`)];

    return { absoluteValues, projections, headers };
  }

  // --- Funções de criação e controle da UI ---

  function createTable(title, tableData, headers) {
    const container = document.createElement('div');
    const titleEl = document.createElement('h4');
    titleEl.innerHTML = `&#9632; ${title}`;
    titleEl.style.cssText = 'font-family: sans-serif; margin-bottom: 5px; font-weight: bold; font-size: 14px;';

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-family: sans-serif;
      font-size: 12px;
      margin-bottom: 10px;
    `;

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      th.style.cssText = `
        border: 1px solid #ddd;
        padding: 6px;
        text-align: center;
        background-color: #f7f7f7;
        font-weight: bold;
      `;
      if (headerText.includes('Diferença')) {
          th.style.textAlign = 'right';
      } else if (headerText === 'Métrica') {
          th.style.textAlign = 'left';
      }
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tableData.forEach(item => {
      const row = document.createElement('tr');

      if (item.Métrica === 'Total') {
          row.style.cssText = `
              background-color: #dfdfdf;
              border-top: 2px solid #bbb4b5;
          `;
      }

      headers.forEach(header => {
        const td = document.createElement('td');
        td.textContent = item[header];
        td.style.cssText = `
          border: 1px solid #ddd;
          padding: 6px;
          text-align: center;
        `;
        if (header.includes('Diferença')) {
            td.style.textAlign = 'right';
            td.style.color = item[header] > 0 ? '#008000' : (item[header] < 0 ? '#ff0000' : 'inherit');
            td.style.fontWeight = 'bold';
            td.textContent = item[header] > 0 ? `+${item[header]}` : item[header];
        } else if (header === 'Métrica') {
            td.style.textAlign = 'left';
        }
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(titleEl);
    container.appendChild(table);
    return container;
  }

  function createFloatingContainer() {
    const mainContainer = document.createElement('div');
    mainContainer.id = 'floating-table-main-container';
    mainContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: white;
        border: 1px solid #ccc;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 15px;
        z-index: 9999;
        border-radius: 12px;
        display: none;
        flex-direction: column;
        gap: 15px;
    `;
    return mainContainer;
  }

  // --- Lógica de controle do botão e da exibição da tabela ---
  let isTableVisible = false;
  let mainContainer = null;

  function toggleProjectionTable() {
    const rawData = getDataLookerStudio();

    if (!mainContainer) {
      mainContainer = createFloatingContainer();
      const { absoluteValues, projections, headers } = processData(rawData);
      mainContainer.appendChild(createTable('Valores Absolutos', absoluteValues, headers));
      mainContainer.appendChild(createTable('Projeção com 100% do Tráfego', projections, headers));
      document.body.appendChild(mainContainer);
    }

    if (isTableVisible) {
      mainContainer.style.display = 'none';
      isTableVisible = false;
    } else {
      mainContainer.style.display = 'flex';
      isTableVisible = true;
    }
  }

  // Evento para remover a tabela ao clicar fora dela
  document.addEventListener('mousedown', function(event) {
    if (mainContainer && isTableVisible && !mainContainer.contains(event.target) && event.target.id !== "btn-projecao-metricas") {
      toggleProjectionTable();
    }
  });

  // Código para criar o botão e anexá-lo
  const pbtButton = [...document.querySelectorAll("button")].find(b => b.textContent.includes("PTB"));
  if (pbtButton && !document.getElementById("btn-projecao-metricas")) {
    const projButton = document.createElement("button");
    projButton.id = "btn-projecao-metricas";
    projButton.textContent = "Mostrar Projeção";
    projButton.style.cssText = `
        margin-left: 10px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
        border-radius: 4px;
        border: 1px solid #ccc;
        background: #f9f9f9;
    `;
    projButton.addEventListener("click", toggleProjectionTable);
    pbtButton.parentElement.appendChild(projButton);
  }
}


  // Botão Gerar CSV
  const button = document.createElement('button');
  button.className = 'floating-button generate-csv-button';
  button.innerText = 'Tabela resumo';
  document.body.appendChild(button);

  // Botão Dias Experimento
  const buttonDiasExperimento = document.createElement('button');
  buttonDiasExperimento.className = 'floating-button days-experiment-button';
  buttonDiasExperimento.innerText = 'Dias de experimento';
  document.body.appendChild(buttonDiasExperimento);

  buttonDiasExperimento.addEventListener('click', async () => {
    alert(`Dias de experimento: ${document.querySelectorAll('[class="angular-date-range-picker__calendar-day angular-date-range-picker__calendar-day-selected"]').length}`);
  });

  button.addEventListener('click', async () => {
    button.innerText = 'Coletando dados...';
    button.disabled = true;

    try {
      const myResumeVWO = adicionarMetricaTotal(getDataLookerStudio());
      const outputObjectResumo = [
        ['Métricas', ...myResumeVWO[0].map((x) => x[1])],
        ['Usuários', ...myResumeVWO[0].map((x) => x[3])],
      ];

      for (index in myResumeVWO) {
        outputObjectResumo.push([myResumeVWO[index][0][0], ...myResumeVWO[index].map((x) => x[2])]);
      }

      const csvData = await getCSVDate(outputObjectResumo);
      showFloatingTable(csvData);
      createSumColumn();
      createToggleButton();
      botaoProjeção();

      const allRowsTable = document.querySelectorAll('[class="floating-table"] tbody tr')
      allRowsTable.forEach((row, index) => {
          if (row.classList && row.classList.contains("metric-row")) {
              const nextRow = allRowsTable[index + 1];
              if (nextRow) {
                  nextRow.hidden = true;
              }
          }
      });

      button.innerText = 'Copiado!';
      setTimeout(() => {
        button.innerText = 'Tabela resumo';
        button.disabled = false;
      }, 500);
    } catch (error) {
      console.error('Erro ao processar métricas:', error);
      button.innerText = 'Erro! Tente novamente';
      setTimeout(() => {
        button.innerText = 'Tabela resumo';
        button.disabled = false;
      }, 3000);
    }
  });
})();
