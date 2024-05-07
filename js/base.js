document.querySelector(".burger").addEventListener("click", () => {
    const aside = document.querySelector("aside");
    aside.classList.contains("visible")
      ? aside.classList.remove("visible")
      : aside.classList.add("visible");
  });