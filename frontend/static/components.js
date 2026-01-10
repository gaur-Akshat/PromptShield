// PromptShield - Web Components & Dynamic UI

// Custom Button Component
class ShieldButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['variant', 'loading', 'disabled'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const variant = this.getAttribute('variant') || 'primary';
        const loading = this.hasAttribute('loading');
        const disabled = this.hasAttribute('disabled') || loading;
        const text = this.textContent.trim();

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    width: 100%;
                }
                button {
                    width: 100%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
                    color: ${variant === 'primary' ? '#ffffff' : 'var(--text-primary, #f8fafc)'};
                    background: ${variant === 'primary' ? 'var(--accent, #6366f1)' : 'var(--bg-secondary, #1e293b)'};
                    border: 1px solid ${variant === 'primary' ? 'var(--accent, #6366f1)' : 'var(--border, rgba(255, 255, 255, 0.1))'};
                    border-radius: 0.5rem;
                    cursor: ${disabled ? 'not-allowed' : 'pointer'};
                    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    opacity: ${disabled ? '0.6' : '1'};
                }
                button:hover:not(:disabled) {
                    ${variant === 'primary' 
                        ? 'background: var(--accent-hover, #4f46e5); border-color: var(--accent-hover, #4f46e5); transform: translateY(-1px);' 
                        : 'background: var(--bg-elevated, #334155); border-color: var(--border-hover, rgba(255, 255, 255, 0.15));'
                    }
                }
                button:active:not(:disabled) {
                    transform: translateY(0);
                }
                button:focus-visible {
                    outline: 2px solid var(--accent, #6366f1);
                    outline-offset: 2px;
                }
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .text {
                    display: ${loading ? 'none' : 'inline'};
                }
            </style>
            <button ${disabled ? 'disabled' : ''}>
                <span class="text">${text}</span>
                ${loading ? '<span class="spinner"></span>' : ''}
                <slot></slot>
            </button>
        `;
    }
}

// Custom Input Component
class ShieldInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['type', 'placeholder', 'value', 'required', 'disabled', 'error'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback() {
        this.render();
    }

    setupEventListeners() {
        const input = this.shadowRoot.querySelector('input');
        if (input) {
            input.addEventListener('input', (e) => {
                this.setAttribute('value', e.target.value);
                this.dispatchEvent(new CustomEvent('input-change', {
                    detail: { value: e.target.value },
                    bubbles: true
                }));
            });
        }
    }

    render() {
        const type = this.getAttribute('type') || 'text';
        const placeholder = this.getAttribute('placeholder') || '';
        const value = this.getAttribute('value') || '';
        const required = this.hasAttribute('required');
        const disabled = this.hasAttribute('disabled');
        const error = this.hasAttribute('error');
        const label = this.getAttribute('label') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-bottom: 1.5rem;
                }
                label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-primary, #f8fafc);
                    margin-bottom: 0.5rem;
                }
                input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
                    color: var(--text-primary, #f8fafc);
                    background: var(--bg-secondary, #1e293b);
                    border: 1px solid ${error ? 'var(--error, #ef4444)' : 'var(--border, rgba(255, 255, 255, 0.1))'};
                    border-radius: 0.5rem;
                    transition: border-color 200ms, box-shadow 200ms;
                    outline: none;
                }
                input:focus {
                    border-color: var(--border-focus, #6366f1);
                    box-shadow: 0 0 0 3px var(--accent-light, rgba(99, 102, 241, 0.1));
                }
                input:disabled {
                    background: var(--bg-tertiary, #334155);
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                input::placeholder {
                    color: var(--text-tertiary, #94a3b8);
                }
                .hint {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #94a3b8);
                    margin-top: 0.5rem;
                }
                .error-message {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--error, #ef4444);
                    margin-top: 0.5rem;
                }
            </style>
            ${label ? `<label>${label}</label>` : ''}
            <input 
                type="${type}" 
                placeholder="${placeholder}" 
                value="${value}"
                ${required ? 'required' : ''}
                ${disabled ? 'disabled' : ''}
            />
            <slot name="hint"></slot>
            ${error ? `<span class="error-message">${this.getAttribute('error-message') || 'Invalid input'}</span>` : ''}
        `;
    }

    get value() {
        const input = this.shadowRoot.querySelector('input');
        return input ? input.value : '';
    }

    set value(val) {
        this.setAttribute('value', val);
        const input = this.shadowRoot.querySelector('input');
        if (input) input.value = val;
    }
}

