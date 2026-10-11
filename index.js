/* ---------- data ---------- */

// title, image, description and link are read from each project card in
// index.html, so only the extra details live here.
// role / highlights are optional: fill them in and they show up in the
// project panel automatically.
const PROJECTS = {
  "nona-pd": {
    stack: [
      { label: "React", skill: "react" },
      { label: "TypeScript", skill: "typescript" },
      { label: "Supabase", skill: "postgresql" },
    ],
    role: "",
    highlights: [
      "Create tasks and assign them to team members",
      "Roles: project manager or contributor",
      "Tracks how much time each contributor spends on every task",
    ],
  },
  "helpnona": {
    stack: [
      { label: "React Native", skill: "react" },
      { label: "TypeScript", skill: "typescript" },
      { label: "Express.js", skill: "node" },
    ],
    role: "Two-person team (NONA), my first hackathon",
    highlights: [
      "MVP built at Open Hackathon 2026, hosted by Open Conference and Zone01 in Nea Ionia, Athens",
      "Placed 5th out of 21 teams",
    ],
  },
  "noai-academy": {
    stack: [],
    role: "",
    highlights: [],
  },
};

const SKILLS = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  git: "Git",
  github: "GitHub",
  node: "Node.js",
  postgresql: "PostgreSQL",
  linux: "Linux",
};

const SECTIONS = {
  projects: "#projects",
  experience: "#experience",
  skills: "#skillsntech",
  about: "#about",
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- helpers ---------- */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// types text into an element one character at a time
async function typeText(el, text, speed = 60) {
  for (const char of text) {
    el.textContent += char;
    await wait(speed);
  }
}

async function eraseText(el, speed = 30) {
  while (el.textContent.length > 0) {
    el.textContent = el.textContent.slice(0, -1);
    await wait(speed);
  }
}

// "decodes" text: every character starts as a random glyph and they lock
// into the real text from left to right (monospace font, so nothing moves)
const GLYPHS = "!<>-_\\/[]{}=+*^?#01";
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
const scramble = (text) => [...text].map((char) => (char === " " ? " " : randomGlyph())).join("");
const decoding = new WeakSet();

function decodeText(el, text, duration = 600) {
  if (decoding.has(el)) return Promise.resolve(); // already running on this element
  decoding.add(el);
  const chars = [...text];
  const start = performance.now();
  // setTimeout instead of requestAnimationFrame: animation frames can pause
  // (e.g. hidden or embedded pages), which would leave the text scrambled.
  // Progress is based on elapsed time, so even a throttled timer finishes.
  return new Promise((resolve) => {
    const frame = () => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      const revealed = Math.floor(progress * chars.length);
      el.textContent = chars.map((char, i) => (i < revealed || char === " " ? char : randomGlyph())).join("");
      if (progress < 1) return setTimeout(frame, 30);
      el.textContent = text;
      decoding.delete(el);
      resolve();
    };
    frame();
  });
}

// the literal "<p>...</p>" tags around paragraphs are decoration, strip them
const stripTags = (text) => text.trim().replace(/^<\w+>|<\/\w+>$/g, "").trim();

function getProject(slug) {
  const card = document.querySelector(`.project_card[data-project="${slug}"]`);
  if (!card || !PROJECTS[slug]) return null;
  const link = card.querySelector("a");
  return {
    slug,
    card,
    title: card.querySelector("h1").textContent.trim(),
    image: card.querySelector("img").getAttribute("src"),
    imageAlt: card.querySelector("img").getAttribute("alt"),
    description: card.querySelector("h2").textContent.trim(),
    link: link ? link.getAttribute("href") : "",
    linkLabel: link ? link.textContent.trim() : "",
    download: link ? link.hasAttribute("download") : false,
    ...PROJECTS[slug],
  };
}

// which projects use a skill, e.g. "typescript" -> ["Nona PD", "HelpNONA"]
function projectsUsing(skill) {
  return Object.keys(PROJECTS)
    .filter((slug) => PROJECTS[slug].stack.some((item) => item.skill === skill))
    .map((slug) => getProject(slug).title);
}

