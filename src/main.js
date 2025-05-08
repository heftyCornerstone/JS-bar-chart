const addValueForm = document.querySelector("#add-value-form");
const addValueAlert = document.querySelector("#add-value-alert");
const dataTable = document.querySelector("#data-table");
const dataTbody = document.querySelector(".data-table-body");
const tableUndoBtn = document.querySelector("#table-editor-undo");
const tableApplyBtn = document.querySelector("#table-editor-apply");
const tableEditAlert = document.querySelector("#table-edit-alert");
const jsonEditorForm = document.querySelector("#edit-value-advanced");
const jsonEditor = document.querySelector("#edit-value-advanced-txt");
const jsonEditorUndoBtn = document.querySelector("#json-editor-undo");
const jsonEditorAlert = document.querySelector("#edit-value-advanced-alert");

window.onload = async () => {
  paintScreen();
  dataTable.addEventListener("click", (e) => {
    const isDeleteBtn = e.target.classList.contains("delete-value-btn");
    if (isDeleteBtn) deleteTableValue(e);
  });
  dataTable.addEventListener("input", (e) => {
    const isUpdateInput = e.target.classList.contains("update-value-input");
    if (isUpdateInput) debouncedUpdate(e);
  });
  tableUndoBtn.addEventListener("click", undoTableData);
  tableApplyBtn.addEventListener("click", applyTableData);
  addValueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addValue(e);
  });
  jsonEditorForm.addEventListener("submit", (e) => {
    e.preventDefault();
    applyJsonInput(e);
  });
  jsonEditorForm.addEventListener("input", checkJsonOnEditTrue);
  jsonEditorUndoBtn.addEventListener("click", undoJsonInput);
};

/*---------------------------------------------------스토어 및 전역 변수 세팅---------------------------------------------------*/
const UNDONAMEMAP = {
  tableUndoBtn: "table",
  jsonEditorUndoBtn: "jsonEditor",
};
const observers = {
  main: [paintJsonEditor, paintTable],
  table: [paintTable],
};
const mainStore = createStore(observers.main);
const tableStore = createStore(observers.table);
const observedInputs = createEditionChecker(
  [UNDONAMEMAP.tableUndoBtn, UNDONAMEMAP.jsonEditorUndoBtn],
  [toggleUndoBtnsDisabled]
);
//이벤트 위임으로 처리하기
/*---------------------------------------------------스토어 및 전역 변수 세팅---------------------------------------------------*/

/*---------------------------------------------------컴포넌트 그리기 관련 로직---------------------------------------------------*/

function paintScreen() {
  paintTable();
  //paintBarChart
  paintJsonEditor();
}

function paintTable() {
  const tableState = [...tableStore.getState()];
  const mainState = [...mainStore.getState()];

  dataTbody.innerHTML = "";
  tableState.forEach(([id, value]) => {
    dataTbody.innerHTML += `
    <tr class=data-table-row">
      <td>${id}</td>
      <td><input type="text" value="${value}" class="update-value-input" id="update-${id}"></td>
      <td><button type="button" class="delete-value-btn" id='delete-${id}'>삭제</button></td>
    </tr>
    `;
  });
  tableApplyBtn.disabled = mainState.length === 0 ? true : false;
}

function paintJsonEditor() {
  const state = mainStore.getState();
  const data = [];
  state.forEach((value, key) => {
    data.push({ id: Number(key), value: Number(value) });
  });

  const jsonString = JSON.stringify(data, null, 4);
  const jsonExample = JSON.stringify(
    [
      { id: 0, value: 0 },
      { id: 1, value: 3 },
    ],
    null,
    4
  );
  const valueExample = `// 입력 예시입니다. 공백과 줄바꿈은 지키지 않아도 됩니다. \n ${jsonExample}`;
  jsonEditor.placeholder = valueExample;
  jsonEditor.value = data.length ? jsonString : "";
}

function toggleUndoBtnsDisabled() {
  const { onEditionGettor } = observedInputs;
  const onEditionMap = onEditionGettor();
  const onEditionEntries = Object.entries(onEditionMap);
  onEditionEntries.forEach(([componentName, isOnEdit]) => {
    if (componentName === "table") tableUndoBtn.disabled = !isOnEdit;
    if (componentName === "jsonEditor") jsonEditorUndoBtn.disabled = !isOnEdit;
  });
}
/*---------------------------------------------------컴포넌트 그리기 관련 로직---------------------------------------------------*/

