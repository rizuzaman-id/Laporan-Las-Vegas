/* ============================================
   R2 NUSANTARA — MAIN APPLICATION
   Keranjang (localStorage), Wishlist, Dark Mode,
   Quick View, Visitor Counter, Checkout via WA,
   Testimonial Slider, Scroll Progress, Bottom Nav.
   ============================================ */
(function() {
    'use strict';

    // ============================================
    // 1. STATE GLOBAL
    // ============================================
    var cart = [];
    try { cart = JSON.parse(localStorage.getItem('r2_cart')) || []; } catch (e) { cart = []; }
    window.__cart = cart;

    var wishlist = [];
    try { wishlist = JSON.parse(localStorage.getItem('r2_wishlist')) || []; } catch (e) { wishlist = []; }

    var activeCatalog = 'r2';
    var currentPage = 1;
    var itemsPerPage = 12;
    var activeFilter = 'all';
    var activeSort = 'name-asc';
    var searchTerm = '';
    var viewMode = 'grid';

    // ============================================
    // 2. UTILITIES
    // ============================================
    function formatRupiah(n) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    }

    function getR2Tier(price) {
        if (price <= 76000) return 'hemat';
        if (price >= 90000) return 'premium';
        return 'populer';
    }

    function getCartQty(id) {
        var i = cart.find(function(x) { return x.id === id; });
        return i ? i.qty : 0;
    }

    function isWishlisted(id) { return wishlist.indexOf(id) > -1; }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(m, type) {
        type = type || 'success';
        var c = document.getElementById('toast-container');
        if (!c) return;
        var to = document.createElement('div');
        var iconClass = type === 'success' ? 'fa-check-circle text-emerald-400' : type === 'error' ?
            'fa-circle-exclamation text-red-400' : 'fa-circle-info text-brand-400';
        to.className =
            'bg-brand-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transform translate-x-full transition-transform duration-300 border border-white/10';
        to.innerHTML = '<i class="fa-solid ' + iconClass + '"></i><span class="font-bold text-xs">' + m + '</span>';
        c.appendChild(to);
        setTimeout(function() { to.classList.remove('translate-x-full'); }, 10);
        setTimeout(function() {
            to.classList.add('translate-x-full');
            setTimeout(function() { to.remove(); }, 300);
        }, 2500);
    }

    function saveCart() {
        try { localStorage.setItem('r2_cart', JSON.stringify(cart)); } catch (e) {}
    }

    function saveWishlist() {
        try { localStorage.setItem('r2_wishlist', JSON.stringify(wishlist)); } catch (e) {}
    }

    // ============================================
    // 3. DARK MODE
    // ============================================
    (function applyStoredDarkMode() {
        var stored = localStorage.getItem('r2_dark_mode');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (stored === 'true' || (stored === null && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
    })();

    window.toggleDarkMode = function() {
        document.documentElement.classList.toggle('dark');
        var isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('r2_dark_mode', isDark);
        var icon = document.getElementById('darkModeIcon');
        if (icon) icon.className = isDark ? 'fa-solid fa-sun text-[13px] sm:text-sm' :
            'fa-solid fa-moon text-[13px] sm:text-sm';
    };

    // ============================================
    // 4. KATALOG — FILTER / SORT / SEARCH
    // ============================================
    window.switchCatalog = function(cat) {
        if (cat !== 'r2' && cat !== 'resmi') return;
        activeCatalog = cat;
        activeFilter = 'all';
        currentPage = 1;
        searchTerm = '';
        var searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.catalog-tab').forEach(function(tab) {
            var isActive = tab.dataset.tab === cat;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        updateCatalogInfoBanner();
        buildFilterChips();
        var indicator = document.getElementById('activeFilterIndicator');
        if (indicator) indicator.classList.add('hidden');
        renderProductDisplay();
    };

    function updateCatalogInfoBanner() {
        var banner = document.getElementById('catalogInfoBanner');
        var icon = document.getElementById('catalogInfoIcon');
        var title = document.getElementById('catalogInfoTitle');
        var desc = document.getElementById('catalogInfoDesc');
        if (!banner) return;
        if (activeCatalog === 'r2') {
            banner.classList.remove('resmi');
            if (icon) icon.className = 'fa-solid fa-fire-flame-curved text-lg';
            if (title) title.textContent = 'Katalog R2 Nusantara';
            if (desc) desc.textContent = '167 merek lokal pilihan dengan harga kompetitif untuk margin maksimal.';
        } else {
            banner.classList.add('resmi');
            if (icon) icon.className = 'fa-solid fa-certificate text-lg';
            if (title) title.textContent = 'Katalog Resmi — Brand Nasional & Internasional';
            if (desc) desc.textContent = '66 merek resmi terbagi dalam 5 segmen. Harga grosir per slop.';
        }
    }

    function buildFilterChips() {
        var container = document.getElementById('filterChipsContainer');
        if (!container) return;
        if (activeCatalog === 'r2') {
            container.innerHTML =
                '<button onclick="applyFilter(\'all\')" id="chip-all" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-900 text-white shadow-md">Semua</button>' +
                '<button onclick="applyFilter(\'hemat\')" id="chip-hemat" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600"><i class="fa-solid fa-piggy-bank text-[10px]"></i> Hemat</button>' +
                '<button onclick="applyFilter(\'populer\')" id="chip-populer" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-600"><i class="fa-solid fa-fire text-[10px]"></i> Populer</button>' +
                '<button onclick="applyFilter(\'premium\')" id="chip-premium" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-600"><i class="fa-solid fa-crown text-[10px]"></i> Premium</button>';
        } else {
            container.innerHTML =
                '<button onclick="applyFilter(\'all\')" id="chip-all" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-900 text-white shadow-md">Semua</button>' +
                '<button onclick="applyFilter(\'segA\')" id="chip-segA" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:text-amber-700"><i class="fa-solid fa-gem text-[10px]"></i> Segmen A</button>' +
                '<button onclick="applyFilter(\'segB\')" id="chip-segB" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-700"><i class="fa-solid fa-star text-[10px]"></i> Segmen B</button>' +
                '<button onclick="applyFilter(\'segC\')" id="chip-segC" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700"><i class="fa-solid fa-leaf text-[10px]"></i> Segmen C</button>' +
                '<button onclick="applyFilter(\'segD\')" id="chip-segD" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-pink-300 hover:text-pink-700"><i class="fa-solid fa-globe text-[10px]"></i> Segmen D</button>' +
                '<button onclick="applyFilter(\'segE\')" id="chip-segE" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700"><i class="fa-solid fa-hand-holding-heart text-[10px]"></i> Segmen E</button>';
        }
    }

    function getProcessedProducts() {
        var source = activeCatalog === 'r2' ? productsR2 : productsResmi;
        var r = source.slice();
        if (searchTerm) r = r.filter(function(p) { return p.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1; });
        if (activeCatalog === 'r2') {
            if (activeFilter !== 'all') r = r.filter(function(p) { return getR2Tier(p.price) === activeFilter; });
        } else {
            if (activeFilter !== 'all') {
                var seg = activeFilter.replace('seg', '');
                r = r.filter(function(p) { return p.segment === seg; });
            }
        }
        r.sort(function(a, b) {
            if (activeSort === 'price-asc') return a.price - b.price;
            if (activeSort === 'price-desc') return b.price - a.price;
            return a.name.localeCompare(b.name);
        });
        return r;
    }

    function buildCardActions(p) {
        var q = getCartQty(p.id);
        return q > 0 ?
            '<div class="flex items-center justify-between border-2 border-brand-500 rounded-xl bg-brand-50 dark:bg-brand-900/20 p-1 mt-4 stepper-enter"><button onclick="window.__updateQty(\'' +
            p.id +
            '\',-1)" class="w-9 h-9 rounded-lg bg-white text-brand-600 font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-transform">-</button><span class="font-bold text-brand-900 dark:text-white">' +
            q +
            '</span><button onclick="window.__updateQty(\'' + p.id +
            '\',1)" class="w-9 h-9 rounded-lg bg-brand-500 text-white font-bold shadow-sm hover:bg-brand-600 active:scale-95 transition-transform">+</button></div>' :
            '<button onclick="window.__addCart(\'' + p.id +
            '\')" class="w-full mt-4 py-3 bg-slate-100 text-brand-900 font-bold rounded-xl hover:bg-brand-900 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"><i class="fa-solid fa-plus text-xs"></i> Tambah</button>';
    }

    function buildProductCardHTML(p, idx) {
        var isResmi = p.category === 'resmi';
        var badge = '';
        if (isResmi) {
            var seg = p.segment;
            var segLabels = { A: 'PREMIUM', B: 'REGULER', C: 'MILD', D: 'INTERNATIONAL', E: 'LEGACY' };
            var segIcons = { A: 'gem', B: 'star', C: 'leaf', D: 'globe', E: 'hand-holding-heart' };
            badge = '<span class="segment-badge segment-' + seg + '"><i class="fa-solid fa-' + segIcons[seg] +
                '"></i> SEG ' + seg + ' · ' + segLabels[seg] + '</span>';
        } else {
            var ti = getR2Tier(p.price);
            if (ti === 'hemat') badge = '<span class="segment-badge tier-hemat"><i class="fa-solid fa-piggy-bank"></i> HEMAT</span>';
            else if (ti === 'premium') badge = '<span class="segment-badge tier-premium"><i class="fa-solid fa-crown"></i> PREMIUM</span>';
            else badge = '<span class="segment-badge tier-populer"><i class="fa-solid fa-fire"></i> POPULER</span>';
        }
        var catIndicator = isResmi ?
            '<span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><i class="fa-solid fa-certificate text-[8px]"></i> RESMI</span>' :
            '<span class="inline-flex items-center gap-1 text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200"><i class="fa-solid fa-fire-flame-curved text-[8px]"></i> R2</span>';
        var wl = isWishlisted(p.id);
        var actions = '<div class="absolute top-4 right-4 z-20 flex flex-col gap-2">' +
            '<button onclick="toggleWishlistItem(\'' + p.id + '\', event)" class="wishlist-heart-btn' + (wl ? ' is-active' :
                '') + '" aria-label="Wishlist"><i class="fa-' + (wl ? 'solid' : 'regular') +
            ' fa-heart text-xs"></i></button>' +
            '<button onclick="openQuickView(\'' + p.id +
            '\')" class="quickview-btn" aria-label="Lihat Cepat"><i class="fa-solid fa-eye text-xs"></i></button>' +
            '</div>';
        return '<div class="bg-white dark:bg-transparent rounded-3xl p-6 border border-slate-200 card-premium card-glow relative overflow-hidden flex flex-col justify-between group card-enter' +
            (isResmi ? ' product-card-resmi' : '') + '" style="animation-delay:' + (idx * 40) + 'ms" data-pid="' + p.id +
            '">' +
            actions +
            '<div class="relative z-10"><div class="flex justify-between items-start mb-4 gap-2 pr-16">' +
            badge + '<div class="flex flex-col items-end gap-1 shrink-0">' + catIndicator +
            '<span class="text-slate-300 text-[10px] font-mono font-bold">' + p.id.toUpperCase() + '</span></div></div>' +
            '<h3 class="text-lg font-extrabold text-brand-900 dark:text-white leading-tight mb-1 group-hover:text-brand-500 transition-colors">' +
            escapeHtml(p.name) + '</h3>' +
            (isResmi ? '<p class="text-[10px] text-slate-500 font-medium mb-2 italic">' + escapeHtml(p.segmentName) +
                '</p>' : '') +
            '<p class="text-2xl font-black text-brand-900 dark:text-white font-mono tracking-tighter">' +
            formatRupiah(p.price) + '<span class="text-[10px] text-slate-400 font-sans font-medium ml-1">/slop</span></p></div>' +
            '<div class="relative z-10">' + buildCardActions(p) + '</div></div>';
    }

    function buildProductRowHTML(p, idx) {
        var isResmi = p.category === 'resmi';
        var wl = isWishlisted(p.id);
        var catBadge = isResmi ?
            '<span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><i class="fa-solid fa-certificate text-[8px]"></i> RESMI ' +
            (p.segment ? '· SEG ' + p.segment : '') + '</span>' :
            '<span class="inline-flex items-center gap-1 text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200"><i class="fa-solid fa-fire-flame-curved text-[8px]"></i> R2 · ' +
            getR2Tier(p.price).toUpperCase() + '</span>';
        return '<div class="product-table-row' + (isResmi ? ' is-resmi' : '') + '" style="animation-delay:' + (idx * 25) +
            'ms" data-pid="' + p.id + '">' +
            '<div class="flex items-center gap-3 min-w-0"><div class="pt-icon"><i class="fa-solid fa-' + (isResmi ?
                'certificate' : 'fire-flame-curved') + '"></i></div><div class="min-w-0"><div class="pt-name truncate">' +
            escapeHtml(p.name) + '</div><div class="mt-1">' + catBadge + '</div></div></div>' +
            '<div class="pt-price">' + formatRupiah(p.price) + '</div>' +
            '<div class="text-[11px] font-bold text-slate-500 hidden md:block">' + p.id.toUpperCase() + '</div>' +
            '<div class="pt-actions flex items-center justify-end gap-2">' +
            '<button onclick="toggleWishlistItem(\'' + p.id + '\', event)" class="wishlist-heart-btn' + (wl ? ' is-active' :
                '') + '" aria-label="Wishlist"><i class="fa-' + (wl ? 'solid' : 'regular') +
            ' fa-heart text-xs"></i></button>' +
            buildCardActions(p).replace('mt-4', '').replace('w-full', 'w-auto') +
            '</div></div>';
    }

    function renderProductDisplay() {
        var processed = getProcessedProducts();
        var tp = Math.ceil(processed.length / itemsPerPage) || 1;
        if (currentPage > tp) currentPage = tp;
        var pp = processed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        var gridEl = document.getElementById('productGrid');
        var tableWrap = document.getElementById('productTableWrap');
        var tableBody = document.getElementById('productTableBody');
        var noProduct = document.getElementById('noProductFound');

        if (!pp.length) {
            if (gridEl) gridEl.innerHTML = '';
            if (tableBody) tableBody.innerHTML = '';
            if (noProduct) noProduct.classList.remove('hidden');
            renderPagination(tp);
            return;
        }
        if (noProduct) noProduct.classList.add('hidden');

        if (viewMode === 'table') {
            if (gridEl) gridEl.classList.add('hidden');
            if (tableWrap) tableWrap.classList.remove('hidden');
            if (tableBody) tableBody.innerHTML = pp.map(function(p, idx) { return buildProductRowHTML(p, idx); }).join('');
        } else {
            if (tableWrap) tableWrap.classList.add('hidden');
            if (gridEl) { gridEl.classList.remove('hidden');
                gridEl.innerHTML = pp.map(function(p, idx) { return buildProductCardHTML(p, idx); }).join(''); }
            if (gridEl) {
                gridEl.querySelectorAll('.card-glow').forEach(function(c) {
                    c.addEventListener('mousemove', function(e) {
                        var rect = c.getBoundingClientRect();
                        c.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
                        c.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
                    });
                });
            }
        }
        renderPagination(tp);
        updateActiveFilterIndicator();
    }

    function updateActiveFilterIndicator() {
        var indicator = document.getElementById('activeFilterIndicator');
        var text = document.getElementById('activeFilterText');
        if (!indicator || !text) return;
        if (activeFilter === 'all') { indicator.classList.add('hidden'); return; }
        indicator.classList.remove('hidden');
        var labels = {
            hemat: 'Hemat (≤ Rp 76.000)',
            populer: 'Populer (Rp 77.000 - 89.000)',
            premium: 'Premium (≥ Rp 90.000)',
            segA: 'Segmen A — Kretek Filter Premium',
            segB: 'Segmen B — Kretek Filter Reguler',
            segC: 'Segmen C — Mild/ Rendah Tar',
            segD: 'Segmen D — SPM Internasional',
            segE: 'Segmen E — Kretek Tangan/ Legacy'
        };
        text.textContent = 'Filter: ' + (labels[activeFilter] || activeFilter);
    }

    function renderPagination(tp) {
        var c = document.getElementById('paginationContainer');
        if (!c) return;
        if (tp <= 1) { c.innerHTML = ''; return; }
        var h = '';
        for (var i = 1; i <= tp; i++) {
            h += '<button onclick="window.__goToPage(' + i +
                ')" class="w-10 h-10 rounded-xl text-sm font-bold transition-all ' + (i === currentPage ?
                    'bg-brand-900 text-white shadow-md' :
                    'bg-white dark:bg-transparent border border-slate-200 text-slate-600 hover:border-brand-400') +
                '">' + i + '</button>';
        }
        c.innerHTML = h;
    }

    window.__goToPage = function(p) {
        currentPage = p;
        renderProductDisplay();
        var target = document.getElementById('produk');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.applyFilter = function(f) {
        activeFilter = f;
        currentPage = 1;
        document.querySelectorAll('.filter-chip').forEach(function(c) {
            if (c.classList.contains('filter-chip-resmi')) {
                c.classList.remove('filter-chip-resmi', 'segment-active');
                c.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
            } else {
                c.classList.remove('bg-brand-900', 'text-white', 'shadow-md');
                c.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
            }
        });
        var active = document.getElementById('chip-' + f);
        if (active) {
            if (active.classList.contains('filter-chip-resmi') || f.indexOf('seg') === 0) {
                active.classList.add('segment-active');
                active.classList.remove('bg-white', 'text-slate-600');
            } else {
                active.classList.add('bg-brand-900', 'text-white', 'shadow-md');
                active.classList.remove('bg-white', 'text-slate-600');
            }
        }
        renderProductDisplay();
    };

    window.applySort = function(s) {
        activeSort = s;
        currentPage = 1;
        renderProductDisplay();
    };

    // ============================================
    // 5. MODE TAMPILAN
    // ============================================
    window.setViewMode = function(mode) {
        if (mode !== 'grid' && mode !== 'table') return;
        viewMode = mode;
        var btnGrid = document.getElementById('viewModeGridBtn');
        var btnTable = document.getElementById('viewModeTableBtn');
        if (btnGrid) btnGrid.classList.toggle('active', mode === 'grid');
        if (btnTable) btnTable.classList.toggle('active', mode === 'table');
        renderProductDisplay();
    };

    // ============================================
    // 6. WISHLIST
    // ============================================
    window.toggleWishlistItem = function(id, event) {
        if (event) event.stopPropagation();
        var index = wishlist.indexOf(id);
        if (index > -1) { wishlist.splice(index, 1);
            showToast('Dihapus dari Wishlist', 'info'); } else { wishlist.push(id);
            showToast('Ditambahkan ke Wishlist', 'success'); }
        saveWishlist();
        updateWishlistUI();
        renderProductDisplay();
    };

    function updateWishlistUI() {
        var badge = document.getElementById('wishlistBadge');
        if (badge) { badge.innerText = wishlist.length;
            badge.classList.toggle('scale-0', wishlist.length === 0); }
        var bottomBadge = document.getElementById('bottomWishlistBadge');
        if (bottomBadge) { bottomBadge.innerText = wishlist.length;
            bottomBadge.classList.toggle('scale-0', wishlist.length === 0); }
        var container = document.getElementById('wishlistItemsContainer');
        if (!container) return;
        if (wishlist.length === 0) {
            container.innerHTML =
                '<div class="h-full flex flex-col items-center justify-center text-center opacity-50"><i class="fa-regular fa-heart text-6xl text-slate-300 mb-4"></i><p class="font-bold text-slate-600 dark:text-slate-400">Wishlist Kosong</p></div>';
            return;
        }
        container.innerHTML = wishlist.map(function(id) {
            var p = allProducts.find(function(x) { return x.id === id; });
            if (!p) return '';
            return '<div class="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">' +
                '<div class="flex-1 min-w-0"><div class="font-bold text-sm text-brand-900 dark:text-white truncate">' +
                escapeHtml(p.name) + '</div><div class="text-brand-500 font-mono text-xs font-bold">' + formatRupiah(
                    p.price) + '</div></div>' +
                '<button onclick="window.__addCart(\'' + p.id + '\'); toggleWishlistItem(\'' + p.id +
                '\');" class="w-8 h-8 rounded-lg bg-brand-900 text-white flex items-center justify-center hover:bg-brand-700 transition-colors" title="Pindah ke Keranjang"><i class="fa-solid fa-cart-plus text-xs"></i></button>' +
                '<button onclick="toggleWishlistItem(\'' + p.id +
                '\')" class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><i class="fa-solid fa-trash text-xs"></i></button>' +
                '</div>';
        }).join('');
    }

    window.toggleWishlistSidebar = function() {
        var overlay = document.getElementById('wishlistOverlay');
        var sidebar = document.getElementById('wishlistSidebar');
        if (!overlay || !sidebar) return;
        if (sidebar.classList.contains('translate-x-full')) {
            overlay.classList.remove('hidden');
            setTimeout(function() { overlay.classList.remove('opacity-0'); }, 10);
            sidebar.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.add('opacity-0');
            sidebar.classList.add('translate-x-full');
            setTimeout(function() { overlay.classList.add('hidden'); }, 300);
            document.body.style.overflow = '';
        }
    };

    // ============================================
    // 7. QUICK VIEW
    // ============================================
    window.openQuickView = function(id) {
        var p = allProducts.find(function(x) { return x.id === id; });
        if (!p) return;
        var titleEl = document.getElementById('qvTitle');
        var priceEl = document.getElementById('qvPrice');
        var badge = document.getElementById('qvBadge');
        var idEl = document.getElementById('qvId');
        var descEl = document.getElementById('qvDesc');
        if (titleEl) titleEl.textContent = p.name;
        if (priceEl) priceEl.textContent = formatRupiah(p.price);
        if (idEl) idEl.textContent = p.id.toUpperCase();
        if (descEl) descEl.textContent = p.category === 'resmi' ? (p.segmentName || '') :
            'Katalog R2 Nusantara — harga kompetitif untuk margin maksimal.';
        if (badge) {
            if (p.category === 'resmi') {
                badge.className = 'inline-block px-3 py-1 rounded-lg text-xs font-bold segment-badge segment-' + p.segment;
                badge.innerHTML = '<i class="fa-solid fa-certificate mr-1"></i> RESMI · SEG ' + p.segment;
            } else {
                var tier = getR2Tier(p.price);
                badge.className = 'inline-block px-3 py-1 rounded-lg text-xs font-bold segment-badge tier-' + tier;
                badge.innerHTML = '<i class="fa-solid fa-fire mr-1"></i> ' + tier.toUpperCase();
            }
        }
        var addBtn = document.getElementById('qvAddToCartBtn');
        if (addBtn) addBtn.onclick = function() { window.__addCart(p.id);
            closeQuickView(); };
        var wlBtn = document.getElementById('qvWishlistBtn');
        if (wlBtn) {
            var wl = isWishlisted(p.id);
            wlBtn.classList.toggle('is-active', wl);
            wlBtn.innerHTML = '<i class="fa-' + (wl ? 'solid' : 'regular') + ' fa-heart"></i>';
            wlBtn.onclick = function() { toggleWishlistItem(p.id);
                wlBtn.classList.toggle('is-active');
                var nowWl = isWishlisted(p.id);
                wlBtn.innerHTML = '<i class="fa-' + (nowWl ? 'solid' : 'regular') + ' fa-heart"></i>'; };
        }
        var overlay = document.getElementById('quickViewOverlay');
        var modal = document.getElementById('quickViewModal');
        if (overlay) { overlay.classList.remove('hidden');
            setTimeout(function() { overlay.classList.add('overlay-enter'); }, 10); }
        if (modal) setTimeout(function() { modal.classList.add('modal-enter'); }, 10);
        document.body.style.overflow = 'hidden';
    };

    window.closeQuickView = function() {
        var overlay = document.getElementById('quickViewOverlay');
        var modal = document.getElementById('quickViewModal');
        if (overlay) overlay.classList.remove('overlay-enter');
        if (modal) modal.classList.remove('modal-enter');
        setTimeout(function() { if (overlay) overlay.classList.add('hidden'); }, 300);
        document.body.style.overflow = '';
    };

    // ============================================
    // 8. LIVE VISITOR COUNTER
    // ============================================
    function initVisitorCounter() {
        var el = document.getElementById('visitorCount');
        if (!el) return;
        var count = Math.floor(Math.random() * (45 - 18 + 1)) + 18;
        el.textContent = count;
        setInterval(function() {
            var change = Math.floor(Math.random() * 5) - 2;
            count = Math.max(15, Math.min(60, count + change));
            el.textContent = count;
        }, 4000);
    }

    // ============================================
    // 9. KERANJANG
    // ============================================
    window.__addCart = function(id) {
        var p = allProducts.find(function(x) { return x.id === id; });
        if (!p) return;
        var existing = cart.find(function(x) { return x.id === id; });
        if (existing) existing.qty += 1;
        else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, category: p.category });
        saveCart();
        updateCartUI();
        showToast("Berhasil ditambahkan");
        dispatchCartEvent();
    };

    window.__updateQty = function(id, ch) {
        var i = cart.find(function(x) { return x.id === id; });
        if (i) {
            i.qty += ch;
            if (i.qty < 1) cart = cart.filter(function(x) { return x.id !== id; });
        }
        window.__cart = cart;
        saveCart();
        updateCartUI();
        dispatchCartEvent();
    };

    function dispatchCartEvent() { window.dispatchEvent(new CustomEvent('r2:cartUpdated')); }

    function updateCartUI() {
        var t = cart.reduce(function(s, i) { return s + i.qty; }, 0);
        var tp = cart.reduce(function(s, i) { return s + (i.price * i.qty); }, 0);
        var badge = document.getElementById('cartBadge');
        if (badge) { badge.innerText = t;
            badge.classList.toggle('scale-0', t === 0); }
        var bottomBadge = document.getElementById('bottomCartBadge');
        if (bottomBadge) { bottomBadge.innerText = t;
            bottomBadge.classList.toggle('scale-0', t === 0); }

        var bannerQty = document.getElementById('bannerQty');
        var progressFill = document.getElementById('progressFill');
        var bannerTitle = document.getElementById('bannerTitle');
        var bannerSubtitle = document.getElementById('bannerSubtitle');
        var banner = document.getElementById('shippingProgressBanner');
        if (bannerQty) bannerQty.innerText = t;
        if (progressFill) progressFill.style.width = Math.min((t / 20) * 100, 100) + '%';
        if (t >= 20) {
            if (bannerTitle) bannerTitle.innerText = '🎉 Target Tercapai';
            if (bannerSubtitle) bannerSubtitle.innerHTML =
                'Anda mendapat <b class="text-emerald-300">GRATIS ONGKIR</b>';
            if (banner) { banner.classList.add('bg-emerald-600');
                banner.classList.remove('bg-brand-900'); }
        } else {
            if (bannerTitle) bannerTitle.innerText = 'Target Gratis Ongkir';
            if (bannerSubtitle) bannerSubtitle.innerHTML = 'Pilih <b class="text-emerald-300">' + (20 - t) +
                ' slop</b> lagi untuk subsidi.';
            if (banner) { banner.classList.remove('bg-emerald-600');
                banner.classList.add('bg-brand-900'); }
        }

        var cc = document.getElementById('cartItemsContainer');
        var cs = document.getElementById('cartSummary');
        if (!cart.length) {
            if (cc) cc.innerHTML =
                '<div class="h-full flex flex-col items-center justify-center text-center opacity-50"><i class="fa-solid fa-cart-shopping text-6xl text-slate-300 mb-4"></i><p class="font-bold text-slate-600 dark:text-slate-400">Keranjang Kosong</p></div>';
            if (cs) cs.classList.add('hidden');
        } else {
            if (cs) cs.classList.remove('hidden');
            var totalItemsDisplay = document.getElementById('totalItemsDisplay');
            var totalPriceDisplay = document.getElementById('totalPriceDisplay');
            if (totalItemsDisplay) totalItemsDisplay.innerText = t;
            if (totalPriceDisplay) totalPriceDisplay.innerText = formatRupiah(tp);
            if (cc) {
                cc.innerHTML = cart.map(function(i) {
                    var catBadge = i.category === 'resmi' ?
                        '<span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"><i class="fa-solid fa-certificate text-[8px]"></i> RESMI</span>' :
                        '<span class="inline-flex items-center gap-1 text-[9px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200"><i class="fa-solid fa-fire-flame-curved text-[8px]"></i> R2</span>';
                    return '<div class="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm flex gap-4"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="font-bold text-sm text-brand-900 dark:text-white truncate">' +
                        escapeHtml(i.name) + '</span>' + catBadge +
                        '</div><div class="text-brand-500 font-bold font-mono text-sm">' + formatRupiah(i.price) +
                        '</div></div><div class="flex items-center border border-slate-200 dark:border-white/10 rounded-lg h-9 shrink-0"><button onclick="window.__updateQty(\'' +
                        i.id +
                        '\',-1)" class="w-9 h-full font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">-</button><span class="w-8 text-center text-xs font-bold font-mono">' +
                        i.qty +
                        '</span><button onclick="window.__updateQty(\'' + i.id +
                        '\',1)" class="w-9 h-full font-bold text-brand-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">+</button></div></div>';
                }).join('');
            }
        }
        var modalPriceDisplay = document.getElementById('modalTotalPrice');
        if (modalPriceDisplay) modalPriceDisplay.innerText = formatRupiah(tp);
        renderProductDisplay();
    }

    window.toggleCart = function() {
        var o = document.getElementById('cartOverlay');
        var s = document.getElementById('cartSidebar');
        if (!o || !s) return;
        if (s.classList.contains('translate-x-full')) {
            o.classList.remove('hidden');
            setTimeout(function() { o.classList.remove('opacity-0'); }, 10);
            s.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden';
        } else {
            o.classList.add('opacity-0');
            s.classList.add('translate-x-full');
            setTimeout(function() { o.classList.add('hidden'); }, 300);
            document.body.style.overflow = '';
        }
    };

    // ============================================
    // 10. CHECKOUT
    // ============================================
    window.openCheckoutModal = function() {
        toggleCart();
        setTimeout(function() {
            var o = document.getElementById('checkoutModalOverlay');
            var m = document.getElementById('checkoutModal');
            if (o) o.classList.add('overlay-enter');
            if (m) m.classList.add('modal-enter');
            document.body.style.overflow = 'hidden';
            updateProgressStep(1);
            setTimeout(function() {
                var n = document.getElementById('newCustName');
                if (n) n.focus();
                validateCheckoutForm();
            }, 300);
        }, 300);
    };

    window.closeCheckoutModal = function() {
        var o = document.getElementById('checkoutModalOverlay');
        var m = document.getElementById('checkoutModal');
        if (o) o.classList.remove('overlay-enter');
        if (m) m.classList.remove('modal-enter');
        document.body.style.overflow = '';
    };

    function updateProgressStep(stepNum) {
        var indicators = [document.getElementById('step1Indicator'), document.getElementById('step2Indicator'),
            document.getElementById('step3Indicator')
        ];
        var line = document.getElementById('stepProgressLine');
        indicators.forEach(function(ind, idx) {
            if (!ind) return;
            var numCircle = ind.querySelector('div');
            var textSpan = ind.querySelector('span');
            numCircle.className =
                "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 border-2 border-white ring-2 ring-slate-100 step-indicator" +
                (idx + 1 === stepNum ? " active shadow-sm" : (idx + 1 < stepNum ?
                    " completed shadow-sm" : " bg-slate-100 text-slate-400"));
            textSpan.className = "text-[9px] font-bold uppercase tracking-widest" + (idx + 1 === stepNum ?
                " text-brand-900 dark:text-white" : (idx + 1 < stepNum ? " text-emerald-500" :
                " text-slate-400"));
        });
        var widthPercentage = stepNum === 1 ? 0 : stepNum === 2 ? 50 : 100;
        if (line) line.style.width = widthPercentage + "%";
    }

    function showError(fieldId, errorId, message) {
        var f = document.getElementById(fieldId);
        var e = document.getElementById(errorId);
        if (f) { f.classList.add('form-field-error');
            f.classList.remove('field-valid'); }
        if (e) {
            if (message) { var s = e.querySelector('span'); if (s) s.textContent = message; }
            e.classList.add('show');
        }
    }

    function clearError(fieldId, errorId) {
        var f = document.getElementById(fieldId);
        var e = document.getElementById(errorId);
        if (f) { f.classList.remove('form-field-error');
            f.classList.add('field-valid'); }
        if (e) e.classList.remove('show');
    }

    function validateCheckoutForm() {
        var isValid = true;
        var name = document.getElementById('newCustName');
        if (name && name.value.trim().length >= 2) { clearError('newCustName', 'newErrName'); } else { if (name && name
                .value.trim().length > 0) showError('newCustName', 'newErrName', 'Minimal 2 karakter');
            isValid = false; }

        var phone = document.getElementById('newCustPhone');
        var phoneClean = phone ? phone.value.replace(/\D/g, '') : '';
        if (phoneClean && /^8[1-9]\d{6,11}$/.test(phoneClean)) { clearError('newCustPhone', 'newErrPhone'); } else { if (
                phoneClean) showError('newCustPhone', 'newErrPhone', 'Nomor tidak valid');
            isValid = false; }

        var alamat = document.getElementById('newAlamat');
        if (alamat && alamat.value.trim().length >= 20) { clearError('newAlamat', 'newErrAlamat'); } else { if (alamat &&
                alamat.value.trim().length > 0) showError('newAlamat', 'newErrAlamat', 'Minimal 20 karakter');
            isValid = false; }

        var reqFields = ['newProvinsi', 'newKota', 'newKecamatan', 'newKelurahan', 'newKodePos', 'newEkspedisi',
            'newMetode', 'newAdmin'
        ];
        reqFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el || !el.value.trim()) isValid = false;
        });

        var btn = document.getElementById('finalCheckoutBtn');
        if (btn) { if (isValid) btn.removeAttribute('disabled');
            else btn.setAttribute('disabled', 'true'); }
        return isValid;
    }

    window.submitOrder = function() {
        if (!validateCheckoutForm()) { showToast('Lengkapi formulir dengan benar', 'error'); return; }
        var fName = document.getElementById('newCustName');
        var fPhone = document.getElementById('newCustPhone');
        var fProvinsi = document.getElementById('newProvinsi');
        var fKota = document.getElementById('newKota');
        var fKec = document.getElementById('newKecamatan');
        var fKel = document.getElementById('newKelurahan');
        var fPos = document.getElementById('newKodePos');
        var fAlamat = document.getElementById('newAlamat');
        var fPatokan = document.getElementById('newPatokan');
        var fEkspedisi = document.getElementById('newEkspedisi');
        var fMetode = document.getElementById('newMetode');
        var fAdmin = document.getElementById('newAdmin');
        var btn = document.getElementById('finalCheckoutBtn');
        var btnText = document.getElementById('finalBtnText');
        var btnIcon = document.getElementById('finalBtnIcon');

        btn.classList.add('checkout-btn-loading');
        btnText.textContent = 'Memproses...';
        btnIcon.style.display = 'none';

        setTimeout(function() {
            btn.classList.remove('checkout-btn-loading');
            btn.classList.add('checkout-success');
            btnText.textContent = 'Membuka WhatsApp...';
            btnIcon.className = 'fa-solid fa-check text-lg';
            btnIcon.style.display = '';

            var waNumber = fAdmin.value;
            var total = cart.reduce(function(s, i) { return s + i.qty; }, 0);
            var r2Items = cart.filter(function(i) { return i.category === 'r2'; });
            var resmiItems = cart.filter(function(i) { return i.category === 'resmi'; });
            var fullAddress = fAlamat.value.trim() + ' (Patokan: ' + (fPatokan.value.trim() || '-') + ')\n' +
                'Kel: ' + fKel.value.trim() + ', Kec: ' + fKec.value.trim() + '\n' +
                fKota.value.trim() + ', ' + fProvinsi.value.trim() + ' - ' + fPos.value.trim();

            var m = '📝 *ORDER R2 NUSANTARA (ENTERPRISE)*\n\n';
            m += '👤 *Nama:* ' + fName.value.trim() + '\n';
            m += '📱 *No. HP:* +62 ' + fPhone.value.trim() + '\n';
            m += '📍 *Alamat Pengiriman:*\n' + fullAddress + '\n\n';
            m += '🚚 *Ekspedisi:* ' + fEkspedisi.value + '\n';
            m += '💳 *Pembayaran:* ' + fMetode.value + '\n\n';
            if (r2Items.length > 0) {
                m += '*🔥 KATALOG R2:*\n';
                r2Items.forEach(function(i) { m += '• ' + i.name + ' — ' + i.qty + ' slop\n'; });
                m += '\n';
            }
            if (resmiItems.length > 0) {
                m += '*🏅 KATALOG RESMI:*\n';
                resmiItems.forEach(function(i) { m += '• ' + i.name + ' — ' + i.qty + ' slop\n'; });
                m += '\n';
            }
            m += '*Total Order:* ' + total + ' Slop\n';
            m += '*Status Ongkir:* ' + (total >= 20 ? '✅ Gratis Ongkir' : 'Reguler');

            setTimeout(function() {
                window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(m), '_blank');
                cart = [];
                window.__cart = cart;
                saveCart();
                updateCartUI();
                closeCheckoutModal();
                document.getElementById('checkoutFormFull').reset();
                btn.classList.remove('checkout-success');
                btnText.textContent = 'Konfirmasi Pesanan';
                btnIcon.className = 'fa-brands fa-whatsapp text-lg';
                validateCheckoutForm();
                showToast('Pesanan berhasil dilanjutkan! 🎉');
            }, 800);
        }, 1500);
    };

    // ============================================
    // 11. REVIEW MODAL
    // ============================================
    window.openReviewModal = function() {
        var o = document.getElementById('reviewModalOverlay');
        var m = document.getElementById('reviewModal');
        if (o) o.classList.add('overlay-enter');
        if (m) m.classList.add('modal-enter');
        document.body.style.overflow = 'hidden';
    };
    window.closeReviewModal = function() {
        var o = document.getElementById('reviewModalOverlay');
        var m = document.getElementById('reviewModal');
        if (o) o.classList.remove('overlay-enter');
        if (m) m.classList.remove('modal-enter');
        document.body.style.overflow = '';
        setTimeout(function() {
            var f = document.getElementById('reviewForm');
            if (f) f.reset();
            setRating(5);
        }, 300);
    };
    window.setRating = function(val) {
        var ratingInput = document.getElementById('reviewRating');
        if (ratingInput) ratingInput.value = val;
        var stars = document.querySelectorAll('#starRatingSelector i');
        stars.forEach(function(s) {
            if (parseInt(s.getAttribute('data-rating')) <= val) { s.classList.add('text-amber-400');
                s.classList.remove('text-slate-200'); } else { s.classList.remove('text-amber-400');
                s.classList.add('text-slate-200'); }
        });
    };
    window.submitReview = function() {
        var btn = document.getElementById('submitReviewBtn');
        var name = document.getElementById('reviewName').value;
        var store = document.getElementById('reviewStore').value;
        var text = document.getElementById('reviewText').value;
        var rating = document.getElementById('reviewRating').value;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
        btn.classList.add('opacity-80', 'pointer-events-none');
        setTimeout(function() {
            var starsHtml = '';
            for (var i = 0; i < 5; i++) starsHtml += i < rating ?
                '<i class="fa-solid fa-star"></i>' :
                '<i class="fa-solid fa-star text-slate-200"></i>';
            var initial = name.charAt(0).toUpperCase();
            var newCard = document.createElement('div');
            newCard.className =
                'testimonial-card-slide bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-sm relative flex flex-col justify-between';
            newCard.innerHTML = '<div><div class="flex items-center gap-4 mb-5"><div class="w-14 h-14 rounded-full avatar-gradient-9 shrink-0"><span class="avatar-initial">' +
                initial +
                '</span></div><div><h4 class="font-extrabold text-brand-900 dark:text-white text-base">' +
                escapeHtml(name) +
                '</h4><p class="text-xs text-slate-500 font-medium">' + escapeHtml(store) +
                '</p></div></div><div class="flex gap-0.5 mb-4 text-amber-400 text-sm">' +
                starsHtml +
                '</div><p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">"' +
                escapeHtml(text) + '"</p></div><div class="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-400"><span><i class="fa-solid fa-calendar-days mr-1"></i> Baru saja</span><span class="text-slate-400 font-bold"><i class="fa-solid fa-clock"></i> Pending Review</span></div>';
            var slider = document.getElementById('testimonialSlider');
            if (slider) { slider.insertBefore(newCard, slider.firstChild);
                slider.scrollTo({ left: 0, behavior: 'smooth' }); }
            showToast('Terima kasih! Ulasan Anda berhasil dikirim.');
            closeReviewModal();
            btn.innerHTML = 'Kirim Ulasan';
            btn.classList.remove('opacity-80', 'pointer-events-none');
        }, 1000);
    };

    // ============================================
    // 12. SCROLL PROGRESS
    // ============================================
    function updateScrollProgress() {
        var scrollProgress = document.getElementById('scrollProgress');
        var progressCircle = document.getElementById('progressCircle');
        var scrollPercent = document.getElementById('scrollPercent');
        if (!scrollProgress || !progressCircle || !scrollPercent) return;
        var scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var percent = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
        var circumference = 263.89;
        var offset = circumference - (percent / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
        scrollPercent.textContent = Math.round(percent) + '%';
        if (scrollTop > 300) { scrollProgress.classList.add('visible'); } else { scrollProgress.classList.remove(
                'visible'); }
    }

    // ============================================
    // 13. INISIALISASI
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        var loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(function() { loader.style.display = 'none'; }, 700);
        }

        var darkIcon = document.getElementById('darkModeIcon');
        if (darkIcon) darkIcon.className = document.documentElement.classList.contains('dark') ?
            'fa-solid fa-sun text-[13px] sm:text-sm' :
            'fa-solid fa-moon text-[13px] sm:text-sm';

        initVisitorCounter();
        updateWishlistUI();
        buildFilterChips();
        updateCatalogInfoBanner();
        renderProductDisplay();
        updateCartUI();

        var countR2 = document.getElementById('countR2');
        var countResmi = document.getElementById('countResmi');
        var totalCount = document.getElementById('totalBrandCount');
        if (countR2) countR2.textContent = productsR2.length;
        if (countResmi) countResmi.textContent = productsResmi.length;
        if (totalCount) totalCount.textContent = allProducts.length;

        var obs = new IntersectionObserver(function(entries) {
            entries.forEach(function(en) { if (en.isIntersecting) en.target.classList.add('is-visible'); });
        }, { threshold: 0.1 });
        document.querySelectorAll('.fade-on-scroll').forEach(function(el) { obs.observe(el); });

        // Scroll handlers
        window.addEventListener('scroll', function() {
            var h = document.getElementById('headerInner');
            var btt = document.getElementById('backToTop');
            if (h) {
                if (window.scrollY > 50) { h.classList.add('py-2', 'shadow-lg');
                    h.classList.remove('py-3'); } else { h.classList.add('py-3');
                    h.classList.remove('py-2', 'shadow-lg'); }
            }
            if (btt) { if (window.scrollY > 500) btt.classList.add('visible');
                else btt.classList.remove('visible'); }
            updateScrollProgress();
        });
        updateScrollProgress();

        // Search autocomplete
        var searchInput = document.getElementById('searchInput');
        var suggestionsBox = document.getElementById('searchSuggestions');
        if (searchInput) {
            var searchTimer;
            searchInput.addEventListener('input', function(e) {
                clearTimeout(searchTimer);
                var query = e.target.value.toLowerCase().trim();
                searchTimer = setTimeout(function() {
                    searchTerm = query;
                    currentPage = 1;
                    renderProductDisplay();
                    if (!suggestionsBox) return;
                    if (query.length < 2) { suggestionsBox.classList.add('hidden'); return; }
                    var matches = allProducts.filter(function(p) { return p.name.toLowerCase().indexOf(
                            query) !== -1; }).slice(0, 6);
                    if (matches.length > 0) {
                        suggestionsBox.innerHTML = matches.map(function(p) {
                            var safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            var highlighted = p.name.replace(new RegExp(safeQuery, 'gi'),
                                function(match) {
                                    return '<span class="text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/40 px-0.5 rounded">' +
                                        match + '</span>';
                                });
                            return '<div class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-b border-slate-100 dark:border-white/10 last:border-0 flex items-center gap-3 transition-colors" data-suggest-id="' +
                                p.id + '">' +
                                '<i class="fa-solid fa-magnifying-glass text-slate-400 text-xs"></i>' +
                                '<div><div class="text-sm font-bold text-brand-900 dark:text-white">' +
                                highlighted +
                                '</div><div class="text-xs text-slate-500 font-mono">' +
                                formatRupiah(p.price) + '</div></div></div>';
                        }).join('');
                        suggestionsBox.classList.remove('hidden');
                    } else {
                        suggestionsBox.classList.add('hidden');
                    }
                }, 220);
            });
            if (suggestionsBox) {
                suggestionsBox.addEventListener('click', function(e) {
                    var row = e.target.closest('[data-suggest-id]');
                    if (!row) return;
                    var p = allProducts.find(function(x) { return x.id === row.getAttribute(
                            'data-suggest-id'); });
                    if (p) {
                        searchInput.value = p.name;
                        searchTerm = p.name.toLowerCase();
                        if (p.category !== activeCatalog) window.switchCatalog(p.category);
                        currentPage = 1;
                        renderProductDisplay();
                    }
                    suggestionsBox.classList.add('hidden');
                });
                document.addEventListener('click', function(e) {
                    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target))
                        suggestionsBox.classList.add('hidden');
                });
            }
        }

        // Checkout form
        var formInputs = document.querySelectorAll('#checkoutFormFull input, #checkoutFormFull textarea, #checkoutFormFull select');
        formInputs.forEach(function(input, index) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') { e.preventDefault(); if (
                        index < formInputs.length - 1) formInputs[index + 1].focus(); }
            });
            input.addEventListener('focus', function() {
                var stepGroup = input.closest('[data-step]');
                if (stepGroup) updateProgressStep(parseInt(stepGroup.getAttribute('data-step')));
            });
            input.addEventListener('input', validateCheckoutForm);
            input.addEventListener('change', validateCheckoutForm);
            input.addEventListener('blur', validateCheckoutForm);
        });

        var phoneInput = document.getElementById('newCustPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                var v = e.target.value.replace(/\D/g, '');
                if (v.startsWith('62')) v = v.substring(2);
                if (v.startsWith('0')) v = v.substring(1);
                var match = v.match(/(\d{0,3})(\d{0,4})(\d{0,5})/);
                if (match) {
                    var formatted = !match[2] ? match[1] : match[1] + ' ' + match[2] + (match[3] ? ' ' +
                        match[3] : '');
                    e.target.value = formatted.substring(0, 15);
                } else { e.target.value = v; }
            });
        }

        document.addEventListener('keydown', function(e) {
            var m = document.getElementById('checkoutModal');
            var r = document.getElementById('reviewModal');
            var q = document.getElementById('quickViewModal');
            if (e.key !== 'Escape') return;
            if (m && m.classList.contains('modal-enter')) closeCheckoutModal();
            if (r && r.classList.contains('modal-enter')) closeReviewModal();
            if (q && q.classList.contains('modal-enter')) closeQuickView();
        });

        // Testimonial slider
        var slider = document.getElementById('testimonialSlider');
        var prevBtn = document.getElementById('sliderPrevBtn');
        var nextBtn = document.getElementById('sliderNextBtn');
        if (slider && prevBtn && nextBtn) {
            var isDown = false,
                startX, scrollLeft;
            slider.addEventListener('mousedown', function(e) { isDown = true;
                slider.style.scrollSnapType = 'none';
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft; });
            slider.addEventListener('mouseleave', function() { isDown = false;
                slider.style.scrollSnapType = 'x mandatory'; });
            slider.addEventListener('mouseup', function() { isDown = false;
                slider.style.scrollSnapType = 'x mandatory'; });
            slider.addEventListener('mousemove', function(e) {
                if (!isDown) return;
                e.preventDefault();
                var x = e.pageX - slider.offsetLeft;
                var walk = (x - startX) * 2;
                slider.scrollLeft = scrollLeft - walk;
            });

            function getScrollAmount() { var card = slider.querySelector(
                '.testimonial-card-slide'); return card ? card.offsetWidth + 24 : 350; }
            nextBtn.addEventListener('click', function() { slider.scrollBy({ left: getScrollAmount(),
                    behavior: 'smooth' }); });
            prevBtn.addEventListener('click', function() { slider.scrollBy({ left: -getScrollAmount(),
                    behavior: 'smooth' }); });
            var autoSlide = setInterval(function() {
                if (!isDown) {
                    if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) slider.scrollTo(
                        { left: 0, behavior: 'smooth' });
                    else slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
                }
            }, 4000);
            slider.addEventListener('mouseenter', function() { clearInterval(autoSlide); });
        }

        validateCheckoutForm();
    });
})();