(async () => {
    async function injectFooter() {
        const footerMount = document.getElementById("siteFooter");
        if (!footerMount) return;

        if (footerMount.dataset.loaded === "1") return;
        footerMount.dataset.loaded = "1";

        const inPages = location.pathname.includes("/pages/");
        const base = inPages ? ".." : ".";

        const res = await fetch(`${base}/partials/footer.html`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Footer include failed: ${res.status}`);

        footerMount.innerHTML = await res.text();

        const yearEl = footerMount.querySelector("#year");
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        wireFooterTopicLinks(footerMount, base);
        initFooterAccordion(footerMount);

        if (inPages) {
            footerMount
                .querySelectorAll('[src^="assets/"], [href^="assets/"]')
                .forEach(el => {
                    const attr = el.hasAttribute("src") ? "src" : "href";
                    el.setAttribute(attr, "../" + el.getAttribute(attr));
                });
        }
    }

    function initFooterAccordion(footerMount) {
        const list = footerMount.querySelector(".footer-links");
        if (!list) return;

        const cols = Array.from(list.querySelectorAll(".hub-col"));
        const mq = window.matchMedia("(max-width: 620px)");

        function setOpen(col, open) {
            const head = col.querySelector(".nyc-col-head");
            col.classList.toggle("is-open", open);
            if (head) head.setAttribute("aria-expanded", open ? "true" : "false");
        }

        function apply() {
            list.classList.toggle("is-accordion", mq.matches);
            cols.forEach((col) => {
                const head = col.querySelector(".nyc-col-head");
                if (!head) return;
                if (mq.matches) {
                    head.setAttribute("role", "button");
                    head.setAttribute("tabindex", "0");
                    setOpen(col, col.classList.contains("is-open"));
                } else {
                    head.removeAttribute("role");
                    head.removeAttribute("tabindex");
                    head.removeAttribute("aria-expanded");
                    col.classList.remove("is-open");
                }
            });
        }

        cols.forEach((col) => {
            const head = col.querySelector(".nyc-col-head");
            if (!head) return;
            head.addEventListener("click", () => {
                if (mq.matches) setOpen(col, !col.classList.contains("is-open"));
            });
            head.addEventListener("keydown", (e) => {
                if (!mq.matches || (e.key !== "Enter" && e.key !== " ")) return;
                e.preventDefault();
                setOpen(col, !col.classList.contains("is-open"));
            });
        });

        mq.addEventListener("change", apply);
        apply();
    }

    function wireFooterTopicLinks(footerMount, base) {
        const links = footerMount.querySelectorAll("a.footer-topic[data-cat]");
        if (!links.length) return;

        const useHtml = /\.html($|[?#])/.test(window.location.pathname);

        links.forEach(a => {
            const cat = (a.dataset.cat || "").trim().toLowerCase();
            if (!cat) return;

            a.addEventListener("click", (e) => {
                e.preventDefault();

                const page = useHtml ? "resources.html" : "resources";
                const dest = `${base}/pages/${page}?cat=${encodeURIComponent(cat)}#directory`;
                window.location.assign(dest);
            });
        });
    }

    injectFooter().catch(console.error);
})();