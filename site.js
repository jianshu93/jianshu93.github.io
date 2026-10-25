(() => {
  "use strict";
  const publications = window.CV_PUBLICATIONS || [];
  const search = document.querySelector("#publication-search");
  const year = document.querySelector("#publication-year");
  const type = document.querySelector("#publication-type");
  const list = document.querySelector("#publication-list");
  const count = document.querySelector("#publication-count");
  const dialog = document.querySelector("#citation-dialog");
  const citationText = document.querySelector("#citation-text");
  const feedback = document.querySelector("#citation-feedback");
  let view = "selected";
  let activePublication = null;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const icon = name => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + name);
    svg.append(use);
    return svg;
  };
  const externalLink = (url, text) => {
    const link = element("a", "", text);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    return link;
  };
  const fullName = author => {
    if (author.literal === "others" || author.family === "others") return "et al.";
    return author.literal || [author.given, author["non-dropping-particle"], author.family].filter(Boolean).join(" ");
  };
  const owner = author => author.family === "Zhao" && author.given === "Jianshu";
  const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  for (const value of [...new Set(publications.map(p => p.year))].sort((a, b) => b - a)) {
    const option = element("option", "", String(value));
    option.value = String(value);
    year.append(option);
  }
  const allCount = document.querySelector('[data-view="all"] span');
  allCount.textContent = publications.length;

  function appendAuthors(container, paper) {
    const authors = paper.author || [];
    const chosen = new Set(authors.map((_, i) => i).filter(i => authors.length <= 6 || i < 3 || owner(authors[i]) || i === authors.length - 1));
    let previous = -1;
    for (const i of chosen) {
      if (previous >= 0) container.append(document.createTextNode(i > previous + 1 ? ", ..., " : ", "));
      const name = element(owner(authors[i]) ? "strong" : "span", "", fullName(authors[i]));
      if (owner(authors[i]) && paper.firstAuthor) name.append(element("sup", "", "*"));
      container.append(name);
      previous = i;
    }
  }

  function publicationNode(paper) {
    const article = element("article", "publication");
    article.dataset.id = paper.id;
    const meta = element("div", "paper-meta");
    meta.append(element("span", "paper-kind" + (paper.preprint ? " preprint" : "")), element("span", "", paper.preprint ? "Preprint" : "Journal article"));
    const title = element("h3", "paper-title");
    title.append(externalLink("https://doi.org/" + paper.DOI, paper.title));
    const authors = element("p", "paper-authors");
    appendAuthors(authors, paper);
    const venue = element("p", "paper-venue");
    venue.append(element("em", "", paper.venue));
    const details = [paper.volume, paper.page].filter(Boolean).join(", ");
    if (details) venue.append(document.createTextNode(" " + details));
    const actions = element("div", "paper-actions");
    const paperLink = externalLink("https://doi.org/" + paper.DOI, "Paper");
    paperLink.append(icon("arrow-up-right"));
    actions.append(paperLink);
    if (paper.code) {
      const codeLink = externalLink(paper.code, "Code");
      codeLink.prepend(icon("code-xml"));
      actions.append(codeLink);
    }
    const cite = element("button", "", "Cite");
    cite.type = "button";
    cite.setAttribute("aria-label", "Cite " + paper.title);
    cite.prepend(icon("quote"));
    cite.addEventListener("click", () => openCitation(paper));
    actions.append(cite);
    article.append(meta, title, authors, venue);
    if (paper.summary) article.append(element("p", "paper-summary", paper.summary));
    article.append(actions);
    return article;
  }

  function render() {
    const query = normalize(search.value.trim());
    const filtered = publications.filter(p =>
      (view === "all" || p.selected) &&
      (year.value === "all" || String(p.year) === year.value) &&
      (type.value === "all" || (type.value === "preprint") === p.preprint) &&
      (!query || normalize([p.title, p.venue, p.year, p.DOI, ...p.author.map(fullName)].join(" ")).includes(query))
    );
    list.replaceChildren();
    count.textContent = filtered.length + (filtered.length === 1 ? " paper" : " papers") + (view === "selected" ? " selected" : "");
    let currentYear = null;
    for (const paper of filtered) {
      if (paper.year !== currentYear) {
        list.append(element("h3", "publication-year-heading", String(paper.year)));
        currentYear = paper.year;
      }
      list.append(publicationNode(paper));
    }
    if (!filtered.length) {
      const empty = element("div", "no-results");
      empty.append(element("p", "", "No publications match these filters."));
      const reset = element("button", "reset-filters", "Clear filters and show all papers");
      reset.type = "button";
      reset.addEventListener("click", () => {
        search.value = "";
        year.value = "all";
        type.value = "all";
        setView("all");
      });
      empty.append(reset);
      list.append(empty);
    }
  }

  function setView(next) {
    view = next;
    for (const button of document.querySelectorAll("[data-view]")) {
      button.setAttribute("aria-pressed", String(button.dataset.view === view));
    }
    render();
  }
  for (const button of document.querySelectorAll("[data-view]")) button.addEventListener("click", () => setView(button.dataset.view));
  search.addEventListener("input", render);
  year.addEventListener("change", render);
  type.addEventListener("change", render);

  function openCitation(paper) {
    activePublication = paper;
    document.querySelector("#citation-paper-title").textContent = paper.title;
    citationText.textContent = paper.bibtex;
    feedback.textContent = "";
    document.querySelector("#copy-citation span").textContent = "Copy BibTeX";
    dialog.showModal();
  }
  document.querySelector("#close-citation").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  document.querySelector("#copy-citation").addEventListener("click", async () => {
    if (!activePublication) return;
    try {
      await navigator.clipboard.writeText(activePublication.bibtex);
      feedback.textContent = "Citation copied.";
      document.querySelector("#copy-citation span").textContent = "Copied";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(citationText);
      selection.removeAllRanges();
      selection.addRange(range);
      citationText.focus();
      feedback.textContent = "Citation selected. You can copy it or download the .bib file.";
    }
  });
  document.querySelector("#download-citation").addEventListener("click", () => {
    if (!activePublication) return;
    const url = URL.createObjectURL(new Blob([activePublication.bibtex + "\n"], { type: "application/x-bibtex;charset=utf-8" }));
    const link = element("a");
    link.href = url;
    link.download = activePublication.id + ".bib";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback.textContent = "BibTeX download started.";
  });

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#navigation-links");
  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    menuButton.querySelector("use").setAttribute("href", "#menu");
  };
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menuButton.querySelector("use").setAttribute("href", open ? "#x" : "#menu");
  });
  navigation.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
  document.addEventListener("click", event => { if (!event.target.closest(".navigation")) closeMenu(); });
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const target = "#" + entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle("is-active", link.getAttribute("href") === target);
          if (link.getAttribute("href") === target) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    }
  }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
  document.querySelectorAll("main > section").forEach(section => observer.observe(section));
  render();
})();
