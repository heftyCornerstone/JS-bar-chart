# JS-bar-chart

# 목차

1. [기능별 소개](#기능별-소개)
2. [트러블 슈팅](#트러블-슈팅)

<br><br><br><br>

# 기능별 소개

### 막대그래프
<p align='center'>
<img width='70%' src='https://velog.velcdn.com/images/heftycornerstone/post/9fce769a-62a4-4125-ac3f-898689b03221/image.png'>
<p/>
  
- 데이터의 id와 value 표시
- 그래프 옆 표시되는 최대값과 중간값은 현재 보여주고 있는 데이터들을 기준으로 함

<br>

#### 유저 편의적 요소
- 그래프 페이지네이션 <br>
	-> 이전 보기, 다음 보기 버튼과 현재 페이지 표시

<br><br><br>

### 그래프 값 편집하기(표 편집기)
<p align='center'>
<img width='70%' src='https://velog.velcdn.com/images/heftycornerstone/post/824c8a82-5197-4a9d-b088-d6f185a441e5/image.png'>
<p/>
  
- 데이터 수정 및 삭제 
- Apply 버튼을 눌러야 데이터에 반영

<br>

#### 유저 편의적 요소
- undo 버튼
- undo 버튼과 apply 버튼은 활성화 상태가 토글 됨
- 수정 값 유효성 실시간 검증
	- 값의 포맷이 잘못 된 인풋 박스에 붉은 강조선을 넣어 가시성 부각
	- 경고 메세지로 올바른 입력 유도
	- 모든 값의 포맷이 올바를 때 apply 버튼 활성화

<br><br><br>

### 그래프에 값 추가하기(인풋 박스 편집기)
<br>

<p align='center'>
<img width='40%' src='https://velog.velcdn.com/images/heftycornerstone/post/59ed65f5-effa-4f25-82dc-e4934cb23100/image.png'>
<p/>
  
-  데이터 추가

<br>

#### 유저 편의적 요소
- 경고 메세지

<br><br><br>

### 그래프 값 고급 편집
<p align='center'>
<img width='50%' src='https://velog.velcdn.com/images/heftycornerstone/post/c7f18f85-7a01-4ad0-a1b9-a27f285181e6/image.png'>
<p/>
  
- 데이터 수정 및 삭제

<br>

#### 유저 편의적 요소
- placeholder로 입력 예시 제공
- undo 버튼
- undo 버튼은 활성화 상태가 토글 됨
- 경고 메세지

<br><br><br><br><br>

# 트러블 슈팅

### 1. 표 편집기, 인풋 박스 편집기의 비효율적인 UI 구조로 인한 불편 해결

---

#### 비효율적 UI 구조
표 편집기는 CRUD에서 RUD 기능, 인풋 박스 편집기는 C기능을 갖고 있음. <br>
**두가지를 모두 사용하여야 완전한 CRUD** 기능을 사용할 수 있으므로 <br>
유저는 자연스럽게 둘을 하나의 컴포넌트처럼 함께 사용하게 됨. <br>
- **표 편집기에서 수정한 내용을 아직 apply하지 않았음에도 <br>
  이를 잊고 인풋 박스 편집기를 사용하려는 시도 빈번할 것으로 예상.** 

<br>

#### 비효율적 UI 구조가 만드는 문제 케이스
<p align='center'>
<img width='50%' src='https://velog.velcdn.com/images/heftycornerstone/post/f25afc96-66b2-492c-bfee-f69f93a80f89/image.png'>
<p/>
  
위에서 언급한 문제는 보통 크게 불편을 일으키지 않으나 아래 케이스는 유저의 편의성을 해침.
<br>
1. 표 편집기에서 어느 데이터 삭제, 표에서 데이터 사라짐
2. 표 편집기 수정 내용을 apply 하지 않았다는 것 망각
3. 인풋 박스 편집기에서 삭제한 데이터와 같은 id로 데이터 추가 시도
4. 유효성 검증 통과하지 못함, **이미 같은 id로 데이터가 있습니다 경고 문구 노출**
5. **그러나 표에서는 해당 데이터가 없는 것처럼 보임** <br>
   apply 버튼 활성화 상태 및 그래프와 고급 편집기를 확인하면 원인을 추론할 수 있으나, <br>
   비직관적이므로 유저가 쉽게 해결책을 떠올릴 수 없음.

<br><br>

### 해결

<p align='center'>
<img width='50%' src='https://velog.velcdn.com/images/heftycornerstone/post/1b614816-ad9d-465b-9a1d-12133773d044/image.png'>
<p/>
  
인풋 박스 편집기에서 이미 존재하는 id로 데이터 추가를 시도하여 유효성 검증을 통과하지 못하였으나 <br>
표 편집기의 수정 내용을 아직 apply하지 않았다면, <br>
**표 편집기의 내용을 undo해볼 것을 경고 문구로 유도.**

<br><br><br>

### 2. 유저의 망각으로 인한 데이터 수정 충돌 해결
---

#### 문제 정의
- 유저가 기록하여 데이터를 수정할 수 있는 편집기는 표 편집기와 고급 편집기로 총 2개
- 두 편집기 모두 apply 버튼을 눌러야 최종적으로 반영
- 유저는 자신이 수정 내용을 apply하지 않았음을 망각하기 쉬움 <br>
  이는 기록하여 수정하는 UI의 편의성에 큰 불편을 초래 <br>
	-> **한 편집기에서 수정중이라는 사실을 잊고 다른 편집기의 내용을 apply하면 <br>
	이전에 사용하던 편집기에 작성해둔 내용을 잃는다.**

<br><br>

### 해결
<p align='center'>
<img width='50%' src='https://velog.velcdn.com/images/heftycornerstone/post/c4cfe6e7-0ea4-4302-9b74-8e5a3b67195f/image.png'>
<p/>
  
- 표 편집기와 고급 편집기의 apply 버튼 클릭 시 다른 편집기의 수정 상태 체크, <br>
  **만일 수정중이라면 유저에게 작성하던 내용을 잃게 되더라도 진행할지 질문.**
