(function () {
  const BIBTEX = `@misc{shen2026medopenclawauditablemedicalimaging,
  title={MedOpenClaw: Auditable Medical Imaging Agents Reasoning over Uncurated Full Studies},
  author={Weixiang Shen and Yanzhu Hu and Che Liu and Junde Wu and Jiayuan Zhu and Chengzhi Shen and Min Xu and Yueming Jin and Benedikt Wiestler and Daniel Rueckert and Jiazhen Pan},
  year={2026},
  eprint={2603.24649},
  archivePrefix={arXiv},
  primaryClass={cs.CV},
  url={https://arxiv.org/abs/2603.24649},
}`;

  function parseCandidates(raw) {
    return raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [src, type] = entry.split("|").map((value) => value.trim());
        return { src, type };
      });
  }

  async function headExists(url) {
    if (!window.location.protocol.startsWith("http")) {
      return null;
    }

    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      return response.ok;
    } catch (error) {
      return null;
    }
  }

  function setVideoSource(slot, source) {
    const video = slot.querySelector("video");
    if (!video || !source) return;

    video.innerHTML = "";
    const sourceNode = document.createElement("source");
    sourceNode.src = source.src;
    sourceNode.type = source.type || "video/mp4";
    video.appendChild(sourceNode);
    video.load();
    slot.classList.add("is-ready");

    const card = slot.closest(".card");
    const downloadLink = card ? card.querySelector("[data-download-link]") : null;
    if (downloadLink) {
      downloadLink.href = source.src;
      downloadLink.classList.remove("hidden");
    }

    const optionalSection = slot.closest("[data-optional-section]");
    if (optionalSection) {
      optionalSection.hidden = false;
      optionalSection.classList.add("is-visible");
    }
  }

  function markMissing(slot) {
    const label = slot.dataset.missingLabel;
    const placeholder = slot.querySelector(".video-placeholder span");
    if (placeholder && label) {
      placeholder.textContent = label;
    }

    const optionalSection = slot.closest("[data-optional-section]");
    if (optionalSection) {
      optionalSection.hidden = true;
    }
  }

  function tryLoadWithEvents(slot, candidates, index) {
    const video = slot.querySelector("video");
    if (!video) return;

    if (index >= candidates.length) {
      markMissing(slot);
      return;
    }

    const candidate = candidates[index];
    const sourceNode = document.createElement("source");
    sourceNode.src = candidate.src;
    sourceNode.type = candidate.type || "video/mp4";

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      sourceNode.removeEventListener("error", onError);
    };

    const onLoaded = () => {
      cleanup();
      setVideoSource(slot, candidate);
    };

    const onError = () => {
      cleanup();
      tryLoadWithEvents(slot, candidates, index + 1);
    };

    video.addEventListener("loadedmetadata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
    sourceNode.addEventListener("error", onError, { once: true });

    video.innerHTML = "";
    video.appendChild(sourceNode);
    video.load();
  }

  async function initVideoSlots() {
    const slots = Array.from(document.querySelectorAll("[data-video-slot]"));

    for (const slot of slots) {
      const candidates = parseCandidates(slot.dataset.sources || "");
      if (!candidates.length) {
        markMissing(slot);
        continue;
      }

      let chosen = null;
      let canUseHead = window.location.protocol.startsWith("http");

      if (canUseHead) {
        for (const candidate of candidates) {
          const exists = await headExists(candidate.src);
          if (exists === true) {
            chosen = candidate;
            break;
          }
        }
      }

      if (chosen) {
        setVideoSource(slot, chosen);
      } else {
        tryLoadWithEvents(slot, candidates, 0);
      }
    }
  }

  function initCopyBibtex() {
    const buttons = document.querySelectorAll("[data-copy-bibtex]");

    const copy = async (button) => {
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(BIBTEX);
        button.textContent = "Copied";
      } catch (error) {
        const textarea = document.createElement("textarea");
        textarea.value = BIBTEX;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        button.textContent = "Copied";
      }

      window.setTimeout(() => {
        button.textContent = original;
      }, 1400);
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => copy(button));
    });
  }

  function initReveal() {
    const revealItems = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.15,
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  document.addEventListener("DOMContentLoaded", function () {
    initCopyBibtex();
    initReveal();
    initVideoSlots();
  });
})();
