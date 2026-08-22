const plateImage = new URL("@/assets/button/button_plate.png", import.meta.url).href;

export function createPlateButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "plate-button";
  button.style.fontFamily = "'온글잎 박다현체', monospace";
  button.style.backgroundImage = `url(${plateImage})`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}