// open a <dialog> and give focus back to whatever had it when it closes
function openDialog(dialog, returnFocusTo = document.activeElement) {
  dialog.addEventListener("close", () => {
    if (returnFocusTo && document.contains(returnFocusTo)) returnFocusTo.focus();
  }, { once: true });
  dialog.showModal();
}

// close dialogs with their ✕ button or by clicking outside of them
function setupDialogClosing(dialog) {
  dialog.querySelector(".dialog_close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    const r = dialog.getBoundingClientRect();
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    // keyboard "clicks" have 0,0 coordinates, ignore those
    if (outside && (e.clientX !== 0 || e.clientY !== 0)) dialog.close();
  });
}

/* ---------- mobile nav ---------- */

function initMobileNav() {
  const nav = document.querySelector("nav");
  const burger = document.querySelector(".burger_menu_btn");

  const setOpen = (open) => {
    nav.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
  };

  burger.addEventListener("click", () => setOpen(!nav.classList.contains("nav-open")));
  nav.querySelectorAll(".right a, .right button").forEach((item) => {
    item.addEventListener("click", () => setOpen(false));
  });
}

/* ---------- typing hero ---------- */

// `ready` is a promise: typing starts once it resolves (after the boot screen)
function initTyping(ready = Promise.resolve()) {
  const heroTitle = document.querySelector(".main h1");
  const heroRoles = document.querySelector(".main p");

  // hero name: "<title> " + name + " </title>"
  const name = stripTags(heroTitle.textContent);
  heroTitle.setAttribute("aria-label", name);
  heroTitle.textContent = "";
  const nameEl = document.createElement("span");
  const cursor = document.createElement("span");
  cursor.className = "type_cursor";
  cursor.textContent = "▍";
  cursor.setAttribute("aria-hidden", "true");
  heroTitle.append("<title> ", nameEl, cursor, " </title>");

  // role line: keep the full text for screen readers, animate a copy
  const rolesText = heroRoles.textContent.trim();
  const roles = rolesText.split("|").map((role) => role.trim());
  heroRoles.textContent = "";
  const hiddenRoles = document.createElement("span");
  hiddenRoles.className = "visually_hidden";
  hiddenRoles.textContent = rolesText;
  const roleEl = document.createElement("span");
  roleEl.setAttribute("aria-hidden", "true");
  const roleCursor = cursor.cloneNode(true);
  heroRoles.append(hiddenRoles, roleEl);

  if (reducedMotion) {
    cursor.remove();
    nameEl.textContent = name;
    roleEl.textContent = roles.join(" | ");
    return;
  }

  (async () => {
    await ready;
    await typeText(nameEl, name, 70);
    cursor.remove(); // only the line that's being typed gets a cursor
    heroRoles.append(roleCursor);
    for (let i = 0; ; i = (i + 1) % roles.length) {
      await typeText(roleEl, roles[i], 45);
      await wait(1800);
      await eraseText(roleEl, 25);
      await wait(300);
    }
  })();
}

/* ---------- decode effect ---------- */

// section headings decode the first time they scroll into view, and
// headings + nav links decode again when you hover them
function initDecode() {
  const headings = [...document.querySelectorAll(".content > div > h1")];
  const navLinks = [...document.querySelectorAll("nav .dinos, nav .right a")];

  [...headings, ...navLinks].forEach((el) => {
    el.dataset.text = el.textContent;
    // screen readers get the real text, never the scrambled frames
    el.setAttribute("aria-label", el.dataset.label || stripTags(el.textContent));
  });
  if (reducedMotion) return;

  [...headings, ...navLinks].forEach((el) => {
    const replay = () => decodeText(el, el.dataset.text, 400);
    el.addEventListener("mouseenter", replay);
    el.addEventListener("focus", replay);
  });

  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      decodeText(entry.target, entry.target.dataset.text, 700);
    });
  }, { threshold: 0.6 });

  headings.forEach((heading) => {
    heading.textContent = scramble(heading.dataset.text);
    observer.observe(heading);
  });
}

