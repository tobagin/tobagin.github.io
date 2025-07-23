/**
 * PWA Installation Manager
 * Handles Progressive Web App installation prompts and user experience
 */

class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.isInstalled = false;
    
    this.init();
  }

  init() {
    // Check if app is already installed
    this.checkInstallationStatus();
    
    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt available');
      
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = e;
      
      // Show custom install UI
      this.showInstallUI();
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA: App installed successfully');
      this.isInstalled = true;
      this.hideInstallUI();
      this.showInstalledMessage();
    });

    // Handle iOS Safari installation detection
    if (this.isIOS() && !this.isInStandaloneMode()) {
      this.showIOSInstallInstructions();
    }

    // Create install button if not exists
    this.createInstallButton();
  }

  checkInstallationStatus() {
    // Check if running as installed PWA
    if (this.isInStandaloneMode()) {
      this.isInstalled = true;
      console.log('PWA: Running as installed app');
      return;
    }

    // Check if installed via other means
    if (navigator.getInstalledRelatedApps) {
      navigator.getInstalledRelatedApps().then(relatedApps => {
        if (relatedApps.length > 0) {
          this.isInstalled = true;
          console.log('PWA: Related app detected');
        }
      });
    }
  }

  createInstallButton() {
    // Only create if not already installed and not on iOS
    if (this.isInstalled || this.isIOS()) {
      return;
    }

    // Create install button
    this.installButton = document.createElement('button');
    this.installButton.innerHTML = '📱 Install App';
    this.installButton.className = 'pwa-install-btn';
    this.installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3584e4;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 12px;
      font-family: "Cantarell", "Inter", system-ui, sans-serif;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 16px 0 rgba(53, 132, 228, 0.3);
      z-index: 1000;
      display: none;
      transition: all 0.3s ease;
      font-size: 14px;
    `;

    // Add hover effects
    this.installButton.addEventListener('mouseenter', () => {
      this.installButton.style.background = '#1c71d8';
      this.installButton.style.transform = 'translateY(-2px)';
    });

    this.installButton.addEventListener('mouseleave', () => {
      this.installButton.style.background = '#3584e4';
      this.installButton.style.transform = 'translateY(0)';
    });

    // Add click handler
    this.installButton.addEventListener('click', () => {
      this.handleInstallClick();
    });

    // Add to page
    document.body.appendChild(this.installButton);
  }

  showInstallUI() {
    if (this.installButton && !this.isInstalled) {
      this.installButton.style.display = 'block';
      
      // Animate in
      setTimeout(() => {
        this.installButton.style.opacity = '1';
      }, 100);
    }
  }

  hideInstallUI() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async handleInstallClick() {
    if (!this.deferredPrompt) {
      console.log('PWA: No install prompt available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`PWA: User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      // User accepted the install prompt
      this.hideInstallUI();
    }

    // Clear the deferredPrompt for next time
    this.deferredPrompt = null;
  }

  showInstalledMessage() {
    // Show temporary success message
    const message = document.createElement('div');
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #26a269;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: 'Cantarell', 'Inter', system-ui, sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 16px 0 rgba(38, 162, 105, 0.3);
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
      ">
        ✅ App installed successfully!
      </div>
    `;

    document.body.appendChild(message);

    // Remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  showIOSInstallInstructions() {
    // Only show on iOS Safari
    if (!this.isIOSafari()) {
      return;
    }

    // Create iOS install banner
    const banner = document.createElement('div');
    banner.className = 'ios-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #3584e4;
        color: white;
        padding: 16px 20px;
        font-family: 'Cantarell', 'Inter', system-ui, sans-serif;
        z-index: 1000;
        transform: translateY(100%);
        transition: transform 0.3s ease;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="flex: 1;">
            <strong>📱 Install Tobagin Apps</strong><br>
            <small>Tap <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">⬆️ Share</span> then "Add to Home Screen"</small>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
          ">✕</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in after a delay
    setTimeout(() => {
      const bannerElement = banner.querySelector('div');
      if (bannerElement) {
        bannerElement.style.transform = 'translateY(0)';
      }
    }, 2000);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 12000);
  }

  // Utility methods
  isInStandaloneMode() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           (window.navigator && window.navigator.standalone === true);
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isIOSafari() {
    return this.isIOS() && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
  }

  // Service Worker update management
  handleServiceWorkerUpdate() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control
        this.showUpdateAvailableMessage();
      });

      // Check for updates periodically
      setInterval(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
        }
      }, 60000); // Check every minute
    }
  }

  showUpdateAvailableMessage() {
    const message = document.createElement('div');
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #3584e4;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: 'Cantarell', 'Inter', system-ui, sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 16px 0 rgba(53, 132, 228, 0.3);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <span>🔄 App updated!</span>
        <button onclick="window.location.reload()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        ">Refresh</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: transparent;
          border: none;
          color: white;
          padding: 6px;
          cursor: pointer;
          font-size: 16px;
        ">✕</button>
      </div>
    `;

    document.body.appendChild(message);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 10000);
  }
}

// Initialize PWA Install Manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PWAInstallManager();
  });
} else {
  new PWAInstallManager();
}

// Add slideIn animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);