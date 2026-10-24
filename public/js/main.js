// Apex Student & Alumni Portal - Client Scripts
document.addEventListener("DOMContentLoaded", () => {
    // Mobile navigation toggle
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mainNav = document.getElementById("mainNav");

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener("click", () => {
            const isOpen = mainNav.classList.toggle("nav-open");
            mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    // Auto-dismiss or focus management if needed
});