/* ---------- stats ---------- */

// the numbers count up from 0 the first time the row scrolls into view.
// the HTML already holds the final values, so without JS nothing is lost.
function initStats() {
  const values = [...document.querySelectorAll(".stat_value[data-count]")];
  values.forEach((el) => {
    const stat = el.closest(".stat");
    // screen readers get the final value and label in one go
    stat.setAttribute("aria-label", `${el.textContent}: ${stat.querySelector(".stat_label").textContent}`);
    el.setAttribute("aria-hidden", "true");
    stat.querySelector(".stat_label").setAttribute("aria-hidden", "true");
    stat.setAttribute("role", "group");
  });
  if (reducedMotion || !("IntersectionObserver" in window)) return;

  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();
    // timer instead of animation frames, so it always finishes (see decodeText)
    const tick = () => {
      const progress = Math.min(1, (performance.now() - start) / duration);
      const eased = 1 - (1 - progress) ** 3; // fast start, slow finish
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) setTimeout(tick, 30);
    };
    tick();
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.8 });

  values.forEach((el) => {
    el.textContent = `0${el.dataset.suffix || ""}`;
    observer.observe(el);
  });
}

/* ---------- projects ---------- */

function openProject(slug, returnFocusTo) {
  const project = getProject(slug);
  if (!project) return false;

  const dialog = document.getElementById("project-dialog");
  dialog.querySelector("h2").textContent = project.title;
  const file = project.card.querySelector(".window_file");
  dialog.querySelector(".window_file").textContent = file ? file.textContent : project.slug;
  const img = dialog.querySelector("img");
  img.src = project.image;
  img.alt = project.imageAlt;
  dialog.querySelector(".dialog_description").textContent = project.description;

  const extra = dialog.querySelector(".dialog_extra");
  extra.replaceChildren();
  if (project.role) {
    const role = document.createElement("p");
    role.textContent = `Role: ${project.role}`;
    extra.append(role);
  }
  if (project.highlights.length) {
    const list = document.createElement("ul");
    project.highlights.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      list.append(li);
    });
    extra.append(list);
  }

  const stack = dialog.querySelector(".dialog_stack");
  stack.replaceChildren(...project.stack.map((item) => {
    const li = document.createElement("li");
    li.textContent = item.label;
    return li;
  }));
  stack.hidden = project.stack.length === 0;

  const link = dialog.querySelector(".dialog_link");
  link.hidden = !project.link;
  link.href = project.link;
  link.textContent = project.linkLabel;
  link.toggleAttribute("download", project.download);

  openDialog(dialog, returnFocusTo || project.card);
  return true;
}

function initProjects() {
  setupDialogClosing(document.getElementById("project-dialog"));
  const canTilt = !reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.querySelectorAll(".project_card[data-project]").forEach((card) => {
    const slug = card.dataset.project;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${card.querySelector("h1").textContent.trim()}: show details`);

    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return; // the card's own link still works
      openProject(slug, card);
    });
    card.addEventListener("keydown", (e) => {
      if (e.target !== card || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      openProject(slug, card);
    });

    if (canTilt) {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", `${x * 10}deg`);
        card.style.setProperty("--rx", `${y * -10}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    }
  });
}

/* ---------- skill tooltips ---------- */

function initSkillTooltips() {
  document.querySelectorAll("#skillsntech [data-skill]").forEach((icon) => {
    const skill = icon.dataset.skill;
    const usedIn = projectsUsing(skill);
    const text = usedIn.length ? `${SKILLS[skill]} · used in ${usedIn.join(", ")}` : SKILLS[skill];
    icon.dataset.tooltip = text;
    icon.tabIndex = 0;
    icon.setAttribute("role", "img");
    icon.setAttribute("aria-label", text);
  });
}

/* ---------- terminal ---------- */

