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
const graphBarContainer = document.querySelector(".graph-bar-container");
const graphFigureNumbers = document.querySelector(".graph-figure-numbers");
const graphPrevBtn = document.querySelector("#graph-view-prev");
const graphNextBtn = document.querySelector("#graph-view-next");
const graphPages = document.querySelector("#graph-view-page");

window.onload = async () => {
  paintScreen();
  graphPrevBtn.addEventListener("click", turnGraphPrev);
  graphNextBtn.addEventListener("click", turnGraphNext);
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
const COMPONENTNAMEMAP = {
  table: "table",
  jsonEditor: "jsonEditor",
};
const BARSNUM = 5;
const observers = {
  //그래프는 메인 스토어와 그래프 페이지네이션 데이터간에 sync를 맞출 때마다 자동으로 리렌더링 되므로 observers에 없습니다
  main: [paintJsonEditor, paintTable],
  table: [paintTable],
};
const mainStore = createStore(observers.main);
const tableStore = createStore(observers.table);
const observedInputs = createEditionChecker(
  [COMPONENTNAMEMAP.table, COMPONENTNAMEMAP.jsonEditor],
  [toggleUndoBtnsDisabled]
);
const graphPage = creatGraphPagenation(0, 5);
/*---------------------------------------------------스토어 및 전역 변수 세팅---------------------------------------------------*/

/*---------------------------------------------------컴포넌트 그리기 관련 로직---------------------------------------------------*/

function paintScreen() {
  paintBarChart();
  paintTable();
  paintJsonEditor();
}

function paintBarChart() {
  const { getCurPages } = graphPage;
  const { getState } = mainStore;
  const mainState = getState();
  const mainStateArray = [...mainState];
  const { pagesAmount, currentPage, curPages } = getCurPages();
  const [firstIdx, lastIdx] = curPages;

  if (mainState.size === 0 || lastIdx === 0) {
    // 데이터가 없으므로 모든 UI를 초기화하고고 eary return
    graphFigureNumbers.innerHTML = `<p>100%</p> <p>50%</p> <p>0%</p>`;
    graphPages.innerHTML = "0/0";

    for (let i = 0; i < BARSNUM; i++) {
      const curBar = document.querySelector(`#bar-${i + 1}`);
      const curBarName = document.querySelector(`#bar-name-${i + 1}`);
      const curBarValue = document.querySelector(`#bar-value-${i + 1}`);

      curBarName.innerHTML = "";
      curBarValue.innerHTML = "";
      curBar.style.height = "0";
    }
    return;
  }

  //메인 스토어에서 데이터를 필요한만큼 슬라이스
  const isOnlyOneBar = !!(firstIdx === lastIdx);
  const stateValues = [...mainState.values()];
  const slicedValues = isOnlyOneBar
    ? mainState[firstIdx][1]
    : stateValues.slice(firstIdx, lastIdx + 1);
  const slicedMainState = isOnlyOneBar
    ? mainState[firstIdx][1]
    : mainStateArray.slice(firstIdx, lastIdx + 1);

  // 슬라이스한 데이터 내에서 가장 큰 값
  const inPagesMax = Math.max(...slicedValues);

  //그래프 y축 지표 그리기
  graphFigureNumbers.innerHTML = `
  <p>${inPagesMax}</p>
  <p>${Math.floor(inPagesMax / 2)}</p>
  <p>0</p>`;
  graphPages.innerHTML = `${currentPage}/${pagesAmount}`;

  //그래프 바 그리기
  for (let i = 0; i < BARSNUM; i++) {
    const [dataId, dataValue] =
      slicedMainState[i] !== undefined ? slicedMainState[i] : ["", 0];
    const curBar = document.querySelector(`#bar-${i + 1}`);
    const curBarName = document.querySelector(`#bar-name-${i + 1}`);
    const curBarValue = document.querySelector(`#bar-value-${i + 1}`);
    const heightPercent = (dataValue / inPagesMax) * 100;

    curBarName.innerHTML = dataId;
    curBarValue.innerHTML = dataValue !== 0 ? dataValue : "";
    curBar.style.height = `${heightPercent}%`;
  }
}

function paintTable() {
  const { onEditionGettor } = observedInputs;
  const onEditionMap = onEditionGettor();
  const tableState = [...tableStore.getState()];

  //테이블 행 그리기
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

  //apply 버튼 disable 여부 결정하기
  const isTableOnEdit = onEditionMap[COMPONENTNAMEMAP.table];
  tableApplyBtn.disabled = isTableOnEdit ? false : true;
}

function paintJsonEditor() {
  const state = mainStore.getState();

  //메인 스토어에 저장된 데이터를 json 편집기에 그려주기에 적합한 포맷으로 편집하기
  const data = [];
  state.forEach((value, key) => {
    data.push({ id: Number(key), value: Number(value) });
  });
  const jsonString = JSON.stringify(data, null, 4);

  const jsonExample = JSON.stringify(
    [
      { id: 1, value: 1 },
      { id: 2, value: 3 },
    ],
    null,
    4
  );

  //json 편집기 내부에 데이터 그려주기
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

/*---------------------------------------------------그래프 컴포넌트 UI 로직---------------------------------------------------*/
function turnGraphPrev() {
  const { setPagesPrev } = graphPage;
  setPagesPrev();
  paintBarChart();
}
function turnGraphNext() {
  const { setPagesNext } = graphPage;
  setPagesNext();
  paintBarChart();
}
/*---------------------------------------------------그래프 컴포넌트 UI 로직---------------------------------------------------*/

/*----------------------------------------------------데이터 테이블 UI 로직----------------------------------------------------*/
function debouncedUpdate(e) {
  const debouncedUpdate = debounce(updateTableValue, 500);
  debouncedUpdate(e);
}

function updateTableValue(e) {
  const numOnly = /^[1-9][0-9]{0,4}$/;
  const isValueNumber = numOnly.test(e.target.value);
  const { onEditionSetter } = observedInputs;

  tableApplyBtn.disabled = !isValueNumber;
  if (!isValueNumber) {
    e.target.style.outline = "0.15rem solid rgb(195, 39, 39)";
    tableEditAlert.innerHTML =
      "! 값에는 다섯자리 이하 자연수만 등록할 수 있습니다.";
    tableEditAlert.style.opacity = 100;
    return;
  }

  e.target.style.outline = "none";
  tableEditAlert.innerHTML = "";
  tableEditAlert.style.opacity = 0;

  onEditionSetter(COMPONENTNAMEMAP.table, true);
}

function deleteTableValue(e) {
  const { onEditionSetter } = observedInputs;
  const { deleteData } = tableStore;
  const isDeleteBtn = e.target.classList.contains("delete-value-btn");
  if (!isDeleteBtn) return;

  const dataId = Number(e.target.id.split("-")[1]);

  onEditionSetter(COMPONENTNAMEMAP.table, true);
  deleteData(dataId);
}

function applyTableData() {
  //아직 수정중인 다른 값 편집기가 있다면 진행 여부 질문
  const isConfirmed = confirmEdition(COMPONENTNAMEMAP.table);
  if (!isConfirmed) return;

  syncStores(tableStore, mainStore);

  //그래프와 그래프 페이지네이션 초기화
  console.log("apply");
  syncGraphMainStore();
}

function undoTableData() {
  const { onEditionSetter } = observedInputs;
  syncStores(mainStore, tableStore);

  onEditionSetter(COMPONENTNAMEMAP.table, false);
}
/*----------------------------------------------------데이터 테이블 UI 로직----------------------------------------------------*/

/*--------------------------------------------------데이터 추가하기 로직--------------------------------------------------*/
function addValue(e) {
  const { addData: addMainData } = mainStore;
  const { addData: addTableData } = tableStore;
  const numOnly = /^[1-9][0-9]{0,4}$/;
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

  //그래프와 그래프 페이지네이션 초기화
  syncGraphMainStore();

  e.target.graphDataId.value = "";
  e.target.graphDataValue.value = "";
  addValueAlert.innerHTML = "";
  addValueAlert.style.opacity = 0;
}
/*--------------------------------------------------데이터 추가하기 로직--------------------------------------------------*/

/*----------------------------------------------------JSON 에디터 관리 로직----------------------------------------------------*/
function checkJsonOnEditTrue() {
  const { onEditionSetter } = observedInputs;
  onEditionSetter(COMPONENTNAMEMAP.jsonEditor, true);
}

function undoJsonInput() {
  const { onEditionSetter } = observedInputs;
  onEditionSetter(COMPONENTNAMEMAP.jsonEditor, false);
  
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
  const isConfirmed = confirmEdition(COMPONENTNAMEMAP.jsonEditor);
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

  //그래프와 그래프 페이지네이션 초기화
  syncGraphMainStore();
}

function verifyJsonInput(jsonStr) {
  if (!isParsable(jsonStr))
    return [
      '입력하신 서식이 JSON이 아닙니다. 다시 입력해주세요. <br>입력 예시: [{"id":1,"value":1},{"id":2,"value":3}]',
    ];

  const jsonPattern =
    /\[\s*(\{\s*"id"\s*:\s*\d+\s*,\s*"value"\s*:\s*\d+\s*\}\s*,\s*)*\{\s*"id"\s*:\s*\d+\s*,\s*"value"\s*:\s*\d+\s*\}\s*\]/;
  const errorList = [];
  const jsonData = JSON.parse(jsonStr);
  const trimedJsonStr = JSON.stringify(jsonData);
  if (!jsonPattern.test(trimedJsonStr))
    errorList.push(
      '입력 내용의 서식이 맞지 않습니다. <br>반드시 숫자 값을 지니는 id와 value를 포함하여 적어주세요. <br>입력 예시: [{"id":2,"value":1},{"id":1,"value":3}]'
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
      errorList.push(`! id와 값에는 다섯자리 이하 자연수만 등록할 수 있습니다`);

    return errorList;
  };

  const addData = ({ id, value }) => {
    const { onEditionGettor } = observedInputs;
    const onEditionMap = onEditionGettor();
    const errorList = [...isValidInput(id, value)];

    //입력값 유효성 검사
    if (id === "" || value === "")
      errorList.push("! id와 값을 모두 입력해주세요");
    if (isDataExist(id))
      errorList.push(`! 이미 id가 ${id}인 데이터가 존재합니다.`);
    if (onEditionMap[COMPONENTNAMEMAP.table])
      errorList.push(
        `팁: 미처 apply하지 않으신 그래프 값 편집하기의 내용을 apply하시고 다시 시도해보세요`
      );

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

function confirmEdition(componentName) {
  const { onEditionGettor, onEditionSetter } = observedInputs;
  const isOnEditMap = onEditionGettor();
  const isOnEditMapEntries = Object.entries(isOnEditMap);
  const isOnEdit = isOnEditMapEntries.some(
    ([key, value]) => componentName !== key && value === true
  );

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

/*---------------------------------------------------그래프 페이지네이션 로직---------------------------------------------------*/
function creatGraphPagenation(maxPage, pages) {
  let pagesAmount = Math.ceil(maxPage / pages);
  let currentPage = 1;
  const curPages = [0, Math.min(maxPage, pages - 1)];

  const getCurPages = () => {
    return {
      pagesAmount,
      currentPage,
      curPages: [...curPages],
    };
  };

  const setPagesPrev = () => {
    if (curPages[0] - pages < 0) {
      return ["첫 페이지입니다, 더 이전으로 넘길 수 없습니다"];
    }
    const newFirstPage = curPages[0] - pages;
    curPages[0] = newFirstPage;
    curPages[1] = newFirstPage + pages;
    currentPage -= 1;
  };

  const setPagesNext = () => {
    if (curPages[0] + pages > maxPage && curPages[1] + pages > maxPage) {
      return ["마지막 페이지입니다, 페이지를 더 넘길 수 없습니다"];
    }
    curPages[0] = Math.min(curPages[0] + pages, maxPage);
    curPages[1] = Math.min(curPages[1] + pages, maxPage);
    currentPage += 1;
  };

  const resetGraphPages = (newmaxPage) => {
    maxPage = newmaxPage;
    pagesAmount = Math.ceil(newmaxPage / pages);
    curPages[0] = 0;
    curPages[1] = Math.min(newmaxPage, pages - 1);
  };

  return { getCurPages, setPagesPrev, setPagesNext, resetGraphPages };
}

function syncGraphMainStore() {
  const { resetGraphPages } = graphPage;
  const { getState } = mainStore;

  const mainState = getState();
  const mainStateSize = mainState.size;

  resetGraphPages(mainStateSize);
  console.log("sync");
  paintBarChart();
}
/*---------------------------------------------------그래프 페이지네이션 로직---------------------------------------------------*/

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
