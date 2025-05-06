const addValueForm = document.querySelector("#add-value-form");
const dataTbody = document.querySelector(".data-table-body");
const addValueAlert = document.querySelector("#add-value-alert");

window.onload = async () => {
  paintScreen();
  addValueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addValue(e);
  });
};

const observers = [paintTable];
const store = createStore(observers);

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
  const { addData, isDataExist } = store;
  const dataId = e.target.graphDataId.value;
  const dataValue = e.target.graphDataValue.value;
  
  //입력 유효성 검사
  const errorList = [];

  const numOnly = /^[0-9]*$/;
  if(!dataId.match(numOnly) || !dataValue.match(numOnly)) errorList.push(`! id와 값에는 기호를 제외한 숫자만 등록할 수 있습니다`);
  if (isDataExist(dataId))
    errorList.push(`! 이미 id가 ${dataId}인 데이터가 존재합니다`);
  if (!dataId || !dataValue) errorList.push("! id와 값을 모두 입력해주세요");

  if (errorList.length) {
    addValueAlert.innerHTML=errorList.join('<br>');
    addValueAlert.style.opacity = 100;
    return;
  }

  //데이터 추가
  addValueAlert.style.opacity = 0;
  addData({ id: dataId, value: dataValue });
}

function deleteValue(id) {
  const { deleteData } = store;

  deleteData(id);
}

function createStore(observers) {
  const state = new Map();

  const notify = () => {
    observers.forEach((observer) => observer());
  };

  const isDataExist = (id) => state.has(id);

  const addData = ({ id, value }) => {
    console.log(isDataExist(id));
    if (isDataExist(id)) {
      console.error(`이미 id가 ${id}인 데이터가 존재합니다`);
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