function initTerminal() {
  const terminal = document.getElementById("terminal");
  const output = terminal.querySelector(".terminal_output");
  const form = terminal.querySelector("form");
  const input = terminal.querySelector("input");
  const history = [];
  let historyIndex = 0;
  let welcomed = false;

  const print = (text = "", className) => {
    const line = document.createElement("div");
    if (className) line.className = className;
    line.textContent = text;
    output.append(line);
    return line;
  };
  const printLink = (label, href) => {
    const line = print(`${label}: `);
    const a = document.createElement("a");
    a.href = href;
    a.textContent = href.replace(/^mailto:/, "");
    a.target = "_blank";
    a.rel = "noopener";
    line.append(a);
  };
  const sectionText = (selector) =>
    [...document.querySelectorAll(`${selector} > p`)].map((p) => stripTags(p.textContent));

  const close = () => terminal.close();

  const COMMANDS = {
    help: {
      about: "list available commands",
      run: () => {
        Object.entries(COMMANDS).forEach(([name, cmd]) => print(`  ${name.padEnd(12)}${cmd.about}`));
      },
    },
    whoami: {
      about: "who is this guy?",
      run: () => {
        document.querySelectorAll("#about .whoami > div").forEach((row) => {
          print(`${row.querySelector("dt").textContent.padEnd(10)}${row.querySelector("dd").textContent}`);
        });
      },
    },
    ls: {
      about: "list files (try: ls projects)",
      run: (args) => {
        if (args[0] === "projects" || args[0] === "projects/") return COMMANDS.projects.run();
        print("projects/  about.txt  experience.txt  skills.json");
      },
    },
    cat: {
      about: "read a file (cat about.txt)",
      run: (args) => {
        const files = { "about.txt": "about", "experience.txt": "experience", "skills.json": "skills" };
        if (!files[args[0]]) return print(`cat: ${args[0] || ""}: no such file`, "term_error");
        COMMANDS[files[args[0]]].run();
      },
    },
    about: {
      about: "about me",
      run: () => {
        COMMANDS.whoami.run();
        sectionText("#about").forEach((text) => { print(); print(text); });
      },
    },
    experience: {
      about: "work experience",
      run: () => {
        document.querySelectorAll("#experience .timeline_item").forEach((item, i) => {
          if (i) print();
          print(item.querySelector("h3").textContent, "term_heading");
          print(item.querySelector(".timeline_meta").textContent, "term_muted");
          item.querySelectorAll("li").forEach((li) => print(`  ${li.textContent}`));
        });
      },
    },
    skills: {
      about: "skills & technologies",
      run: () => {
        // the skills.json shown on the page, then which projects used what
        const json = document.querySelector("#skillsntech .code_block");
        if (json) json.textContent.split("\n").forEach((line) => print(line));
        print();
        Object.keys(SKILLS).forEach((skill) => {
          const usedIn = projectsUsing(skill);
          if (usedIn.length) print(`  ${SKILLS[skill].padEnd(12)}used in ${usedIn.join(", ")}`, "term_muted");
        });
      },
    },
    projects: {
      about: "list projects",
      run: () => {
        Object.keys(PROJECTS).forEach((slug) => {
          const project = getProject(slug);
          print(`  ${slug.padEnd(14)}${project.title}`);
        });
        print("type 'open <project>' for details");
      },
    },
    open: {
      about: "open a project (open nona-pd)",
      run: (args) => {
        const slug = args[0];
        if (!slug || !PROJECTS[slug]) {
          print(`open: unknown project '${slug || ""}'. try: ls projects`, "term_error");
          return;
        }
        close();
        openProject(slug);
      },
    },
    goto: {
      about: "jump to a section (goto about)",
      run: (args) => {
        const target = SECTIONS[args[0]];
        if (!target) {
          print(`goto: unknown section. try: ${Object.keys(SECTIONS).join(", ")}`, "term_error");
          return;
        }
        close();
        document.querySelector(target).scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      },
    },
    contact: {
      about: "how to reach me",
      run: () => {
        document.querySelectorAll("footer .socialIcons a").forEach((a) => {
          const href = a.getAttribute("href");
          if (!href) return; // skip links that aren't set up yet
          printLink(a.querySelector("img").alt, href);
        });
      },
    },
    clear: {
      about: "clear the screen",
      run: () => output.replaceChildren(),
    },
    exit: {
      about: "close the terminal",
      run: close,
    },
  };

  const run = (line) => {
    print(`guest@dinosdevv:~$ ${line}`, "term_cmd");
    const [name, ...args] = line.trim().split(/\s+/);
    if (!name) return;
    const command = COMMANDS[name.toLowerCase()];
    if (command) command.run(args.map((arg) => arg.toLowerCase()));
    else print(`command not found: ${name} (type 'help')`, "term_error");
  };

  const autocomplete = () => {
    const value = input.value.trimStart();
    const [name, partial] = value.split(/\s+/);
    let options;
    let prefix = "";
    if (value.includes(" ")) {
      const choices = { open: Object.keys(PROJECTS), goto: Object.keys(SECTIONS), cat: ["about.txt", "experience.txt", "skills.json"], ls: ["projects"] };
      options = (choices[name] || []).filter((option) => option.startsWith(partial || ""));
      prefix = `${name} `;
    } else {
      options = Object.keys(COMMANDS).filter((command) => command.startsWith(name));
    }
    if (options.length === 1) input.value = prefix + options[0] + (prefix ? "" : " ");
    else if (options.length > 1) print(options.join("  "));
  };

  const open = () => {
    if (terminal.open) return;
    if (document.getElementById("project-dialog").open) return;
    openDialog(terminal);
    if (!welcomed) {
      welcomed = true;
      print("Welcome to DinosDevv's terminal.");
      print("Type 'help' to see what you can do.");
      print();
    }
    input.focus();
  };

  setupDialogClosing(terminal);
  document.querySelectorAll(".terminal_btn").forEach((btn) => btn.addEventListener("click", open));
  output.addEventListener("click", () => {
    if (!window.getSelection().toString()) input.focus();
  });

  // ` opens the terminal, unless you're typing somewhere
  document.addEventListener("keydown", (e) => {
    if (e.key !== "`" || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    e.preventDefault();
    open();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const line = input.value;
    input.value = "";
    if (line.trim()) history.push(line);
    historyIndex = history.length;
    run(line);
    output.scrollTop = output.scrollHeight;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && historyIndex > 0) {
      e.preventDefault();
      input.value = history[--historyIndex];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      autocomplete();
      output.scrollTop = output.scrollHeight;
    }
  });
}

