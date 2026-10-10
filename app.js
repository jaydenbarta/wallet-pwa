/* ==========================================================================
   DIGITAL WALLET PWA - INTERACTION LOGIC & ROUTING
   ========================================================================== */

(function () {
  'use strict';

  // State Management
  const state = {
    currentScreen: 'home', // 'home' | 'detail' | 'settings'
    cardNickname: 'Personal Card',
    activeCardIndex: 1, // 0: transit, 1: platinum, 2: sapphire
    virtualCardExpanded: false,
    contactlessDefault: true
  };

  // DOM Elements - Screens
  const screenHome = document.getElementById('screen-home');
  const screenDetail = document.getElementById('screen-card-detail');
  const screenSettings = document.getElementById('screen-card-settings');

  // DOM Elements - Navigation Triggers
  const featuredMainCard = document.getElementById('featured-main-card');
  const heroCardClickable = document.getElementById('hero-card-clickable');
  const btnBackToHome = document.getElementById('btn-back-to-home');
  const btnBackToDetail = document.getElementById('btn-back-to-detail');

  // DOM Elements - Interactive widgets
  const virtualNumberCard = document.getElementById('virtual-number-card');
  const btnToggleVirtualCard = document.getElementById('btn-toggle-virtual-card');
  const virtualExpandedContent = document.getElementById('virtual-expanded-content');
  const virtualChevron = document.getElementById('virtual-chevron');

  // Modals & Overlays
  const modalAddSheet = document.getElementById('modal-add-sheet');
  const btnAddItem = document.getElementById('btn-add-item');
  const btnCloseAddSheet = document.getElementById('btn-close-add-sheet');

  const modalPassDetail = document.getElementById('modal-pass-detail');
  const btnClosePassModal = document.getElementById('btn-close-pass-modal');
  const passModalName = document.getElementById('pass-modal-name');
  const passModalTier = document.getElementById('pass-modal-tier');
  const passModalCode = document.getElementById('pass-modal-code');

  const nfcOverlay = document.getElementById('nfc-overlay');
  const btnContactlessHome = document.getElementById('btn-contactless-home');
  const contactlessBannerDetail = document.querySelector('.contactless-status-banner');

  const walletToast = document.getElementById('wallet-toast');

  // Screen Navigation Router
  function navigateTo(targetScreen, updateHistory = true) {
    if (state.currentScreen === targetScreen) return;

    const previousScreen = state.currentScreen;
    state.currentScreen = targetScreen;

    if (updateHistory) {
      history.pushState({ screen: targetScreen }, '', `#${targetScreen}`);
    }

    // Reset screen classes
    [screenHome, screenDetail, screenSettings].forEach((el) => {
      el.classList.remove('screen-active', 'screen-prev');
    });

    if (targetScreen === 'home') {
      screenHome.classList.add('screen-active');
      // Detail & settings are placed to the right
      screenDetail.style.transform = 'translateX(100%)';
      screenSettings.style.transform = 'translateX(100%)';
    } else if (targetScreen === 'detail') {
      screenHome.classList.add('screen-prev');
      screenDetail.classList.add('screen-active');
      screenDetail.style.transform = 'translateX(0)';
      screenSettings.style.transform = 'translateX(100%)';
    } else if (targetScreen === 'settings') {
      screenHome.classList.add('screen-prev');
      screenDetail.classList.add('screen-prev');
      screenSettings.classList.add('screen-active');
      screenSettings.style.transform = 'translateX(0)';
    }

    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  // Handle browser back button (PWA native feel)
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.screen) {
      navigateTo(e.state.screen, false);
    } else {
      navigateTo('home', false);
    }
  });

  // Setup Initial URL state
  history.replaceState({ screen: 'home' }, '', '#home');

  // 1. Home Screen -> Tap Card -> Opens Screen 2 (Card Details)
  featuredMainCard.addEventListener('click', () => {
    navigateTo('detail');
  });

  // 2. Screen 2 -> Tap Card -> Opens Screen 3 (Card Settings Menu)
  heroCardClickable.addEventListener('click', () => {
    navigateTo('settings');
  });

  // Back Navigation Handlers
  btnBackToHome.addEventListener('click', () => {
    navigateTo('home');
  });

  btnBackToDetail.addEventListener('click', () => {
    navigateTo('detail');
  });

  // Virtual Account Number Accordion in Screen 3
  btnToggleVirtualCard.addEventListener('click', () => {
    state.virtualCardExpanded = !state.virtualCardExpanded;
    if (state.virtualCardExpanded) {
      virtualExpandedContent.classList.add('panel-open');
      virtualChevron.classList.add('rotate-180');
    } else {
      virtualExpandedContent.classList.remove('panel-open');
      virtualChevron.classList.remove('rotate-180');
    }
    if (navigator.vibrate) navigator.vibrate(10);
  });

  // Screen 3 Menu Item Actions
  document.getElementById('row-activity').addEventListener('click', () => {
    navigateTo('detail');
  });

  document.getElementById('row-contactless-toggle').addEventListener('click', () => {
    showToast('Card set as default for contactless');
    triggerNfcPulse();
  });

  document.getElementById('row-edit-nickname').addEventListener('click', () => {
    const newName = prompt('Enter card nickname:', state.cardNickname);
    if (newName && newName.trim()) {
      state.cardNickname = newName.trim();
      document.getElementById('display-card-nickname').textContent = state.cardNickname;
      document.getElementById('label-nickname-sub').textContent = state.cardNickname;
      const titleEl = document.querySelector('.nav-screen-title');
      if (titleEl) titleEl.textContent = state.cardNickname;
      const labelEl = document.querySelector('.contactless-label-text') || document.querySelector('.contactless-pill-text');
      if (labelEl) labelEl.textContent = state.cardNickname;
      showToast('Nickname updated');
    }
  });

  document.getElementById('row-learn-how').addEventListener('click', () => {
    showToast('Hold phone near reader to pay with Google Pay');
  });

  document.getElementById('row-call-bank').addEventListener('click', () => {
    showToast('American Express 24/7 Support: 1300 363 644');
  });

  document.getElementById('row-terms').addEventListener('click', () => {
    showToast('Opening American Express Cardmember Agreement...');
  });

  document.getElementById('row-privacy').addEventListener('click', () => {
    showToast('American Express Privacy Policy: Up to date');
  });

  // Contactless Tap Simulation (NFC ripple)
  function triggerNfcPulse() {
    nfcOverlay.classList.add('pulse-active');
    if (navigator.vibrate) {
      navigator.vibrate([40, 80, 40]);
    }
    setTimeout(() => {
      nfcOverlay.classList.remove('pulse-active');
    }, 1800);
  }

  btnContactlessHome.addEventListener('click', triggerNfcPulse);
  if (contactlessBannerDetail) {
    contactlessBannerDetail.addEventListener('click', triggerNfcPulse);
  }

  // Loyalty Passes Interaction
  const passData = {
    woolworths: { name: 'Woolworths', tier: 'Everyday Rewards', code: '9312 8490 2938 1092' },
    flybuys: { name: 'Flybuys', tier: 'Points & Offers', code: '6008 1928 3491 5501' },
    barta: { name: 'Jayden Barta', tier: 'BARTA Property Member', code: 'BP-2026-8819-AU' },
    starbucks: { name: 'Starbucks', tier: 'Starbucks Rewards Green', code: '6128 4402 9182 3319' },
    zarraffas: { name: "Zarraffa's", tier: 'Zarraffas Coffee Club', code: '4910 2819 0921 7712' },
    iga: { name: 'IGA Rewards', tier: 'Member Club Card', code: '7729 1048 2910 4481' }
  };

  document.querySelectorAll('.pass-tile').forEach((tile) => {
    tile.addEventListener('click', () => {
      const passKey = tile.getAttribute('data-pass');
      const data = passData[passKey] || { name: 'Pass', tier: 'Member', code: '1234 5678 9012' };

      passModalName.textContent = data.name;
      passModalTier.textContent = data.tier;
      passModalCode.textContent = data.code;

      modalPassDetail.classList.add('modal-open');
      if (navigator.vibrate) navigator.vibrate(15);
    });
  });

  btnClosePassModal.addEventListener('click', () => {
    modalPassDetail.classList.remove('modal-open');
  });

  modalPassDetail.addEventListener('click', (e) => {
    if (e.target === modalPassDetail) {
      modalPassDetail.classList.remove('modal-open');
    }
  });

  // Ticketek Event Pass Interaction
  const eventTicketPass = document.getElementById('event-ticket-pass');
  if (eventTicketPass) {
    eventTicketPass.addEventListener('click', () => {
      passModalName.textContent = 'Tame Impala';
      passModalTier.textContent = 'Brisbane Ent Centre • 7:30 pm';
      passModalCode.textContent = 'TK-9482-1084-AU';
      modalPassDetail.classList.add('modal-open');
      if (navigator.vibrate) navigator.vibrate(15);
    });
  }

  // "View more" passes smooth scroll down
  const btnViewMore = document.getElementById('btn-view-more-passes');
  if (btnViewMore) {
    btnViewMore.addEventListener('click', () => {
      const scrollArea = document.querySelector('.home-scroll-area');
      if (scrollArea) {
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
      }
    });
  }

  // "Add to Wallet" Bottom Sheet
  btnAddItem.addEventListener('click', () => {
    modalAddSheet.classList.add('modal-open');
  });

  btnCloseAddSheet.addEventListener('click', () => {
    modalAddSheet.classList.remove('modal-open');
  });

  modalAddSheet.addEventListener('click', (e) => {
    if (e.target === modalAddSheet) {
      modalAddSheet.classList.remove('modal-open');
    }
  });

  document.getElementById('btn-add-payment-card').addEventListener('click', () => {
    modalAddSheet.classList.remove('modal-open');
    showToast('Scan your debit or credit card');
  });

  document.getElementById('btn-add-loyalty-pass').addEventListener('click', () => {
    modalAddSheet.classList.remove('modal-open');
    showToast('Search loyalty program to add');
  });

  document.getElementById('btn-add-transit-pass').addEventListener('click', () => {
    modalAddSheet.classList.remove('modal-open');
    showToast('Select transit network');
  });

  // Carousel Peek Switching
  const peekLeft = document.querySelector('.card-peek-left');
  const peekRight = document.querySelector('.card-peek-right');

  if (peekLeft) {
    peekLeft.addEventListener('click', () => {
      showToast('Viewing Opal Transit Pass');
    });
  }

  if (peekRight) {
    peekRight.addEventListener('click', () => {
      showToast('Viewing Sapphire Platinum Card');
    });
  }

  // Touch Swipe on Carousel
  let touchStartX = 0;
  let touchEndX = 0;
  const carouselContainer = document.getElementById('cards-carousel');

  carouselContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carouselContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleCarouselSwipe();
  }, { passive: true });

  function handleCarouselSwipe() {
    const diff = touchEndX - touchStartX;
    if (diff > 50) {
      // Swiped right -> peek left
      if (peekLeft) peekLeft.click();
    } else if (diff < -50) {
      // Swiped left -> peek right
      if (peekRight) peekRight.click();
    }
  }

  // Toast Notification Helper
  let toastTimer = null;
  function showToast(message) {
    clearTimeout(toastTimer);
    walletToast.textContent = message;
    walletToast.classList.add('toast-show');
    toastTimer = setTimeout(() => {
      walletToast.classList.remove('toast-show');
    }, 2400);
  }

  // Dynamic Scrollbar: only visible while actively scrolling, fades out when idle
  const scrollContainers = document.querySelectorAll('.home-scroll-area, .detail-scroll-area, .settings-scroll-area');
  scrollContainers.forEach(container => {
    let scrollTimeout;
    container.addEventListener('scroll', () => {
      container.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        container.classList.remove('is-scrolling');
      }, 700);
    }, { passive: true });
  });

  // Hide native browser navigation & address bar on mobile interaction
  function requestAppFullscreen() {
    if (!document.fullscreenElement && !window.matchMedia('(display-mode: standalone)').matches) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    }
  }
  document.addEventListener('touchstart', requestAppFullscreen, { once: true, passive: true });
  document.addEventListener('click', requestAppFullscreen, { once: true });

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          reg.update();
          console.log('Service Worker Registered & Updated:', reg.scope);
        })
        .catch((err) => console.log('Service Worker Error:', err));
    });
  }
})();
