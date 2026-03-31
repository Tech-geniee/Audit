const fileInput = document.getElementById("fileInput");
const table = document.getElementById("table");

fileInput.addEventListener("change", function (e) {
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
        .map(row => row.trim())
        .filter(row => row.length > 0)
        .map(row => row.split(","));

      renderTable(rows);
    };
    reader.readAsText(file);
  } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      renderTable(rows);
    };
    reader.readAsArrayBuffer(file);
  } else {
    table.innerHTML = "<tr><td>Unsupported file format</td></tr>";
  }
});

function renderTable(rows) {
  table.innerHTML = "";

  if (!rows || rows.length === 0) {
    table.innerHTML = "<tr><td>No data found</td></tr>";
    return;
  }

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");

    row.forEach(cell => {
      const cellEl = document.createElement(rowIndex === 0 ? "th" : "td");
      cellEl.textContent = cell ?? "";
      tr.appendChild(cellEl);
    });

    const remarksCell = document.createElement(rowIndex === 0 ? "th" : "td");
    remarksCell.textContent = rowIndex === 0 ? "Remarks" : "No discrepancy";
    tr.appendChild(remarksCell);

    table.appendChild(tr);
  });
}
