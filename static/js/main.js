document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseNotes = [];
    let filteredNotes = [];
    let currentFilter = 'all';
    let searchQuery = '';
    let selectedNoteForTweet = null;

    // DOM Elements
    const notesGrid = document.getElementById('notes-grid');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const btnRefresh = document.getElementById('btn-refresh');
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const statsInfo = document.getElementById('stats-info');
    const lastUpdatedSpan = document.getElementById('last-updated');
    
    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const btnCancelTweet = document.getElementById('btn-cancel-tweet');
    const btnConfirmTweet = document.getElementById('btn-confirm-tweet');
    const btnCloseModal = document.getElementById('btn-close-modal');
    
    // Toast elements
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Icons
    const sunIcon = `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24"><path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8.2-9.8.6-.1 1.2.3 1.3.9.1.6-.3 1.2-.9 1.3-3.5.7-6 3.8-6 7.6 0 4.4 3.6 8 8 8 3.8 0 6.9-2.5 7.6-6 .1-.6.7-1 1.3-.9.6.1 1 .7.9 1.3-.9 4.7-5 8.2-9.8 8.2z"/></svg>`;

    // Theme Management
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        btnThemeToggle.innerHTML = savedTheme === 'light' ? moonIcon : sunIcon;
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        btnThemeToggle.innerHTML = newTheme === 'light' ? moonIcon : sunIcon;
        showToast(`Switched to ${newTheme} theme`, 'success');
    };

    // Toast Notification helper
    const showToast = (message, status = 'success') => {
        toastMessage.textContent = message;
        toast.className = `toast toast-${status} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // Formatting dates nicely
    const formatTimestamp = (epochSeconds) => {
        if (!epochSeconds) return 'Never';
        const date = new Date(epochSeconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Load Release Notes from API
    const loadReleaseNotes = async (forceRefresh = false) => {
        renderSkeletons();
        btnRefresh.classList.add('spinning');
        btnRefresh.disabled = true;
        
        try {
            const url = `/api/release-notes${forceRefresh ? '?refresh=true' : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const result = await response.json();
            
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            releaseNotes = result.updates || [];
            
            // Format last updated time
            if (result.last_updated) {
                lastUpdatedSpan.textContent = formatTimestamp(result.last_updated);
            }
            
            if (result.status === 'warning') {
                showToast(result.message, 'warning');
            } else {
                showToast(forceRefresh ? 'Release notes refreshed successfully!' : 'Release notes loaded', 'success');
            }
            
            applyFiltersAndSearch();
            
        } catch (error) {
            console.error('Error loading release notes:', error);
            showToast(`Error: ${error.message || 'Failed to load feed'}`, 'error');
            renderEmptyState('Failed to Load Data', 'Please check your connection and click refresh to try again.');
        } finally {
            btnRefresh.classList.remove('spinning');
            btnRefresh.disabled = false;
        }
    };

    // Render Skeletons for Loading State
    const renderSkeletons = () => {
        notesGrid.innerHTML = Array(3).fill(0).map(() => `
            <div class="note-card skeleton-card">
                <div class="card-meta">
                    <div class="card-meta-left">
                        <div class="skeleton-line badge"></div>
                        <div class="skeleton-line" style="width: 100px; height: 16px;"></div>
                    </div>
                </div>
                <div class="skeleton-line title"></div>
                <div class="skeleton-line p1"></div>
                <div class="skeleton-line p2"></div>
                <div class="skeleton-line p3"></div>
            </div>
        `).join('');
    };

    // Render Empty State
    const renderEmptyState = (title, description) => {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
        statsInfo.textContent = 'Showing 0 updates';
    };

    // Render Cards in Grid
    const renderNotes = (notes) => {
        if (notes.length === 0) {
            renderEmptyState('No updates found', 'Try adjusting your search query or filters.');
            return;
        }
        
        notesGrid.innerHTML = notes.map((note, idx) => {
            const cardTypeClass = `type-${note.type.toLowerCase()}`;
            
            // Generate animation delay to stagger cards nicely
            const delay = Math.min(idx * 0.05, 0.8);
            
            return `
                <div class="note-card ${cardTypeClass}" style="animation-delay: ${delay}s" id="card-${note.id}">
                    <div class="card-meta">
                        <div class="card-meta-left">
                            <span class="badge">${escapeHtml(note.type)}</span>
                            <span class="date-text">${escapeHtml(note.date)}</span>
                        </div>
                    </div>
                    <div class="card-content">
                        ${note.html}
                    </div>
                    <div class="card-actions">
                        <button class="btn-tweet" data-id="${note.id}">
                            <svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Select & Tweet
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners to the Tweet buttons
        document.querySelectorAll('.btn-tweet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.currentTarget.getAttribute('data-id');
                const note = releaseNotes.find(n => n.id === noteId);
                if (note) {
                    openTweetModal(note);
                }
            });
        });

        // Add code block copy feature
        document.querySelectorAll('.card-content pre').forEach(pre => {
            setupCodeCopyButton(pre);
        });
    };

    // Escape HTML helpers to prevent XSS
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };

    // Setup Copy Code Button
    const setupCodeCopyButton = (preBlock) => {
        preBlock.style.position = 'relative';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2005/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        copyBtn.title = 'Copy code';
        
        // Style the copy button directly or add CSS classes
        Object.assign(copyBtn.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.2s, background-color 0.2s'
        });

        preBlock.appendChild(copyBtn);

        preBlock.addEventListener('mouseenter', () => copyBtn.style.opacity = '1');
        preBlock.addEventListener('mouseleave', () => copyBtn.style.opacity = '0');

        copyBtn.addEventListener('click', async () => {
            const code = preBlock.querySelector('code');
            const textToCopy = code ? code.innerText : preBlock.innerText.replace(copyBtn.innerText, '');
            try {
                await navigator.clipboard.writeText(textToCopy);
                copyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2005/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-feature)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                showToast('Code copied to clipboard!', 'success');
                setTimeout(() => {
                    copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2005/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;
                }, 2000);
            } catch (err) {
                showToast('Failed to copy code', 'error');
            }
        });
    };

    // Apply Filter and Search combined
    const applyFiltersAndSearch = () => {
        filteredNotes = releaseNotes.filter(note => {
            // Filter by Type
            const matchesFilter = currentFilter === 'all' || note.type.toLowerCase() === currentFilter.toLowerCase();
            
            // Search Query matching title (date), type, or text content
            const matchesSearch = searchQuery === '' || 
                note.date.toLowerCase().includes(searchQuery) ||
                note.type.toLowerCase().includes(searchQuery) ||
                note.text.toLowerCase().includes(searchQuery);
                
            return matchesFilter && matchesSearch;
        });
        
        renderNotes(filteredNotes);
        
        // Update stats
        const count = filteredNotes.length;
        const totalCount = releaseNotes.length;
        statsInfo.textContent = `Showing ${count} of ${totalCount} updates`;
    };

    // Prepare Default Tweet Content
    const generateDefaultTweet = (note) => {
        const prefix = `📢 BigQuery [${note.type}] (${note.date}):\n\n`;
        const suffix = `\n\n#BigQuery #GCP`;
        
        // Twitter allows 280 characters.
        const maxTextLen = 280 - prefix.length - suffix.length;
        
        let updateText = note.text;
        if (updateText.length > maxTextLen) {
            updateText = updateText.substring(0, maxTextLen - 3) + '...';
        }
        
        return `${prefix}${updateText}${suffix}`;
    };

    // Tweet Modal Logic
    const openTweetModal = (note) => {
        selectedNoteForTweet = note;
        const initialText = generateDefaultTweet(note);
        tweetTextarea.value = initialText;
        updateCharCount();
        
        tweetModal.classList.add('active');
        tweetTextarea.focus();
        
        // Set cursor to end
        tweetTextarea.selectionStart = tweetTextarea.selectionEnd = tweetTextarea.value.length;
    };

    const closeTweetModal = () => {
        tweetModal.classList.remove('active');
        selectedNoteForTweet = null;
    };

    const updateCharCount = () => {
        const currentLength = tweetTextarea.value.length;
        charCounter.textContent = `${currentLength}/280`;
        
        // Color coding based on limit
        charCounter.className = 'char-counter';
        if (currentLength > 280) {
            charCounter.classList.add('danger');
            btnConfirmTweet.disabled = true;
        } else if (currentLength > 250) {
            charCounter.classList.add('warning');
            btnConfirmTweet.disabled = false;
        } else {
            btnConfirmTweet.disabled = false;
        }
    };

    const submitTweet = () => {
        const text = tweetTextarea.value;
        if (text.length > 280) {
            showToast("Tweet exceeds 280 characters limit!", "error");
            return;
        }
        
        // Open Twitter Web Intent
        const encodedText = encodeURIComponent(text);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        
        closeTweetModal();
        showToast("Opened Twitter share window", "success");
    };

    // Event Listeners
    btnRefresh.addEventListener('click', () => {
        loadReleaseNotes(true);
    });

    btnThemeToggle.addEventListener('click', () => {
        toggleTheme();
    });

    // Filters
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.getAttribute('data-filter');
            applyFiltersAndSearch();
        });
    });

    // Search Input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchQuery = e.target.value.toLowerCase().trim();
        // Debounce search slightly for better performance
        searchTimeout = setTimeout(() => {
            applyFiltersAndSearch();
        }, 150);
    });

    // Modal close hooks
    btnCancelTweet.addEventListener('click', closeTweetModal);
    btnCloseModal.addEventListener('click', closeTweetModal);
    btnConfirmTweet.addEventListener('click', submitTweet);
    
    // Close modal when clicking outside
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Escape key listener for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('active')) {
            closeTweetModal();
        }
    });

    // Listen for inputs on the tweet textarea to count characters
    tweetTextarea.addEventListener('input', updateCharCount);

    // Initial setup
    initTheme();
    loadReleaseNotes(false);
});