/*----------------------------------------------------데이터 테이블 관리 로직----------------------------------------------------*/
function debouncedUpdate(e) {
  const debouncedUpdate = debounce(updateTableValue, 500);
  debouncedUpdate(e);
}

function updateTableValue(e) {
  const numOnly = /^[1-9][0-9]*$/;
  const isValueNumber = numOnly.test(e.target.value);
  const { onEditionSetter } = observedInputs;

  tableApplyBtn.disabled = !isValueNumber;
  if (!isValueNumber) {
    e.target.style.outline = "0.15rem solid rgb(195, 39, 39)";
    tableEditAlert.innerHTML =
      "! 값에는 자연수만 등록할 수 있습니다.";
    tableEditAlert.style.opacity = 100;
    return;
  }

  e.target.style.outline = "none";
  tableEditAlert.innerHTML = "";
  tableEditAlert.style.opacity = 0;

  onEditionSetter(UNDONAMEMAP.tableUndoBtn, true);
}

function deleteTableValue(e) {
  const { onEditionSetter } = observedInputs;
  const { deleteData } = tableStore;
  const isDeleteBtn = e.target.classList.contains("delete-value-btn");
  if (!isDeleteBtn) return;

  const dataId = Number(e.target.id.split("-")[1]);

  deleteData(dataId);
  onEditionSetter(UNDONAMEMAP.tableUndoBtn, true);
}

function applyTableData() {
  //아직 수정중인 다른 값 편집기가 있다면 진행 여부 질문
  const isConfirmed = confirmEdition();
  if (!isConfirmed) return;

  syncStores(tableStore, mainStore);
}

function undoTableData() {
  syncStores(mainStore, tableStore);
}
/*----------------------------------------------------데이터 테이블 관리 로직----------------------------------------------------*/

