// Function to calculate and log section positions
document.addEventListener("DOMContentLoaded", function () {
  let currentPage = 1;
  let lastScrollTop = 0;
  let scrollDirection = "none";
  let isLocked = false;
  const THRESHOLD = 820;
  const NOTES_THRESHOLD = 800;
  const LOCK_DURATION = 1000;

  // Function to check if there's enough space for a section
  function hasEnoughSpace(sectionClass) {
    const section = document.querySelector(sectionClass);
    const reportPage = document.querySelector(".report-page");
    if (!section || !reportPage) return false;

    const sectionRect = section.getBoundingClientRect();
    const pageRect = reportPage.getBoundingClientRect();

    // Calculate the space needed and available
    const spaceNeeded = sectionRect.height;
    const currentPosition = sectionRect.top;
    const availableSpace = pageRect.height - currentPosition;

    // Return true only if we have enough space to fit the entire section
    return availableSpace >= spaceNeeded;
  }

  // Function to check if notes are on page 2
  function areNotesOnPageTwo() {
    const notes1 = document.querySelector(".notes-section");
    return notes1 && notes1.style.display === "none";
  }

  // Function to force page 2 display for a section
  function forcePageTwo(section1Class, section2Class) {
    const section1 = document.querySelector(section1Class);
    const section2 = document.querySelector(section2Class);

    if (!section1 || !section2) return;

    section1.style.display = "none";
    section2.style.display =
      section1Class === ".signatures-section" ? "flex" : "block";
    section2.style.opacity = "1";
    currentPage = 2;
  }

  // Initialize page state
  function initializePageState() {
    const signatures1 = document.querySelector(".signatures-section");
    const signatures2 = document.querySelector(".signatures-section-2");
    const notes1 = document.querySelector(".notes-section");
    const notes2 = document.querySelector(".notes-section-2");

    if (!signatures1 || !signatures2 || !notes1 || !notes2) return;

    // Set initial styles
    signatures1.style.transition = "opacity 0.3s ease-out";
    signatures2.style.transition = "opacity 0.3s ease-out";
    notes1.style.transition = "opacity 0.3s ease-out";
    notes2.style.transition = "opacity 0.3s ease-out";

    // Check space availability for notes first
    if (!hasEnoughSpace(".notes-section") || window.scrollY > NOTES_THRESHOLD) {
      forcePageTwo(".notes-section", ".notes-section-2");
      forcePageTwo(".signatures-section", ".signatures-section-2"); // Force signatures to page 2 as well
      return;
    }

    // Only check signatures if notes are on page 1
    if (!hasEnoughSpace(".signatures-section")) {
      forcePageTwo(".signatures-section", ".signatures-section-2");
    }

    // Handle initial display based on scroll position
    if (window.scrollY <= NOTES_THRESHOLD && hasEnoughSpace(".notes-section")) {
      notes1.style.display = "block";
      notes2.style.display = "none";
      notes1.style.opacity = "1";

      if (
        window.scrollY <= THRESHOLD &&
        hasEnoughSpace(".signatures-section")
      ) {
        signatures1.style.display = "flex";
        signatures2.style.display = "none";
        signatures1.style.opacity = "1";
      } else {
        forcePageTwo(".signatures-section", ".signatures-section-2");
      }
    } else {
      // If notes go to page 2, signatures follow
      forcePageTwo(".notes-section", ".notes-section-2");
      forcePageTwo(".signatures-section", ".signatures-section-2");
    }
  }

  // Function to switch pages for a section
  function switchPage(toPage, section1Class, section2Class) {
    if (isLocked) return;

    const section1 = document.querySelector(section1Class);
    const section2 = document.querySelector(section2Class);

    if (!section1 || !section2) return;

    // If switching notes to page 2, force signatures to page 2 as well
    if (toPage === 2 && section1Class === ".notes-section") {
      forcePageTwo(".signatures-section", ".signatures-section-2");
    }

    // Don't allow signatures on page 1 if notes are on page 2
    if (
      toPage === 1 &&
      section1Class === ".signatures-section" &&
      areNotesOnPageTwo()
    ) {
      return;
    }

    // Always check space before allowing switch to page 1
    if (toPage === 1) {
      if (!hasEnoughSpace(section1Class)) {
        forcePageTwo(section1Class, section2Class);
        return;
      }
    }

    isLocked = true;

    if (toPage === 1) {
      // Switch to page 1
      section1.style.display =
        section1Class === ".signatures-section" ? "flex" : "block";
      section1.style.opacity = "0";
      requestAnimationFrame(() => {
        section1.style.opacity = "1";
        section2.style.opacity = "0";
        setTimeout(() => {
          section2.style.display = "none";
        }, 300);
      });
    } else {
      // Switch to page 2
      section2.style.display =
        section1Class === ".signatures-section" ? "flex" : "block";
      section2.style.opacity = "0";
      requestAnimationFrame(() => {
        section2.style.opacity = "1";
        section1.style.opacity = "0";
        setTimeout(() => {
          section1.style.display = "none";
        }, 300);
      });
    }

    setTimeout(() => {
      isLocked = false;
    }, LOCK_DURATION);
  }

  // Function to handle scroll events
  function handleScroll() {
    if (isLocked) return;

    const currentScrollTop = window.scrollY;
    const signatures = document.querySelector(".signatures-section");
    const notes = document.querySelector(".notes-section");

    if (!signatures || !notes) return;

    // Determine scroll direction
    scrollDirection = currentScrollTop > lastScrollTop ? "down" : "up";

    // Get section positions
    const signaturesRect = signatures.getBoundingClientRect();
    const notesRect = notes.getBoundingClientRect();
    const signaturesBottom = Math.round(signaturesRect.bottom + window.scrollY);
    const notesBottom = Math.round(notesRect.bottom + window.scrollY);

    // Handle notes section first
    if (!hasEnoughSpace(".notes-section")) {
      forcePageTwo(".notes-section", ".notes-section-2");
      forcePageTwo(".signatures-section", ".signatures-section-2"); // Force signatures to follow
    } else if (scrollDirection === "down" && notesBottom > NOTES_THRESHOLD) {
      switchPage(2, ".notes-section", ".notes-section-2");
      forcePageTwo(".signatures-section", ".signatures-section-2"); // Force signatures to follow
    } else if (scrollDirection === "up" && notesBottom <= NOTES_THRESHOLD) {
      if (hasEnoughSpace(".notes-section")) {
        switchPage(1, ".notes-section", ".notes-section-2");
        // Only allow signatures to go to page 1 if there's space
        if (
          hasEnoughSpace(".signatures-section") &&
          signaturesBottom <= THRESHOLD
        ) {
          switchPage(1, ".signatures-section", ".signatures-section-2");
        }
      } else {
        forcePageTwo(".notes-section", ".notes-section-2");
        forcePageTwo(".signatures-section", ".signatures-section-2");
      }
    }

    // Handle signatures section only if notes are on page 1
    if (!areNotesOnPageTwo()) {
      if (!hasEnoughSpace(".signatures-section")) {
        forcePageTwo(".signatures-section", ".signatures-section-2");
      } else if (scrollDirection === "down" && signaturesBottom > THRESHOLD) {
        switchPage(2, ".signatures-section", ".signatures-section-2");
      } else if (scrollDirection === "up" && signaturesBottom <= THRESHOLD) {
        if (hasEnoughSpace(".signatures-section")) {
          switchPage(1, ".signatures-section", ".signatures-section-2");
        } else {
          forcePageTwo(".signatures-section", ".signatures-section-2");
        }
      }
    }

    lastScrollTop = currentScrollTop;
  }

  // Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        requestAnimationFrame(() => {
          inThrottle = false;
        });
      }
    };
  }

  // Setup event listeners
  function setupEventListeners() {
    // Throttled scroll handler
    const throttledScrollHandler = throttle(handleScroll, 16);
    window.addEventListener("scroll", throttledScrollHandler, {
      passive: true,
    });

    // Handle resize
    const handleResize = throttle(() => {
      if (!isLocked) {
        // Check notes section first
        if (!hasEnoughSpace(".notes-section")) {
          forcePageTwo(".notes-section", ".notes-section-2");
          forcePageTwo(".signatures-section", ".signatures-section-2");
          return;
        }

        const notes = document.querySelector(".notes-section");
        if (notes) {
          const notesRect = notes.getBoundingClientRect();
          const notesBottom = Math.round(notesRect.bottom + window.scrollY);

          if (
            notesBottom <= NOTES_THRESHOLD &&
            hasEnoughSpace(".notes-section")
          ) {
            switchPage(1, ".notes-section", ".notes-section-2");
            // Only check signatures if notes are on page 1
            const signatures = document.querySelector(".signatures-section");
            if (signatures) {
              const sigRect = signatures.getBoundingClientRect();
              const sigBottom = Math.round(sigRect.bottom + window.scrollY);

              if (
                sigBottom <= THRESHOLD &&
                hasEnoughSpace(".signatures-section")
              ) {
                switchPage(1, ".signatures-section", ".signatures-section-2");
              } else {
                switchPage(2, ".signatures-section", ".signatures-section-2");
              }
            }
          } else {
            // If notes go to page 2, signatures follow
            switchPage(2, ".notes-section", ".notes-section-2");
            switchPage(2, ".signatures-section", ".signatures-section-2");
          }
        }
      }
    }, 100);

    window.addEventListener("resize", handleResize, { passive: true });

    // Handle page load
    window.addEventListener(
      "load",
      () => {
        setTimeout(initializePageState, 100);
      },
      { passive: true }
    );
  }

  // Initialize
  initializePageState();
  setupEventListeners();
});
