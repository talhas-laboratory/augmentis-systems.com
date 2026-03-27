module.exports = {
  content: [
    "./index.html",
    "./mobile.html",
    "./augmentis_systems_desktop_with_contact_form/code.html",
    "./augmentis_systems_mobile_with_contact_form/code.html"
  ],
  theme: {
    extend: {
      colors: {
        "on-tertiary-fixed-variant": "#49473e",
        "surface-dim": "#dcdad5",
        "tertiary-fixed-dim": "#cbc6bb",
        "tertiary": "#2a2821",
        "on-tertiary": "#ffffff",
        "on-secondary-container": "#61646c",
        "background": "#fbf9f4",
        "surface-container": "#f0eee9",
        "surface-container-highest": "#e4e2dd",
        "on-secondary-fixed-variant": "#43474e",
        "tertiary-container": "#403e36",
        "on-secondary-fixed": "#181c22",
        "on-surface": "#1b1c19",
        "surface-tint": "#3654c8",
        "on-error-container": "#93000a",
        "on-background": "#1b1c19",
        "on-secondary": "#ffffff",
        "on-primary-container": "#90a4ff",
        "error-container": "#ffdad6",
        "surface-variant": "#e4e2dd",
        "inverse-surface": "#30312d",
        "on-tertiary-container": "#ada99e",
        "on-tertiary-fixed": "#1d1c15",
        "surface-container-lowest": "#ffffff",
        "secondary": "#5b5e66",
        "outline": "#757685",
        "secondary-fixed-dim": "#c3c6cf",
        "primary-fixed": "#dde1ff",
        "primary-fixed-dim": "#b8c4ff",
        "on-primary-fixed": "#001355",
        "surface-container-high": "#eae8e3",
        "outline-variant": "#c4c5d6",
        "secondary-container": "#dfe2eb",
        "inverse-primary": "#b8c4ff",
        "surface": "#fbf9f4",
        "on-primary-fixed-variant": "#1439af",
        "primary": "#001e73",
        "secondary-fixed": "#dfe2eb",
        "surface-bright": "#fbf9f4",
        "on-error": "#ffffff",
        "primary-container": "#002fa7",
        "surface-container-low": "#f5f3ee",
        "inverse-on-surface": "#f3f1eb",
        "error": "#ba1a1a",
        "on-surface-variant": "#444653",
        "tertiary-fixed": "#e7e2d7",
        "on-primary": "#ffffff"
      },
      fontFamily: {
        "headline": ["Manrope"],
        "body": ["Inter"],
        "label": ["Inter"]
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "9999px"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