/*--------------------------------------------------데이터 추가하기 로직--------------------------------------------------*/
function addValue(e) {
  const { addData: addMainData } = mainStore;
  const { addData: addTableData } = tableStore;
  const numOnly = /^[1-9][0-9]*$/;
  const rawDataId = e.target.graphDataId.value;
  const rawDataValue = e.target.graphDataValue.value;
  const dataId = numOnly.test(rawDataId) ? Number(rawDataId) : rawDataId;
  const dataValue = numOnly.test(rawDataValue)
    ? Number(rawDataValue)
    : rawDataValue;

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
/*--------------------------------------------------데이터 추가하기 로직--------------------------------------------------*/

/*----------------------------------------------------JSON 에디터 관리 로직----------------------------------------------------*/
function checkJsonOnEditTrue() {
  const { onEditionSetter } = observedInputs;
  onEditionSetter(UNDONAMEMAP.jsonEditorUndoBtn, true);
}

function undoJsonInput() {
  paintJsonEditor();
}

function applyJsonInput(e) {
  const { changeState: changeMainState } = mainStore;
  const jsonStr = e.target["edit-value-advanced-txt"].value;

  //입력 유효성 검사
  const errorList = verifyJsonInput(jsonStr);

  if (errorList.length !== 0) {
    jsonEditorAlert.innerHTML = errorList.join("\n");
    jsonEditorAlert.style.opacity = 100;
    jsonEditor.style.outline = "0.15rem solid rgb(195, 39, 39)";
    return;
  }

  //아직 수정중인 다른 값 편집기가 있다면 진행 여부 질문
  const isConfirmed = confirmEdition();
  if (!isConfirmed) return;

  //메인 스토어와 테이블 스토어 업데이트
  const jsonData = JSON.parse(jsonStr);
  const newState = new Map();
  jsonData.forEach(({ id, value }) => newState.set(id, value));

  jsonEditorAlert.innerHTML = "";
  jsonEditorAlert.style.opacity = 0;
  jsonEditor.style.outline = "none";
  changeMainState(newState);
  syncStores(mainStore, tableStore);
}

function verifyJsonInput(jsonStr) {
  if (!isParsable(jsonStr))
    return [
      '입력하신 서식이 JSON이 아닙니다. 다시 입력해주세요. <br>입력 예시: [{"id":0,"value":0},{"id":1,"value":3}]',
    ];

  const jsonPattern =
    /\[\s*(\{\s*"id"\s*:\s*\d+\s*,\s*"value"\s*:\s*\d+\s*\}\s*,\s*)*\{\s*"id"\s*:\s*\d+\s*,\s*"value"\s*:\s*\d+\s*\}\s*\]/;
  const errorList = [];
  const jsonData = JSON.parse(jsonStr);
  const trimedJsonStr = JSON.stringify(jsonData);
  if (!jsonPattern.test(trimedJsonStr))
    errorList.push(
      '입력 내용의 서식이 맞지 않습니다. <br>반드시 숫자 값을 지니는 id와 value를 포함하여 적어주세요. <br>입력 예시: [{"id":0,"value":0},{"id":1,"value":3}]'
    );

  const idSet = new Set();
  const duplicatedIds = [];
  for (const item of jsonData) {
    const { id } = item;
    idSet.has(id) ? duplicatedIds.push(id) : idSet.add(id);
  }

  if (duplicatedIds.length)
    errorList.push(
      `! 다음 아이디들이 중복되었습니다 : ${duplicatedIds.join(", ")}`
    );

  return errorList;
}

function isParsable(str) {
  try {
    if (!isNaN(Number(str))) return false;
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
/*----------------------------------------------------JSON 에디터 관리 로직----------------------------------------------------*/

/*---------------------------------------------------스토어 생성 및 관리 로직---------------------------------------------------*/
function createStore(observers = []) {
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

  const isValidInput = (id = 0, value = 0) => {
    const errorList = [];
    const invalidItems = [id, value].filter(
      (c) => c !== "" && typeof c !== "number"
    );

    if (invalidItems.length)
      errorList.push(
        `! id와 값에는 자연수만 등록할 수 있습니다`
      );

    return errorList;
  };

  const addData = ({ id, value }) => {
    const errorList = [...isValidInput(id, value)];

    //입력값 유효성 검사
    if (id === "" || value === "")
      errorList.push("! id와 값을 모두 입력해주세요");
    if (isDataExist(id))
      errorList.push(`! 이미 id가 ${id}인 데이터가 존재합니다.`);
    //혹시 그래프 값 편집하기의 내용을 아직 apply하지 않으셨나요?

    if (!errorList.length) setState({ id, value });

    return errorList;
  };

  const deleteData = (id) => {
    if (typeof id !== "number") return ["id의 type이 number가 아닙니다"];

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
    deleteData,
    isDataExist,
    subscribe: (observer) => observers.push(observer),
    getState: () => new Map(state),
  };
}

function syncStores(originStore, takerStore) {
  if (!originStore.getState || !takerStore.changeState) {
    console.error("인자로 넘겨받은 값이 syncStores의 대상 스토어가 아닙니다");
    return;
  }

  const { getState } = originStore;
  const { changeState } = takerStore;
  const newState = getState();

  changeState(newState);
}
/*---------------------------------------------------스토어 생성 및 관리 로직---------------------------------------------------*/

/*-----------------------------------------------------작성중 여부 기록 로직-----------------------------------------------------*/

function createEditionChecker(checkList = [], observers = []) {
  const onEditionInputs = {};
  checkList.forEach((checkItem) => {
    onEditionInputs[checkItem] = false;
  });

  const notify = () => {
    if (!observers.length) return;
    observers.forEach((observer) => observer());
  };

  const onEditionGettor = () => {
    return { ...onEditionInputs };
  };

  const onEditionSetter = (name, bool) => {
    if (onEditionInputs[name] === undefined) {
      console.error(`${name}이 onEditionInputs에 존재하지 않습니다`);
      return;
    }
    if (typeof bool !== "boolean") {
      console.error(
        `두번째 인자의 type이 boolean이 아닌 ${typeof bool}입니다.`
      );
      return;
    }
    onEditionInputs[name] = bool;
    notify();
  };

  return { onEditionGettor, onEditionSetter };
}

function confirmEdition() {
  const { onEditionGettor, onEditionSetter } = observedInputs;
  const isOnEditMap = onEditionGettor();
  const isOnEditMapEntries = Object.entries(isOnEditMap);
  const isOnEdit = isOnEditMapEntries.some(([key, value]) => value === true);

  if (isOnEdit) {
    const isConfirmed = confirm(
      "다른 편집기에서 \n아직 Apply하지 않으신 수정 내용이 사라집니다. \n진행할까요?"
    );
    if (!isConfirmed) return false;
  }

  //수정중 여부 업데이트
  isOnEditMapEntries.forEach(([key, value]) => {
    onEditionSetter(key, false);
  });
  return true;
}
/*-----------------------------------------------------작성중 여부 기록 로직-----------------------------------------------------*/

/*-------------------------------------------------------기타 범용 로직-------------------------------------------------------*/
function debounce(func, delay) {
  let prevEvent;
  return (...args) => {
    clearTimeout(prevEvent);
    prevEvent = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
/*-------------------------------------------------------기타 범용 로직-------------------------------------------------------*/
