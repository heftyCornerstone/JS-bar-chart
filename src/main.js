const addValueForm = document.querySelector("#add-value-form");
const dataTbody = document.querySelector(".data-table-body");

const dummy = [
  { id: 0, value: 0 },
  { id: 1, value: 1 },
];

window.onload = async () => {
  addValueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const dataId = e.target.graphDataId.value;
    const dataValue = e.target.graphDataValue.value
    const curTRows = dataTbody.innerHTML;
    const newRow = `
    <tr class="data-table-row">
      <td>${dataId}</td>
      <td>${dataValue}</td>
      <td><button type="button" class="delete-value-btn">삭제</button></td>
    </tr>
    `;
    
    dataTbody.innerHTML = curTRows + newRow;
  });
};
