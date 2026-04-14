/**
 * A2UI Lit v0.9 Component Theme Overrides for Contacts App
 */

/**
 * The background gradient for the contacts theme.
 */
const contactsBackground = `radial-gradient(at 0% 0%, light-dark(rgba(45, 212, 191, 0.4), rgba(20, 184, 166, 0.2)) 0px, transparent 50%),
     radial-gradient(at 100% 0%, light-dark(rgba(56, 189, 248, 0.4), rgba(14, 165, 233, 0.2)) 0px, transparent 50%),
     radial-gradient(at 100% 100%, light-dark(rgba(163, 230, 53, 0.4), rgba(132, 204, 22, 0.2)) 0px, transparent 50%),
     radial-gradient(at 0% 100%, light-dark(rgba(52, 211, 153, 0.4), rgba(16, 185, 129, 0.2)) 0px, transparent 50%),
     linear-gradient(120deg, light-dark(#f0fdf4, #022c22) 0%, light-dark(#dcfce7, #064e3b) 100%)`;

/**
 * A CSS StyleSheet setting overrides for the A2UI widgets on the Contacts app.
 */
export const contactsThemeSheet = new CSSStyleSheet();
contactsThemeSheet.replaceSync(`
:root {
  --background: ${contactsBackground};

  /* Button Overrides - Sleek Indigo/Violet Palette for Contacts */
  --a2ui-button-background: linear-gradient(135deg, light-dark(var(--p-50), var(--p-30)) 0%, light-dark(var(--p-40), var(--p-20)) 100%);
  --a2ui-button-box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  --a2ui-button-font-weight: 600;
  --a2ui-button-border-radius: 16px;

  /* Link Overrides */
  --a2ui-text-a-color: var(--p-40);
  --a2ui-text-a-font-weight: 500;

  /* Card Overrides */
  --a2ui-card-border: 1px solid light-dark(var(--n-80), var(--n-20));
  --a2ui-card-border-radius: 16px;
  --a2ui-card-background: light-dark(var(--n-100), var(--n-10));

  /* Image Overrides */
  --a2ui-image-border-radius: 50%; /* Perfect for contact avatars */
}
`);
