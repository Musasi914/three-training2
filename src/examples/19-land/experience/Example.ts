import Experience from "./Experience";
import { Book } from "./world/Book";

export default class Example {
  experience: Experience;
  scene: Experience["scene"];
  gui: Experience["gui"];
  resource: Experience["resource"];

  pages: {
    front: string;
    back: string;
  }[];
  book: Book;

  currentPage = 0;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.gui = this.experience.gui;
    this.resource = this.experience.resource;

    this.pages = [
      {
        front: "book-cover",
        back: "page-1",
      },
      {
        front: "page-2",
        back: "page-3",
      },
      {
        front: "page-4",
        back: "book-back",
      },
    ];

    this.book = new Book(this.pages);
    this.scene.add(this.book.group);

    this.createUI();
  }

  private createUI() {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.bottom = "10px";
    div.style.left = "10px";
    div.style.zIndex = "1000";
    div.style.display = "flex";
    div.style.gap = "10px";
    document.body.appendChild(div);

    for (let i = 0; i <= this.pages.length; i++) {
      const buttonEl = document.createElement("button");
      buttonEl.textContent =
        i === 0 ? "cover" : i === this.pages.length ? "back" : `Page ${i}`;
      buttonEl.style.cursor = "pointer";
      buttonEl.style.padding = "10px";
      buttonEl.style.borderRadius = "5px";
      buttonEl.style.border = "none";
      buttonEl.style.backgroundColor = "#646cff";
      buttonEl.style.color = "#fff";
      buttonEl.style.fontSize = "14px";
      buttonEl.style.fontWeight = "bold";
      buttonEl.style.textAlign = "center";
      buttonEl.style.textDecoration = "none";
      buttonEl.addEventListener("click", () => {
        this.currentPage = i;
        this.book.turnPage(i);
      });
      div.appendChild(buttonEl);
    }
  }

  resize() {}

  update() {}
}