// Custom Card Component
class ShieldCard extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['elevated', 'padding'];
    }

    connectedCallback() {
        this.updateStyles();
    }

    attributeChangedCallback() {
        this.updateStyles();
    }

    updateStyles() {
        const elevated = this.hasAttribute('elevated');
        const padding = this.getAttribute('padding') || '2.5rem';
        
        this.style.display = 'block';
        this.style.background = 'var(--bg-card, #1e293b)';
        this.style.border = '1px solid var(--border, rgba(255, 255, 255, 0.1))';
        this.style.borderRadius = '0.75rem';
        this.style.padding = padding;
        this.style.boxShadow = elevated 
            ? 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.5))' 
            : 'var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.4))';
        this.style.transition = 'box-shadow 200ms, transform 200ms';
        this.style.width = '100%';
        this.style.animation = 'fadeInUp 600ms ease-out';
    }
}

// Custom Loading Spinner Component
class ShieldSpinner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const size = this.getAttribute('size') || '16';

        this.shadowRoot.innerHTML = `
            <style>
                .spinner {
                    width: ${size}px;
                    height: ${size}px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            <div class="spinner"></div>
        `;
    }
}

// Custom Toast Notification Component
class ShieldToast extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['type', 'message', 'show'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name) {
        if (name === 'show') {
            this.render();
        }
    }

    show(message, type = 'info', duration = 3000) {
        this.setAttribute('message', message);
        this.setAttribute('type', type);
        this.setAttribute('show', '');
        this.render();

        setTimeout(() => {
            this.hide();
        }, duration);
    }

    hide() {
        this.removeAttribute('show');
    }

    render() {
        const message = this.getAttribute('message') || '';
        const type = this.getAttribute('type') || 'info';
        const show = this.hasAttribute('show');

        const colors = {
            success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#10b981' },
            error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' },
            info: { bg: 'rgba(99, 102, 241, 0.1)', border: '#6366f1', text: '#6366f1' }
        };

        const color = colors[type] || colors.info;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    z-index: 1000;
                    opacity: ${show ? '1' : '0'};
                    transform: translateY(${show ? '0' : '-20px'});
                    transition: opacity 300ms, transform 300ms;
                    pointer-events: ${show ? 'auto' : 'none'};
                }
                .toast {
                    background: ${color.bg};
                    border: 1px solid ${color.border};
                    border-left: 3px solid ${color.border};
                    border-radius: 0.5rem;
                    padding: 1rem 1.5rem;
                    min-width: 300px;
                    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.5));
                }
                .message {
                    color: ${color.text};
                    font-size: 0.875rem;
                    font-weight: 500;
                }
            </style>
            ${show ? `
                <div class="toast">
                    <div class="message">${message}</div>
                </div>
            ` : ''}
        `;
    }
}

// Register all components
customElements.define('shield-button', ShieldButton);
customElements.define('shield-input', ShieldInput);
customElements.define('shield-card', ShieldCard);
customElements.define('shield-spinner', ShieldSpinner);
customElements.define('shield-toast', ShieldToast);

// Toast Manager
window.ShieldToast = {
    show: (message, type = 'info', duration = 3000) => {
        let toast = document.querySelector('shield-toast');
        if (!toast) {
            toast = document.createElement('shield-toast');
            document.body.appendChild(toast);
        }
        toast.show(message, type, duration);
    },
    success: (message, duration = 3000) => window.ShieldToast.show(message, 'success', duration),
    error: (message, duration = 3000) => window.ShieldToast.show(message, 'error', duration),
    info: (message, duration = 3000) => window.ShieldToast.show(message, 'info', duration)
};

// Dynamic Form Validation Helper
window.ShieldForm = {
    validate: (form) => {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            const shieldInput = input.closest('shield-input') || input;
            if (!input.value.trim()) {
                isValid = false;
                if (shieldInput.setAttribute) {
                    shieldInput.setAttribute('error', '');
                    shieldInput.setAttribute('error-message', 'This field is required');
                }
            } else {
                if (shieldInput.removeAttribute) {
                    shieldInput.removeAttribute('error');
                }
            }
        });

        return isValid;
    }
};
