const addValueForm = document.querySelector("#add-value-form");
const dataTbody = document.querySelector(".data-table-body");
const addValueAlert = document.querySelector("#add-value-alert");
const tableUndoBtn = document.querySelector("#table-editor-undo");
const tableApplyBtn = document.querySelector("#table-editor-apply");

window.onload = async () => {
  paintScreen();
  tableUndoBtn.addEventListener("click", undoTableData);
  tableApplyBtn.addEventListener("click", applyTableData);
  addValueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addValue(e);
  });
};

//const mainObservers = [paintTable];
const mainStore = createStore();
const tableStore = createStore([paintTable]);

const paintScreen = () => {
  paintTable();
};

const applyTableData = () => {
  const { changeState } = mainStore;
  const { getState } = tableStore;
  const newState = getState();

  changeState(newState);
};

const undoTableData = () => {
  const { getState } = mainStore;
  const { changeState } = tableStore;
  const newState = getState();

  changeState(newState);
};

function paintTable() {
  const state = [...tableStore.getState()];

  dataTbody.innerHTML = "";
  state.forEach(([id, value]) => {
    dataTbody.innerHTML += `
    <tr class=data-table-row">
      <td>${id}</td>
      <td><input type="text" value="${value}"></td>
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
  const { addData: addMainData } = mainStore;
  const { addData: addTableData } = tableStore;
  const dataId = e.target.graphDataId.value;
  const dataValue = e.target.graphDataValue.value;

  const errorList = addMainData({ id: dataId, value: dataValue });

  if (errorList.length) {
    addValueAlert.innerHTML = errorList.join("<br>");
    addValueAlert.style.opacity = 100;
    return;
  }

  addTableData({ id: dataId, value: dataValue });
  e.target.graphDataId.value = "";
  e.target.graphDataValue.value = "";
  addValueAlert.innerHTML = "";
  addValueAlert.style.opacity = 0;
}

function deleteValue(id) {
  const { deleteData } = tableStore;

  deleteData(id);
}

//스토어 생성
function createStore(observers=[]) {
  let state = new Map();

  const notify = () => {
    if (!observers.length) return;
    observers.forEach((observer) => observer());
  };

  const setState = ({ id, value }) => {
    state.set(id, value);
    notify();
  };

  const changeState = (newState) => {
    state = newState;
    notify();
  };

  const isDataExist = (id) => state.has(id);

  const isValidInput = (id = '0', value = '0') => {
    const numOnly = /^[0-9]*$/;
    const errorList = [];

    if (!id.match(numOnly) || !value.match(numOnly))
      errorList.push(`! id와 값에는 기호를 제외한 숫자만 등록할 수 있습니다`);

    return errorList;
  };

  const addData = ({ id, value }) => {
    const errorList = [...isValidInput(id, value)];

    //입력값 유효성 검사
    if (isDataExist(id))
      errorList.push(`! 이미 id가 ${id}인 데이터가 존재합니다`);
    if (!id || !value) errorList.push("! id와 값을 모두 입력해주세요");

    if (!errorList.length) setState({ id, value });

    return errorList;
  };

  const updateData = ({ id, value }) => {
    const errorList = [...isValidInput(id, value)];

    //입력값 유효성 검사
    if (!isDataExist(id)) errorList.push(`! id가 ${id}인 데이터가 없습니다.`);
    if (!value) errorList.push("! 값을 입력해주세요");

    if (!errorList.length) setState({ id, value });

    return errorList;
  };

  const deleteData = (id) => {
    const errorList = [...isValidInput(id)];

    //입력값 유효성 검사
    if (!isDataExist(id)) errorList.push(`! id가 ${id}인 데이터가 없습니다.`);

    if (!errorList.length) {
      state.delete(id);
      notify();
    }

    return errorList;
  };

  return {
    changeState,
    addData,
    updateData,
    deleteData,
    isDataExist,
    subscribe: (observer) => observers.push(observer),
    getState: () => new Map(state),
  };
}
