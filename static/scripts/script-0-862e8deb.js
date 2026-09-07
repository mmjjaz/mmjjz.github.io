(() => {
  if (window.__qzPanelToggleBound) return
  window.__qzPanelToggleBound = true

  const KEY = "qz-panels-v2"
  const defaults = { left: true, right: true }
  let exitSource = "book"
  let state = loadSaved()

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}")
      return {
        left: typeof saved.left === "boolean" ? saved.left : true,
        right: typeof saved.right === "boolean" ? saved.right : true,
      }
    } catch {
      return { ...defaults }
    }
  }

  function anchorButtons() {
    if (window.innerWidth < 1200) return
    const leftPanel = document.querySelector(".sidebar.left")
    const rightPanel = document.querySelector(".sidebar.right")
    const leftBtn = document.querySelector(".panel-toggle-left")
    const rightBtn = document.querySelector(".panel-toggle-right")
    const body = document.querySelector("#quartz-body")
    if (!leftPanel || !rightPanel || !leftBtn || !rightBtn || !body) return

    const bodyRect = body.getBoundingClientRect()
    const bodyStyle = getComputedStyle(body)
    const gap = parseFloat(bodyStyle.columnGap || bodyStyle.gap) || 0
    const padLeft = parseFloat(bodyStyle.paddingLeft) || 0
    const padRight = parseFloat(bodyStyle.paddingRight) || 0
    const leftWidth = state.left
      ? parseFloat(getComputedStyle(leftPanel).flexBasis) || 300
      : 0
    const rightWidth = state.right
      ? parseFloat(getComputedStyle(rightPanel).flexBasis) || 300
      : 0
    const btnWidth = leftBtn.getBoundingClientRect().width || 28

    const leftCenter = state.left
      ? bodyRect.left + padLeft + leftWidth + gap / 2
      : bodyRect.left + padLeft
    leftBtn.style.left = leftCenter - btnWidth / 2 + "px"
    leftBtn.style.right = "auto"
    leftBtn.style.transform = "translateY(-50%)"

    const rightCenter = state.right
      ? bodyRect.right - padRight - rightWidth - gap / 2
      : bodyRect.right - padRight - btnWidth / 2
    rightBtn.style.left = rightCenter - btnWidth / 2 + "px"
    rightBtn.style.right = "auto"
    rightBtn.style.transform = "translateY(-50%)"
  }

  function syncState() {
    const root = document.documentElement
    root.dataset.panelLeft = state.left ? "open" : "closed"
    root.dataset.panelRight = state.right ? "open" : "closed"
    document.querySelectorAll(".panel-toggle-btn").forEach((btn) => {
      const side = btn.dataset.panel
      const open = side === "left" ? state.left : state.right
      btn.dataset.state = open ? "open" : "closed"
      btn.setAttribute("aria-pressed", String(open))
    })
    anchorButtons()
    requestAnimationFrame(anchorButtons)
    setTimeout(anchorButtons, 360)
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  }

  function openAll() {
    state.left = true
    state.right = true
    save()
    syncState()
  }

  function closeAll() {
    state.left = false
    state.right = false
    syncState()
  }

  function closeActiveGraph() {
    document.querySelectorAll(".global-graph-outer.active").forEach((el) => {
      el.classList.remove("active")
      const sidebar = el.closest(".sidebar")
      if (sidebar) sidebar.style.zIndex = ""
    })
  }

  function onDocumentClick(event) {
    const btn = event.target.closest(".panel-toggle-btn")
    if (!btn) return
    if (document.documentElement.getAttribute("reader-mode") === "on") {
      const side = btn.dataset.panel
      exitSource = side === "left" ? "edge-left" : "edge-right"
      state.left = side === "left"
      state.right = side === "right"
      save()
      syncState()
      const book = document.querySelector(".readermode")
      if (book) book.click()
      exitSource = "book"
      return
    }
    const side = btn.dataset.panel
    if (side === "left") state.left = !state.left
    if (side === "right") state.right = !state.right
    save()
    syncState()
  }

  function onReaderClick(event) {
    if (!event.target.closest(".readermode")) return
    const readerOn = document.documentElement.getAttribute("reader-mode") === "on"
    if (readerOn) {
      if (exitSource === "book") openAll()
    } else {
      closeAll()
    }
  }

  function onPageHide() {
    closeActiveGraph()
  }

  function onPageShow(event) {
    if (event.persisted) {
      state = loadSaved()
      if (document.documentElement.getAttribute("reader-mode") === "on") {
        state.left = false
        state.right = false
      }
      syncState()
    }
  }

  function onResize() {
    anchorButtons()
  }

  function onNav() {
    state = loadSaved()
    if (document.documentElement.getAttribute("reader-mode") === "on") {
      state.left = false
      state.right = false
    }
    syncState()
  }

  document.addEventListener("click", onDocumentClick)
  document.addEventListener("click", onReaderClick, true)
  window.addEventListener("pagehide", onPageHide)
  window.addEventListener("pageshow", onPageShow)
  window.addEventListener("resize", onResize)
  document.addEventListener("nav", onNav)
  document.addEventListener("render", onNav)
  syncState()
})()