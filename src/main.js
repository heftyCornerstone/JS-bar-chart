const addValueForm = document.querySelector("#add-value-form");
const dataTbody = document.querySelector(".data-table-body");

window.onload = async () => {
  paintScreen();
  addValueForm.addEventListener("submit", addValue);
};

const store = createStore([[0, 0]], [paintTable]);

function paintScreen() {
  paintTable();
}

function paintTable() {
  const state = store.getState();
  let tableRow = "";

  [...state].forEach(([id, value]) => {
    tableRow += `
    <tr class="data-table-row">
      <td>${id}</td>
      <td>${value}</td>
      <td><button type="button" class="delete-value-btn">삭제</button></td>
    </tr>
    `;
  });
  dataTbody.innerHTML = tableRow;
}

function addValue(e) {
  e.preventDefault();

  const { addData } = store;
  const dataId = e.target.graphDataId.value;
  const dataValue = e.target.graphDataValue.value;

  addData({ id: dataId, value: dataValue });
}

function createStore(initialState, observers) {
  const state = new Map(initialState);

  const notify = () => {
    observers.forEach((observer) => observer());
  };

  const isDataExist = (id) => state.has(id);

  const addData = ({ id, value }) => {
    if (isDataExist(id)) {
      alert(`이미 id가 ${id}인 데이터가 존재합니다!`);
      return;
    }
    state.set(id, value);
    notify();
  };

  const updateData = ({ id, value }) => {
    if (!isDataExist(id)) {
      alert(`id가 ${id}인 데이터가 없습니다.`);
      return;
    }
    state.set(id, value);
    notify();
  };

  const deleteData = (id) => {
    if (!isDataExist(id)) {
      alert(`id가 ${id}인 데이터가 없습니다.`);
      return;
    }
    state.delete(id);
    notify();
  };

  return {
    addData,
    updateData,
    deleteData,
    isDataExist,
    subscribe: (observer) => observers.push(observer),
    getState: () => new Map(state),
  };
}
