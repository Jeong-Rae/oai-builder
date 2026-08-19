const assets = {
  background: new URL('@/assets/background/background_space.png', import.meta.url).href,
  titlePoint: new URL('@/assets/title/title_point.png', import.meta.url).href,
};

export function createIntroScene(onComplete: () => void): HTMLButtonElement {
  const view = document.createElement('button');
  view.type = 'button';
  view.className = 'game-opening';
  view.style.backgroundImage = `url(${assets.background})`;
  view.setAttribute('aria-label', '게임 시작 화면으로 이동');
  view.addEventListener('click', onComplete);

  const monoTitle = document.createElement('img');
  monoTitle.className = 'game-opening__title game-opening__title--mono';
  monoTitle.src = assets.titlePoint;
  monoTitle.alt = '';

  const colorTitle = document.createElement('img');
  colorTitle.className = 'game-opening__title game-opening__title--color';
  colorTitle.src = assets.titlePoint;
  colorTitle.alt = '';

  const message = document.createElement('p');
  message.className = 'game-opening__message';
  message.textContent = '고양이는 세상을 구할 수 있습니다. 귀엽기 때문이죠.';
  const showMessage = () => message.classList.add('game-opening__message--visible');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) showMessage();
  else colorTitle.addEventListener('animationend', showMessage, { once: true });

  view.append(monoTitle, colorTitle, message);
  return view;
}
