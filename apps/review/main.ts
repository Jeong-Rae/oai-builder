import { mountReviewApp } from "@/src/editor/review/reviewApp";

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("Review app root element was not found.");
}

mountReviewApp(app);