/* ---------- boot screen ---------- */

// runs once per browser session. The inline script in <head> adds the
// "booting" class (which hides the page) only when a boot should happen.
async function runBoot() {
  const root = document.documentElement;
  if (!root.classList.contains("booting")) return;

  const boot = document.createElement("div");
  boot.id = "boot";
  boot.setAttribute("aria-hidden", "true");
  document.body.append(boot);

  // any key, click, tap or scroll skips the rest
  let skip;
  const skipped = new Promise((resolve) => { skip = resolve; });
  const skipEvents = ["keydown", "pointerdown", "wheel", "touchstart"];
  skipEvents.forEach((type) => window.addEventListener(type, skip, { passive: true }));
  let isSkipped = false;
  skipped.then(() => { isSkipped = true; });
  const pause = (ms) => Promise.race([wait(ms), skipped]);

  const projectCount = document.querySelectorAll(".project_card").length;
  const skillCount = document.querySelectorAll("[data-skill]").length;
  const lines = [
    ["", "DinosDevv portfolio, boot sequence"],
    ["", ""],
    ["[ OK ]", "Loading font: Geist Mono"],
    ["[ OK ]", `Mounting /projects (${projectCount} found)`],
    ["[ OK ]", "Reading about.txt"],
    ["[ OK ]", `Indexing skills (${skillCount})`],
    ["[ OK ]", "Starting terminal (press ` to open)"],
    ["", ""],
    [">", "Welcome, guest."],
  ];

  const hint = document.createElement("div");
  hint.className = "boot_hint";
  hint.textContent = "press any key to skip";
  boot.append(hint);

  for (const [status, text] of lines) {
    if (isSkipped) break;
    const line = document.createElement("div");
    if (status) {
      const tag = document.createElement("span");
      tag.className = "boot_status";
      tag.textContent = `${status} `;
      line.append(tag);
    }
    line.append(text);
    boot.insertBefore(line, hint);
    await pause(150);
  }
  await pause(450);

  skipEvents.forEach((type) => window.removeEventListener(type, skip));
  try { sessionStorage.setItem("booted", "1"); } catch (e) { /* private mode etc. */ }
  root.classList.remove("booting");
  boot.classList.add("boot_done"); // fades out
  setTimeout(() => boot.remove(), 400);
}

