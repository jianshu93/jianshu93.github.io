import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";

const assets = new URL("../site-assets/", import.meta.url);
const source = await readFile(new URL("publications.bib", assets), "utf8");
const selected = new Set(["zhao2026dartunifrac", "din2026longread", "zhao2025rarebiosphere", "zhao2025sar11", "zhao2024gsearch", "zhao2024annembed", "zhao2025gigascale"]);
const codes = {
  zhao2026dartunifrac: "https://github.com/jianshu93/DartUniFrac",
  zhao2024gsearch: "https://github.com/jianshu93/gsearch",
  zhao2024annembed: "https://gitlab.com/Jianshu_Zhao/annembed",
  zhao2025gigascale: "https://gitlab.com/Jianshu_Zhao/graphembed",
  zhao2024bindash: "https://github.com/jianshu93/bindash-rs",
  aton2025scikitbio: "https://github.com/scikit-bio/scikit-bio"
};
const summaries = {
  zhao2026dartunifrac: "Scalable phylogenetic community comparisons for megascale microbiome analysis.",
  zhao2025rarebiosphere: "Testing ecological theory using population genomes reconstructed from metagenomes.",
  zhao2024gsearch: "Combining k-mer hashing with graph-based approximate nearest-neighbor search."
};
const papers = new Cite(source).data.map(paper => ({
  id: paper.id,
  title: paper.title,
  author: paper.author,
  venue: String(paper["container-title"] || ""),
  year: paper.issued["date-parts"][0][0],
  volume: paper.volume || "",
  page: (paper.page || "").replaceAll("--", "\u2013"),
  DOI: paper.DOI,
  firstAuthor: /firstauthor|first author/.test(String(paper.keyword || "") + " " + String(paper.note || "")),
  preprint: /bioRxiv/i.test(String(paper["container-title"])),
  selected: selected.has(paper.id),
  summary: summaries[paper.id] || "",
  code: codes[paper.id] || "",
  bibtex: new Cite([paper]).format("bibtex", { format: "text" }).trim()
})).sort((a, b) => b.year - a.year || Number(a.preprint) - Number(b.preprint));
if (papers.some(p => !p.title || !p.author?.length || !p.DOI)) throw new Error("Every publication needs a title, authors, and DOI.");
await writeFile(new URL("publications.js", assets), "window.CV_PUBLICATIONS = " + JSON.stringify(papers, null, 2) + ";\n");
console.log("Updated " + papers.length + " publications in " + fileURLToPath(assets));
