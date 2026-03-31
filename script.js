document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const text = event.target.result;
    const rows = text.split("\n").map(r => r.split(","));

    const table = document.getElementById("table");
    table.innerHTML = "";

    rows.forEach((row, i) => {
      const tr = document.createElement("tr");

      row.forEach(cell => {
        const td = document.createElement(i === 0 ? "th" : "td");
        td.textContent = cell;
        tr.appendChild(td);
      });

      // Add Remarks column
      const remarks = document.createElement("td");
      remarks.textContent = i === 0 ? "Remarks" : "No discrepancy";
      tr.appendChild(remarks);

      table.appendChild(tr);
    });
  };

  reader.readAsText(file);
});
