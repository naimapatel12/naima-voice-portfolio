document.addEventListener("DOMContentLoaded", () => {
  const tags = document.querySelectorAll(".voice-tag");
  const projects = document.querySelectorAll(".project-card");
  const allTag = document.querySelector('.voice-tag[data-category="all"]');

  const filterProjects = (category) => {
    projects.forEach((project) => {
      if (!category) {
        project.style.display = "flex";
        return;
      }

      const tagMatches = Array.from(
        project.querySelectorAll(".project-card__tag")
      ).some((t) =>
        t.textContent.toLowerCase().includes(category.toLowerCase())
      );
      project.style.display = tagMatches ? "flex" : "none";
    });
  };

  tags.forEach((tag) => {
    tag.addEventListener("click", () => {
      if (tag.dataset.category === "all") {
        tags.forEach((t) => t.classList.remove("active"));
        tag.classList.add("active");
        filterProjects("");
        document
          .querySelector("#projects")
          .scrollIntoView({ behavior: "smooth" });
        return;
      }

      const category = tag.dataset.category;
      const isActive = tag.classList.contains("active");

      tags.forEach((t) => t.classList.remove("active"));

      if (isActive) {
        filterProjects("");
        allTag?.classList.add("active");
      } else {
        tag.classList.add("active");
        filterProjects(category);
        allTag?.classList.remove("active");
      }

      document
        .querySelector("#projects")
        .scrollIntoView({ behavior: "smooth" });
    });
  });

  filterProjects("");
});
