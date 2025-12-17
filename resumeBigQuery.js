// ==UserScript==
// @name         Calcular significancia teste AB
// @namespace    http://tampermonkey.net/
// @version      2025-12-17
// @description  try to take over the world!
// @author       You
// @match        https://lookerstudio.google.com/reporting/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

(function () {

  /* =====================================================
     NORMAL CDF (IGUAL AO FRONT — SEM Math.erf)
  ===================================================== */

  function normalCDF(x, mean = 0, std = 1) {
    const z = (x - mean) / std;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob =
      d * t * (
        0.3193815 +
        t * (-0.3565638 +
          t * (1.781478 +
            t * (-1.821256 +
              t * 1.330274)))
      );

    return z > 0 ? 1 - prob : prob;
  }

  function probabilityToBeBetter(cConv, vConv, cUsers, vUsers) {
    const pC = (cConv + 1) / (cUsers + 2);
    const pV = (vConv + 1) / (vUsers + 2);

    const seC = Math.sqrt((pC * (1 - pC)) / cUsers);
    const seV = Math.sqrt((pV * (1 - pV)) / vUsers);

    const z = (pV - pC) / Math.sqrt(seC ** 2 + seV ** 2);
    return normalCDF(z) * 100;
  }

  function significance(cConv, vConv, cUsers, vUsers) {
    const pC = cConv / cUsers;
    const pV = vConv / vUsers;

    const pooled = (cConv + vConv) / (cUsers + vUsers);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / cUsers + 1 / vUsers));
    const z = (pV - pC) / se;

    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    return (1 - pValue) * 100;
  }

  /* =====================================================
     PARSER
  ===================================================== */

  function parseRaw(raw) {
    const lines = raw.trim().split("\n").map(l => l.trim()).filter(Boolean);
    const headers = lines[0].split(/\s+/);

    const rows = lines.slice(1).map(l => {
      const p = l.split(/\s+/);
      return Object.fromEntries(headers.map((h, i) => [h, p[i]]));
    });

    return {
      control: rows.find(r => r.page_group === "Original"),
      variant: rows.find(r => r.page_group === "Teste"),
      metrics: headers.filter(h => h.endsWith("_Total"))
    };
  }

  /* =====================================================
     UI + CSS ISOLADO
  ===================================================== */

  const root = document.createElement("div");
  root.id = "abtool-root";
  document.body.appendChild(root);

  root.innerHTML = `
    <style>
     #abtool-root * {
  box-sizing: border-box;
  font-family: Inter, Arial, sans-serif;
}

/* Botão flutuante */
#abtool-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: linear-gradient(135deg, #1e635d, #22c55e);
  color: #fff;
  padding: 14px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  z-index: 999999;
  box-shadow: 0 10px 25px rgba(0,0,0,.25);
}

/* Modal */
#abtool-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: none;
  z-index: 999998;
}

#abtool-box {
  width: 950px;
  max-width: 96%;
  background: #ffffff;
  margin: 40px auto;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
}

/* Input */
#abtool-box textarea {
  width: 100%;
  height: 120px;
  font-family: monospace;
  border-radius: 6px;
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 10px;
}

/* Botões */
#abtool-box button {
  background: #16a34a;
  color: #fff;
  border: none;
  padding: 9px 16px;
  cursor: pointer;
  border-radius: 6px;
  font-weight: 600;
}

#abtool-box button:hover {
  filter: brightness(1.05);
}

/* Tabela */
#abtool-box table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 14px;
  font-size: 13px;
}

/* Header */
#abtool-box thead th {
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
  border-bottom: 2px solid #e5e7eb;
  padding: 10px;
}

/* Células */
#abtool-box td {
  padding: 9px;
  border-bottom: 1px solid #edf2f7;
  text-align: center;
  color: #1f2937;
}

/* Hover linha */
#abtool-box tbody tr:hover {
  background: #f9fafb;
}

/* Primeira coluna (labels verdes) */
#abtool-box .label {
  background: linear-gradient(135deg, #1e635d, #22c55e);
  color: #ffffff;
  font-weight: 700;
  text-align: left;
  border-radius: 4px;
}

/* Linha de uplift */
#abtool-box .uplift {
  font-weight: 700;
}


/* Destaque PTB e P-Valor */
#abtool-box td:nth-child(5),
#abtool-box td:nth-child(6) {
  font-weight: 700;
}

/* Footer total */
#abtool-box tbody tr:last-child td {
  font-weight: 800;
  background: ##d7d7d7;
  color: black;
}

.uplift-positive {
  color: #16a34a !important;/* verde */
}

.uplift-negative {
  color: #dc2626 !important; /* vermelho */
}
    </style>

    <div id="abtool-btn">📊</div>

    <div id="abtool-modal">
      <div id="abtool-box">
        <textarea id="abtool-input" placeholder="Cole a string com os dados aqui..."></textarea>
        <button id="abtool-run">Calcular</button>
        <button id="abtool-close" style="background:#888">Fechar</button>
        <div id="abtool-result"></div>
      </div>
    </div>
  `;

  /* =====================================================
     EVENTS
  ===================================================== */

  root.querySelector("#abtool-btn").onclick = () =>
    root.querySelector("#abtool-modal").style.display = "block";

  root.querySelector("#abtool-close").onclick = () =>
    root.querySelector("#abtool-modal").style.display = "none";

  root.querySelector("#abtool-run").onclick = () => {
    const raw = root.querySelector("#abtool-input").value;
    const { control, variant, metrics } = parseRaw(raw);

    const cUsers = +control.Unique_Users_EXCLUSIVO;
    const vUsers = +variant.Unique_Users_EXCLUSIVO;

    let totalC = 0, totalV = 0;

    const rows = metrics.map(m => {
      const c = +control[m];
      const v = +variant[m];
      totalC += c;
      totalV += v;

      const uplift = ((v / vUsers) / (c / cUsers) - 1) * 100;

      return `
        <tr>
          <td class="label">${m.replace("_Total", "").replace(/_/g, " ")}</td>
          <td>${c}</td>
          <td>${v}</td>
          <td>${c + v}</td>
          <td>${probabilityToBeBetter(c, v, cUsers, vUsers).toFixed(2)}%</td>
          <td>${significance(c, v, cUsers, vUsers).toFixed(2)}%</td>
        </tr>
        <tr>
          <td></td><td></td>
          <td class="uplift">${uplift.toFixed(2)}%</td>
          <td></td><td></td><td></td>
        </tr>
      `;
    }).join("");

    root.querySelector("#abtool-result").innerHTML = `
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Controle</th>
            <th>Variante B</th>
            <th>Total</th>
            <th>PTB</th>
            <th>P-Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label">Usuários</td>
            <td>${cUsers}</td>
            <td>${vUsers}</td>
            <td>${cUsers + vUsers}</td>
            <td></td><td></td>
          </tr>
          ${rows}
          <tr>
            <td class="label">Total</td>
            <td>${totalC}</td>
            <td>${totalV}</td>
            <td>${totalC + totalV}</td>
            <td>100%</td>
            <td>100%</td>
          </tr>
        </tbody>
      </table>
    `;

    document.querySelectorAll(".uplift").forEach(el => {
      const value = parseFloat(el.textContent.replace("%", ""));
      el.classList.add(value >= 0 ? "uplift-positive" : "uplift-negative");
    });
  };

})();
