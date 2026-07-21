(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });
})();

let taxSwitch = document.getElementById("switchCheckDefault");
taxSwitch.addEventListener("click", () => {
  let taxInfo = document.getElementsByClassName("tax-info");
  for (info of taxInfo) {
    if (info.style.display != "inline") {
      info.style.display = "inline";
    } else {
      info.style.display = "none";
    }
  }
});

const filters = document.getElementById("filters");
const scrollAmount = 200; // ek click me kitna slide hoga. 200px = 2-3 icons

document.getElementById("scrollLeft").addEventListener("click", () => {
  filters.scrollBy({
    left: -scrollAmount,
    behavior: "smooth", // smooth slide
  });
});

document.getElementById("scrollRight").addEventListener("click", () => {
  filters.scrollBy({
    left: scrollAmount,
    behavior: "smooth",
  });
});

document.querySelectorAll(".like-btn").forEach((button) => {
  button.addEventListener("click", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const listingId = this.getAttribute("data-id");
    const icon = this.querySelector(".heart-icon");

    icon.style.transform = "scale(1.3)";
    setTimeout(() => {
      icon.style.transform = "scale(1)";
    }, 200);

    try {
      const response = await fetch(`/listings/${listingId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        if (data.isLiked) {
          icon.classList.remove("fa-regular");
          icon.classList.add("fa-solid");
          icon.style.setProperty("color", "#ff385c", "important");
        } else {
          icon.classList.remove("fa-solid");
          icon.classList.add("fa-regular");
          icon.style.setProperty("color", "white", "important");
        }
      } else if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      console.error("Like toggle:", err);
    }
  });
});
