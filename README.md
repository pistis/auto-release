# auto-release
이것저것 수행한 걸 release 메서드 한번 호출로 되돌리거나 무효화 시키기 편하게 구현

## 사용방법

### 설치
```
bower install https://github.com/hooriza/auto-release.git
```

### 예제로 이해하는 사용방법
```js
var ar = new AutoRelease();

// setTimeout 기능 사용 (바로 밑에서 release 해서 콜백은 실행되지 못함)
ar.timeout(function() {
  console.log('1초 후 실행');
}, 1000);

// setInterval 기능 사용 (바로 밑에서 release 해서 콜백은 실행되지 못함)
ar.timeout(function() {
  console.log('0.1초마다 한번씩 실행');
}, 100);

// requestAnimationFrame 기능 사용 (바로 밑에서 release 해서 콜백은 실행되지 못함)
ar.raf(function() {
  console.log('콜백 실행');
});

// 일반 콜백함수로써의 사용 (바로 밑에서 release 해서 콜백은 실행되지 못함)
document.body.onclick = ar.callback(function() {
  console.log('클릭할때마다 실행');
});

// 객체 설정값 원복
var hello = { world: 'foobar' };
ar.object([ document.body, hello ], { 'style.background', 'world' });
document.body.style.background = 'red'; // release 하면 이전값으로 되돌려짐
hello.world = 'barbaz'; // release 하면 이전값으로 되돌려짐

// 이하는 jQuery/Zepto 와 함꼐 사용 가능한 기능

// $().on 기능 사용 (바로 밑에서 release 해서 이벤트핸들러는 실행되지 못함)
ar.on(document.body, 'click', '.foo', function(evt) {
  console.log('document.body 안의 .foo 엘리먼트를 클릭했을때 실행');
});

// $().ajax 기능 사용 (바로 빝에서 release 해서 abort 됨)
ar.ajax('/path/to/api.json', {
  method: 'POST'
}, function() { ... });

ar.release();
```
