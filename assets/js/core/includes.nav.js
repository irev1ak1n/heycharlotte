(() => {
    function initNavSearch() {
        const searchWrap = document.getElementById("navSearch");
        const searchInput = document.getElementById("navSearchInput");
        const searchToggle = document.getElementById("navSearchToggle");
        const searchClose = document.getElementById("navSearchClose");
        if (!searchInput || !searchWrap) return;

        const url = new URL(window.location.href);
        const qParam = (url.searchParams.get("q") || "").trim();
        if (qParam) searchInput.value = qParam;

        const basePlaceholder = "Search Charlotte…";
        const examples = [
            "Food assistance in Charlotte",
            "Charlotte housing & shelters",
            "Free clinics near me",
            "Job training in Mecklenburg County",
            "Youth programs in Charlotte",
        ];

        let exIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const isOpen = () => searchWrap.classList.contains("open");
        const isUserUsing = () =>
            document.activeElement === searchInput || searchInput.value.trim().length > 0;

        function tick() {
            if (!isOpen() || isUserUsing()) {
                searchInput.placeholder = basePlaceholder;
                setTimeout(tick, 300);
                return;
            }

            const full = examples[exIndex];

            if (!deleting) {
                charIndex++;
                searchInput.placeholder = full.slice(0, charIndex);
                if (charIndex >= full.length) {
                    deleting = true;
                    setTimeout(tick, 1100);
                    return;
                }
            } else {
                charIndex--;
                searchInput.placeholder = full.slice(0, charIndex);
                if (charIndex <= 0) {
                    deleting = false;
                    exIndex = (exIndex + 1) % examples.length;
                }
            }

            setTimeout(tick, deleting ? 25 : 40);
        }

        searchInput.placeholder = basePlaceholder;
        tick();

        searchInput.addEventListener("focus", () => {
            searchInput.placeholder = basePlaceholder;
        });

        const hasWord = (text, word) =>
            new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);

        function isValidQuery(raw) {
            const s = (raw || "").trim();

            if (!/[a-z0-9]/i.test(s)) return false;

            const allowed = /^[a-z0-9\s'&.,-]+$/i;
            if (!allowed.test(s)) return false;

            if (s.length < 2) return false;

            const lettersDigits = (s.match(/[a-z0-9]/gi) || []).length;
            const ratio = lettersDigits / s.length;
            if (ratio < 0.35) return false;

            const q = s.toLowerCase().replace(/\s+/g, " ").trim();

            if (/^\d+$/.test(q)) return false;

            if (q.length > 80) return false;

            const tokens = q.split(" ").filter(Boolean);

            const allowedSingles = new Set([
                "news","updates","highlights","events","event","things","activities","fun","weekend","chill",
                "volunteer","donate","donation","give","help","support",
                "contact","email","message","about","mission","purpose",
                "faq","faqs","questions",
                "references","sources","citations",
                "resources","directory","services","assistance","aid","support","programs","organizations",
                "education","school","schools","learning","students","student",
                "youth","kids","children","after-school","tutoring","literacy","mentoring",
                "housing","shelter","shelters","rent","rental","homeless","eviction","utilities",
                "food","meals","pantry","pantries","groceries","hunger",
                "health","medical","clinic","clinics","mental","therapy","counseling","wellness",
                "jobs","job","employment","career","careers","training","workforce","resume","internships",
                "crisis","emergency","hotline","safety","abuse","violence",
                "charlotte","clt","mecklenburg","nc"
            ]);

            if (tokens.length === 1) {
                const t = tokens[0];
                if (!allowedSingles.has(t)) return false;
                if (/^(.)\1{4,}$/i.test(t)) return false;
            }

            return true;
        }

        function goToSmartSearch() {
            const raw = searchInput.value.trim();
            if (!raw) return;

            if (!isValidQuery(raw)) return;

            const q = raw.toLowerCase().replace(/\s+/g, " ").trim();

            const inPages = location.pathname.includes("/pages/");
            const base = inPages ? ".." : ".";
            const resourcesPath = `${base}/pages/resources`;

            const routes = [
                {
                    page: "news.html",
                    keys: [
                        "news","updates","highlights","now in clt","now in charlotte",
                        "clt news","community news","latest","latest news",
                    ],
                },
                { page: "events.html?cat=free", keys: ["free events"] },
                { page: "events.html?cat=music", keys: ["live music", "concerts"] },
                {
                    page: "events.html",
                    keys: ["events","event","festival","festivals","markets","pop up","popup"],
                },
                { page: "things.html?cat=art", keys: ["art", "art & culture", "culture"] },
                { page: "things.html?cat=outdoor", keys: ["outdoor", "outdoors", "parks", "hiking"] },
                {
                    page: "things.html",
                    keys: ["things to do","things","activities","what to do","fun","weekend","chill"],
                },
                {
                    page: "volunteer-donate.html",
                    keys: ["volunteer","donate","donation","give","get involved","help out","community service"],
                },
                { page: "references.html", keys: ["references", "sources", "citations", "works cited"] },
                { page: "faqs.html", keys: ["faq", "faqs", "questions"] },
                {
                    page: "contact-us.html",
                    keys: ["contact","contact us","email","message","reach out","get in touch","help"],
                },
                {
                    page: "about-us.html",
                    keys: ["about", "about us", "who we are", "our mission", "mission", "purpose"],
                },
                {
                    page: "resources.html",
                    keys: ["education", "school", "students", "youth", "after school", "tutoring", "literacy"],
                },
                {
                    page: "resources.html",
                    keys: ["housing", "shelter", "rent", "homeless", "eviction", "temporary housing"],
                },
                { page: "resources.html", keys: ["food", "food pantry", "meals", "groceries", "hunger"] },
                {
                    page: "resources.html",
                    keys: ["health", "clinic", "medical", "mental health", "therapy", "counseling"],
                },
                {
                    page: "resources.html",
                    keys: ["jobs", "job training", "employment", "career", "resume", "workforce"],
                },
                {
                    page: "resources.html",
                    keys: ["resources", "city resources", "directory", "resource hub", "help", "support", "assistance", "services"],
                },
            ];

            const matches = (keys) =>
                keys.some((k) => {
                    if (k.includes(" ")) return q.includes(k);
                    return hasWord(q, k);
                });

            const pageOnlyTerms = new Set([
                "resources","city resources","directory","resource hub",
            ]);

            for (const r of routes) {
                if (!matches(r.keys)) continue;

                if (r.page.startsWith("resources.html") || r.page.startsWith("resources")) {
                    if (pageOnlyTerms.has(q)) {
                        window.location.href = resourcesPath;
                        return;
                    }

                    const u = new URL(resourcesPath, window.location.href);
                    u.searchParams.set("q", raw);

                    let catSlug = "";
                    if (matches(["education", "school", "students", "youth", "after school", "tutoring", "literacy"])) catSlug = "education";
                    else if (matches(["housing", "shelter", "rent", "homeless", "eviction", "temporary housing"])) catSlug = "housing";
                    else if (matches(["food", "food pantry", "meals", "groceries", "hunger"])) catSlug = "food";
                    else if (matches(["health", "clinic", "medical", "mental health", "therapy", "counseling"])) catSlug = "health";
                    else if (matches(["jobs", "job training", "employment", "career", "resume", "workforce"])) catSlug = "jobs";

                    if (catSlug) u.searchParams.set("cat", catSlug);

                    window.location.href = u.toString();
                    return;
                }

                window.location.href = `${base}/pages/${r.page}`;
                return;
            }

            sessionStorage.setItem("nav_q", raw);
            sessionStorage.setItem("nav_cat", "");
            const u = new URL(`${base}/pages/resources`, window.location.href);
            u.searchParams.set("q", raw);
            window.location.href = u.toString();
        }

        function openSearch() {
            searchWrap.classList.add("open");
            if (searchToggle) {
                searchToggle.setAttribute("aria-expanded", "true");
                searchToggle.setAttribute("aria-label", "Search");
            }
            searchInput.tabIndex = 0;
            if (searchClose) searchClose.tabIndex = 0;
            searchInput.focus();
        }

        function closeSearch() {
            searchWrap.classList.remove("open");
            if (searchToggle) {
                searchToggle.setAttribute("aria-expanded", "false");
                searchToggle.setAttribute("aria-label", "Open search");
            }
            searchInput.tabIndex = -1;
            if (searchClose) searchClose.tabIndex = -1;
            searchInput.blur();
        }

        if (searchToggle) {
            searchToggle.addEventListener("click", () => {
                if (isOpen()) goToSmartSearch();
                else openSearch();
            });
        }

        if (searchClose) searchClose.addEventListener("click", closeSearch);

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                goToSmartSearch();
            } else if (e.key === "Escape") {
                e.preventDefault();
                closeSearch();
                if (searchToggle) searchToggle.focus();
            }
        });

        document.addEventListener("click", (e) => {
            if (isOpen() && !searchWrap.contains(e.target)) closeSearch();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && isOpen()) closeSearch();
        });
    }

    function initNavScroll() {
        const topBar = document.querySelector(".hero-top");
        if (!topBar) return;

        const onScroll = () => topBar.classList.toggle("is-scrolled", window.scrollY > 10);

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    function setActiveLink(navMount) {
        const normalize = (p) => {
            if (!p) return "";
            p = p.split("?")[0].split("#")[0];
            p = p.replace(/\/+$/, "");
            p = p.split("/").pop() || "index";
            p = p.replace(/\.html$/i, "");
            return p.toLowerCase();
        };

        const current = normalize(location.pathname);

        navMount.querySelectorAll(".nav a.is-active").forEach((a) => a.classList.remove("is-active"));

        navMount.querySelectorAll(".nav a").forEach((a) => {
            const href = a.getAttribute("href") || "";
            if (href.startsWith("#") || href.startsWith("http")) return;

            const target = normalize(href);
            const isHome = (x) => x === "" || x === "index";

            if (isHome(current) && isHome(target)) {
                a.classList.add("is-active");
                return;
            }

            if (target && target === current) a.classList.add("is-active");
        });
    }

    function initDropdowns(navMount) {
        const nav = navMount.querySelector(".nav");
        if (!nav) return;

        const items = Array.from(nav.querySelectorAll(".nav-item.has-dd"));
        const mq = window.matchMedia("(max-width: 960px)");
        const isMobile = () => mq.matches;

        const closeAll = (except = null) => {
            items.forEach((item) => {
                if (item === except) return;
                item.classList.remove("open");
                const link = item.querySelector(".nav-link");
                if (link) link.setAttribute("aria-expanded", "false");
            });
        };

        items.forEach((item) => {
            const trigger = item.querySelector(".nav-link");
            const menu = item.querySelector(".nav-dd");
            if (!trigger || !menu) return;

            trigger.addEventListener("click", (e) => {
                e.preventDefault();
                if (isMobile()) {
                    const willOpen = !item.classList.contains("open");
                    closeAll(item);
                    item.classList.toggle("open", willOpen);
                    trigger.setAttribute("aria-expanded", String(willOpen));
                } else {
                    closeAll(item);
                    item.classList.add("open");
                    trigger.setAttribute("aria-expanded", "true");
                }
            });

            trigger.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    closeAll(item);
                    item.classList.add("open");
                    trigger.setAttribute("aria-expanded", "true");
                    const first = menu.querySelector("a");
                    if (first) first.focus();
                }

                if (e.key === "Escape") {
                    closeAll();
                    trigger.focus();
                }

                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    closeAll(item);
                    item.classList.add("open");
                    trigger.setAttribute("aria-expanded", "true");
                    const first = menu.querySelector("a");
                    if (first) first.focus();
                }
            });

            menu.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    closeAll();
                    trigger.focus();
                }
            });

            item.addEventListener("mouseenter", () => {
                if (isMobile()) return;
                closeAll(item);
                item.classList.add("open");
                trigger.setAttribute("aria-expanded", "true");
            });

            item.addEventListener("mouseleave", () => {
                if (isMobile()) return;
                item.classList.remove("open");
                trigger.setAttribute("aria-expanded", "false");
            });
        });

        document.addEventListener("click", (e) => {
            if (!nav.contains(e.target)) closeAll();
        });

        window.addEventListener("scroll", () => {
            if (!isMobile()) closeAll();
        }, { passive: true });

        mq.addEventListener("change", () => closeAll());
    }

    function initNavMenu(navMount) {
        const nav = navMount.querySelector(".nav");
        const burger = navMount.querySelector("#navBurger");
        const scrim = navMount.querySelector("#navScrim");
        if (!nav || !burger) return;

        const collapseDropdowns = () => {
            nav.querySelectorAll(".nav-item.open").forEach((item) => {
                item.classList.remove("open");
                const link = item.querySelector(".nav-link");
                if (link) link.setAttribute("aria-expanded", "false");
            });
        };

        const closeMenu = () => {
            nav.classList.remove("open");
            burger.classList.remove("open");
            burger.setAttribute("aria-expanded", "false");
            if (scrim) {
                scrim.classList.remove("show");
                scrim.hidden = true;
            }
            collapseDropdowns();
        };

        const openMenu = () => {
            nav.classList.add("open");
            burger.classList.add("open");
            burger.setAttribute("aria-expanded", "true");
            if (scrim) {
                scrim.hidden = false;
                requestAnimationFrame(() => scrim.classList.add("show"));
            }
        };

        burger.addEventListener("click", () => {
            if (nav.classList.contains("open")) closeMenu();
            else openMenu();
        });

        if (scrim) scrim.addEventListener("click", closeMenu);

        nav.querySelectorAll("a[href]").forEach((a) => {
            a.addEventListener("click", () => {
                if (window.matchMedia("(max-width: 960px)").matches) closeMenu();
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && nav.classList.contains("open")) closeMenu();
        });

        window.matchMedia("(max-width: 960px)").addEventListener("change", closeMenu);
    }

    function setNavThemeByHero() {
        const hero = document.querySelector(".hero");
        const heroVisible = hero && getComputedStyle(hero).display !== "none";
        document.body.classList.toggle("no-hero", !heroVisible);
        document.body.classList.toggle("has-hero", !!heroVisible);
    }

    async function injectNav() {
        const navMount = document.getElementById("siteNav");
        if (!navMount) return;

        if (navMount.dataset.loaded === "1") return;
        navMount.dataset.loaded = "1";

        const inPages = location.pathname.includes("/pages/");
        const base = inPages ? ".." : ".";

        const res = await fetch(`${base}/partials/nav.html`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Nav include failed: ${res.status}`);

        navMount.innerHTML = await res.text();

        if (inPages) {
            navMount.querySelectorAll('[src^="assets/"], [href^="assets/"]').forEach((el) => {
                const attr = el.hasAttribute("src") ? "src" : "href";
                el.setAttribute(attr, "../" + el.getAttribute(attr));
            });
        }

        setNavThemeByHero();
        setActiveLink(navMount);
        initNavSearch();
        initNavScroll();
        initDropdowns(navMount);
        initNavMenu(navMount);
    }

    injectNav().catch(console.error);
})();