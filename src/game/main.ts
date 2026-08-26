import { GameApp } from "./gameApp";
import { installInspectorBridge } from "@/src/game/inspector/bridge";
import "../style.css";
import "@/src/cursor.css";

new GameApp(document.querySelector<HTMLElement>("#app")!);

const uninstallInspectorBridge = installInspectorBridge();
window.addEventListener("pagehide", uninstallInspectorBridge, { once: true });
