const fileInput = document.getElementById("fileInput");
const table = document.getElementById("table");

fileInput.addEventListener("change", handleFileUpload);

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  table.innerHTML = "";

  if (fileName.endsWith(".csv")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      const rows = text
        .split("\n")
        .map(row => row.split(",").map(cell => String(cell || "").trim()));
      processRows(rows);
    };
    reader.readAsText(file);
  } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      processRows(rows);
    };
    reader.readAsArrayBuffer(file);
  } else {
    table.innerHTML = `<tr><td class="empty-state">Unsupported file format</td></tr>`;
  }
}

function processRows(rows) {
  if (!rows || !rows.length) {
    table.innerHTML = `<tr><td class="empty-state">No data found</td></tr>`;
    return;
  }

  // Find actual header row
  const headerIndex = findHeaderRow(rows);
  if (headerIndex === -1) {
    table.innerHTML = `<tr><td class="empty-state">Could not detect header row</td></tr>`;
    return;
  }

  const headers = rows[headerIndex].map(h => String(h).trim());
  const dataRows = rows.slice(headerIndex + 1).filter(row => hasAnyValue(row));

  renderAuditTable(headers, dataRows);
}

function findHeaderRow(rows) {
  const possibleHeaders = [
    "sl.no",
    "emp code",
    "emp name",
    "name",
    "employee name",
    "employee code",
    "remarks"
  ];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(cell => String(cell).trim().toLowerCase());
    const score = row.filter(cell => possibleHeaders.includes(cell)).length;
    if (score >= 2) {
      return i;
    }
  }

  return -1;
}

function hasAnyValue(row) {
  return row.some(cell => String(cell).trim() !== "");
}

function renderAuditTable(headers, dataRows) {
  table.innerHTML = "";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header || "";
    headRow.appendChild(th);
  });

  const remarksTh = document.createElement("th");
  remarksTh.textContent = "Remarks";
  headRow.appendChild(remarksTh);

  const actionTh = document.createElement("th");
  actionTh.textContent = "Action";
  headRow.appendChild(actionTh);

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  dataRows.forEach((row) => {
    const tr = document.createElement("tr");

    headers.forEach((_, colIndex) => {
      const td = document.createElement("td");
      td.textContent = row[colIndex] ?? "";
      tr.appendChild(td);
    });

    const remarksTd = document.createElement("td");
    const remarksInput = document.createElement("input");
    remarksInput.type = "text";
    remarksInput.className = "remark-input";
    remarksInput.value = generateBasicRemark(headers, row);
    remarksTd.appendChild(remarksInput);
    tr.appendChild(remarksTd);

    const actionTd = document.createElement("td");
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => {
      const rowData = {};
      headers.forEach((header, idx) => {
        rowData[header] = row[idx] ?? "";
      });
      rowData["Remarks"] = remarksInput.value;

      navigator.clipboard.writeText(JSON.stringify(rowData, null, 2))
        .then(() => {
          copyBtn.textContent = "Copied";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 1200);
        });
    });

    actionTd.appendChild(copyBtn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

function generateBasicRemark(headers, row) {
  const getValue = (names) => {
    const idx = headers.findIndex(h => names.includes(String(h).trim().toLowerCase()));
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  };

  const empName = getValue(["emp name", "employee name", "name"]);
  const empCode = getValue(["emp code", "employee code"]);
  const netPay = getValue(["net salary", "net pay", "payable salary"]);
  const lop = getValue(["lop", "attendance deduction", "absent", "leave deduction"]);
  const pt = getValue(["pt", "professional tax"]);

  let remarks = [];

  if (empName || empCode) {
    remarks.push("Record loaded");
  }

  if (lop) {
    remarks.push("Check attendance impact");
  }

  if (pt) {
    remarks.push("Verify PT");
  }

  if (netPay) {
    remarks.push("Review net salary");
  }

  if (remarks.length === 0) {
    return "No discrepancy";
  }

  return remarks.join("; ");
}
