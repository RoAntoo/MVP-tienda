export function inicializarMenuMovil(): void {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!mobileMenuToggle || !mobileMenu) return;

  mobileMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
    mobileMenuToggle.setAttribute('aria-expanded', String(!isExpanded));
    mobileMenu.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('active')) {
      const target = e.target as Node;
      if (!mobileMenu.contains(target) && !mobileMenuToggle.contains(target)) {
        mobileMenu.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  const navLinks = mobileMenu.querySelectorAll('a, button');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
