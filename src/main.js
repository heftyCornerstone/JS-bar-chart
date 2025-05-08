const addValueForm = document.querySelector("#add-value-form");
const addValueAlert = document.querySelector("#add-value-alert");
const dataTable = document.querySelector("#data-table");
const dataTbody = document.querySelector(".data-table-body");
const tableUndoBtn = document.querySelector("#table-editor-undo");
const tableApplyBtn = document.querySelector("#table-editor-apply");
const tableEditAlert = document.querySelector("#table-edit-alert");
const jsonEditorForm = document.querySelector("#edit-value-advanced");
const jsonEditor = document.querySelector("#edit-value-advanced-txt");
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
};

/*---------------------------------------------------스토어 및 전역 상태 세팅---------------------------------------------------*/
const observers = {
  main: [paintJsonEditor, paintTable],
  table: [paintTable],
};
const mainStore = createStore(observers.main);
const tableStore = createStore(observers.table);
//const observedInputs = createEditionChecker(["table", "jsonEditor"]);
//이벤트 위임으로 처리하기
/*---------------------------------------------------스토어 및 전역 상태 세팅---------------------------------------------------*/

/*---------------------------------------------------컴포넌트 그리기 관련 로직---------------------------------------------------*/

function paintScreen() {
  paintTable();
  //paintBarChart
  paintJsonEditor();
}

function paintTable() {
  const state = [...tableStore.getState()];

  dataTbody.innerHTML = "";
  state.forEach(([id, value]) => {
    dataTbody.innerHTML += `
    <tr class=data-table-row">
      <td>${id}</td>
      <td><input type="text" value="${value}" class="update-value-input" id="update-${id}"></td>
      <td><button type="button" class="delete-value-btn" id='delete-${id}'>삭제</button></td>
    </tr>
    `;
  });
  tableApplyBtn.disabled = dataTbody.innerHTML === "" ? true : false;
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
  data.length
    ? (jsonEditor.value = jsonString)
    : (jsonEditor.placeholder = valueExample);
}

/*---------------------------------------------------컴포넌트 그리기 관련 로직---------------------------------------------------*/

/*----------------------------------------------------데이터 테이블 관리 로직----------------------------------------------------*/
function debouncedUpdate(e) {
  const debouncedUpdate = debounce(updateTableValue, 500);
  debouncedUpdate(e);
}

function updateTableValue(e) {
  const numOnly = /^[0-9]+$/;
  const isValueNumber = numOnly.test(e.target.value);

  tableApplyBtn.disabled = !isValueNumber;
  if (!isValueNumber) {
    e.target.style.outline = "0.15rem solid red";
    tableEditAlert.innerHTML =
      "! 값에는 공백과 기호를 제외한 숫자만 등록할 수 있습니다.";
    tableEditAlert.style.opacity = 100;
    return;
  }

  e.target.style.outline = "none";
  tableEditAlert.innerHTML = ""
  tableEditAlert.style.opacity = 0;
}

function deleteTableValue(e) {
  const { deleteData } = tableStore;
  const isDeleteBtn = e.target.classList.contains("delete-value-btn");
  if (!isDeleteBtn) return;

  const dataId = Number(e.target.id.split("-")[1]);

  deleteData(dataId);
}

function applyTableData() {
  syncStores(tableStore, mainStore);
}

function undoTableData() {
  syncStores(mainStore, tableStore);
}
/*----------------------------------------------------데이터 테이블 관리 로직----------------------------------------------------*/

/*--------------------------------------------------데이터 추가 인풋 박스 로직--------------------------------------------------*/
function addValue(e) {
  const { addData: addMainData } = mainStore;
  const { addData: addTableData } = tableStore;
  const numOnly = /^[0-9]+$/;
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

  // json 편집기의 내용은 보존하지 않는다는 점 고지, 그래도 괜찮을지 묻기.

  addTableData({ id: dataId, value: dataValue });
  e.target.graphDataId.value = "";
  e.target.graphDataValue.value = "";
  addValueAlert.innerHTML = "";
  addValueAlert.style.opacity = 0;
}
/*--------------------------------------------------데이터 추가 인풋 박스 로직--------------------------------------------------*/

