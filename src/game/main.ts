import { GameApp } from "./gameApp";
import "../style.css";
import "@/src/cursor.css";

new GameApp(document.querySelector<HTMLElement>("#app")!);
