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

        if (inPages) {
            footerMount
                .querySelectorAll('[src^="assets/"], [href^="assets/"]')
                .forEach(el => {
                    const attr = el.hasAttribute("src") ? "src" : "href";
                    el.setAttribute(attr, "../" + el.getAttribute(attr));
                });
        }
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