/*----------------------------------------------------JSON 에디터 관리 로직----------------------------------------------------*/
function applyJsonInput(e) {
  const { changeState: changeMainState } = mainStore;
  const jsonStr = e.target["edit-value-advanced-txt"].value;

  //입력 유효성 검사
  const errorList = verifyJsonInput(jsonStr);

  if (errorList.length !== 0) {
    jsonEditorAlert.innerHTML = errorList.join("\n");
    jsonEditorAlert.style.opacity = 100;
    return;
  }
  //테이블 상태도 업데이트 해야하므로 만일 테이블에 반영되지 않은 수정 내용이 있다면 재차 물어볼 것.

  //메인 스토어와 테이블 스토어 업데이트
  const jsonData = JSON.parse(jsonStr);
  const newState = new Map();
  jsonData.forEach(({ id, value }) => newState.set(id, value));

  jsonEditorAlert.innerHTML = "";
  jsonEditorAlert.style.opacity = 0;
  changeMainState(newState);
  syncStores(mainStore, tableStore);
}

function verifyJsonInput(jsonStr) {
  if (!isParsable(jsonStr))
    return [
      '입력하신 서식이 JSON이 아닙니다. 다시 입력해주세요. 입력 예시: [{"id":0,"value":0},{"id":1,"value":3}]',
    ];

  const jsonPattern =
    /\[\s*(\{\s*"id"\s*:\s*\d+\s*,\s*"value"\s*:\s*\d+\s*\}\s*,\s*)*\{\s*"id"\s*:\s*\d+\s*,\s*"value"\s*:\s*\d+\s*\}\s*\]/;
  const errorList = [];
  const jsonData = JSON.parse(jsonStr);
  const trimedJsonStr = JSON.stringify(jsonData);
  if (!jsonPattern.test(trimedJsonStr))
    errorList.push(
      '입력 내용의 서식이 맞지 않습니다. \n반드시 숫자 값을 지니는 id와 value를 포함하여 적어주세요. \n입력 예시: [{"id":0,"value":0},{"id":1,"value":3}]'
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
      errorList.push(`! id와 값에는 공백과 기호를 제외한 숫자만 등록할 수 있습니다`);

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

  const updateData = (inputList) => {
    const errorList = [
      /*...isValidInput(id, value)*/
    ];

    //입력값 유효성 검사
    const noIdList = [];
    let notPairedNum = 0;
    for (const data of inputList) {
      if (!data.id || !data.value) {
        notPairedNum += 1;
        continue;
      }
      if (!isDataExist(data.id)) noIdList.push(id);
    }

    if (!noIdList.length)
      errorList.push(
        `! 다음 아이디는 데이터베이스에 존재하지 않습니다 : ${noIdList.join(
          ", "
        )}`
      );
    if (!notPairedNum)
      errorList.push(
        `! 아이디와 값을 모두 입력하지 않은 데이터가 ${notPairedNum}개 있어요`
      );
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
    updateData,
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

/*-----------------------------------------------------전역 상태 생성 로직-----------------------------------------------------*/

// function createEditionChecker(checkList = []) {
//   const onEditionInputs = {};
//   checkList.forEach((checkItem) => {
//     onEditionInputs[checkItem] = false;
//   });

//   const getOnEditionInputs = () => {
//     return { ...onEditionInputs };
//   };

//   const onEditionSetter = (name, bool) => {
//     if (!onEditionInputs[name]) {
//       console.error(`${name}이 onEditionInputs에 존재하지 않습니다`);
//       return;
//     }
//     onEditionInputs[name] = bool;
//   };

//   return { getOnEditionInputs, onEditionSetter };
// };

/*-----------------------------------------------------전역 상태 생성 로직-----------------------------------------------------*/

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
