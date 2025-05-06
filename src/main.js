const addValueForm = document.querySelector("#add-value-form");
const dataTbody = document.querySelector(".data-table-body");

window.onload = async () => {
  paintScreen();
  addValueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addValue(e);
  });
};

const observers = [paintTable];
const store = createStore(observers, [[0, 0]]);

function paintScreen() {
  paintTable();
}

function paintTable() {
  const state = [...store.getState()];

  dataTbody.innerHTML = "";
  state.forEach(([id, value]) => {
    dataTbody.innerHTML += `
    <tr class=data-table-row">
      <td>${id}</td>
      <td>${value}</td>
      <td><button type="button" class="delete-value-btn" id='delete-${id}'>삭제</button></td>
    </tr>
    `;
  });

  state.forEach(([id, _]) => {
    const deleteBtn = dataTbody.querySelector(`#delete-${id}`);
    deleteBtn.addEventListener("click", () => {
      deleteValue(id);
    });
  });
}

function addValue(e) {
  const { addData } = store;
  const dataId = e.target.graphDataId.value;
  const dataValue = e.target.graphDataValue.value;

  addData({ id: dataId, value: dataValue });
}

function deleteValue(id) {
  const { deleteData } = store;

  deleteData(id);
}

function createStore(observers, initialState) {
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
