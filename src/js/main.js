import { createIcons, Images } from "lucide";
import "../styles/main.css";

createIcons({
  icons: {
    Images
  }
});

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Application root "#app" was not found.');
}
