import { mountEditor } from "./editorApp";
import "./style.css";
import "@/src/cursor.css";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Map Editor root element was not found.");
}

const unmount = mountEditor(app);
window.addEventListener("pagehide", unmount, { once: true });