/* ---------- status bar ---------- */

// a VS Code-style bar along the bottom: branch, "file" for the section
// you're looking at, scroll position and the time in Athens
function initStatusBar() {
  const bar = document.createElement("div");
  bar.className = "status_bar";
  bar.setAttribute("aria-hidden", "true"); // decorative, the page already has all this

  const item = (text, className = "") => {
    const span = document.createElement("span");
    span.className = `status_item ${className}`;
    span.textContent = text;
    return span;
  };

  const branch = document.createElement("a");
  branch.className = "status_item";
  branch.href = "https://github.com/DinosDevv/portfolio";
  branch.target = "_blank";
  branch.rel = "noopener";
  branch.tabIndex = -1;
  branch.textContent = "⎇ main";

  const file = item("~/portfolio");
  const scroll = item("Top");
  const encoding = item("UTF-8", "status_optional");
  const clock = item("", "status_optional");

  const left = document.createElement("div");
  left.append(branch, file);
  const right = document.createElement("div");
  right.append(scroll, encoding, clock);
  bar.append(left, right);
  document.body.append(bar);
  document.body.classList.add("has_status_bar");

  // which "file" you're in, based on the section crossing the middle of the screen
  const files = {
    main: "~/portfolio",
    projects: "~/portfolio/projects/",
    experience: "~/portfolio/experience.txt",
    skillsntech: "~/portfolio/skills.json",
    about: "~/portfolio/about.txt",
    footer: "~/portfolio/contact",
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        file.textContent = files[el.id] || files[el.classList.contains("main") ? "main" : "footer"];
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".main, #projects, #experience, #skillsntech, #about, footer")
      .forEach((el) => observer.observe(el));
  }

  // vim-style scroll position: Top / 42% / Bot
  let ticking = false;
  const updateScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100);
    scroll.textContent = percent <= 0 ? "Top" : percent >= 100 ? "Bot" : `${percent}%`;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) requestAnimationFrame(updateScroll);
    ticking = true;
  }, { passive: true });
  updateScroll();

  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Athens", hour: "2-digit", minute: "2-digit" });
  const updateClock = () => { clock.textContent = `Athens ${time.format(new Date())}`; };
  updateClock();
  setInterval(updateClock, 30 * 1000);
}

/* ---------- reactive background ---------- */

// a brighter copy of the background grid that only shows around the cursor
function initSpotlight() {
  if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const spotlight = document.createElement("div");
  spotlight.className = "grid_spotlight";
  spotlight.setAttribute("aria-hidden", "true");
  document.body.append(spotlight);

  let x = 0;
  let y = 0;
  let ticking = false;
  window.addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      spotlight.style.setProperty("--mx", `${x}px`);
      spotlight.style.setProperty("--my", `${y}px`);
      spotlight.classList.add("grid_spotlight_on");
    });
  }, { passive: true });
  // hide it when the mouse leaves the window
  document.documentElement.addEventListener("mouseleave", () => spotlight.classList.remove("grid_spotlight_on"));
}

/* ---------- start ---------- */

initMobileNav();
initDecode();
initStats();
initProjects();
initSkillTooltips();
initTerminal();
initStatusBar();
initSpotlight();
initTyping(runBoot());
