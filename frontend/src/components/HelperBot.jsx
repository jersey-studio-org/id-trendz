import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const HELPER_OPTIONS = [
  {
    id: 'find-school',
    label: 'Find A School',
    summary: 'Open the directory and narrow by division, region, or school name.',
    getResponse: () => 'Browse schools by division first, then use search or region filters to jump directly to the right storefront.',
    actionLabel: 'Open Schools',
    actionPath: '/schools',
  },
  {
    id: 'customize-help',
    label: 'Customize Smarter',
    summary: 'Place names, numbers, and logos cleanly with quick controls.',
    getResponse: () => 'Select any text or logo on the jersey preview, then drag, resize with the slider, use the mouse wheel, or pinch on touch devices.',
    actionLabel: 'Start Customizing',
    actionPath: '/schools',
  },
  {
    id: 'size-help',
    label: 'US Size Guide',
    summary: 'See the full youth and adult size run available in the product.',
    getResponse: () => 'Available sizes are YS, YM, YL, YXL, XS, S, M, L, XL, 2XL, 3XL, 4XL, and 5XL.',
  },
  {
    id: 'artwork-rules',
    label: 'Artwork Rules',
    summary: 'Know what makes the final saved preview look production-ready.',
    getResponse: () => 'High-contrast text, centered number placement, and clean logo spacing produce the sharpest preview and the best order bundle output.',
  },
  {
    id: 'order-bundle',
    label: 'Order Bundle',
    summary: 'Understand what is packed into the ZIP file for checkout.',
    getResponse: () => 'The ZIP bundle includes the rendered preview image, a detailed order text summary, and JSON with school, color, size, quantity, text, number, and placement data.',
    actionLabel: 'Open Cart',
    actionPath: '/cart',
  },
  {
    id: 'checkout-ready',
    label: 'Checkout Checklist',
    summary: 'Double-check the details before you email the order package.',
    getResponse: () => 'Before checkout, confirm school, shirt color, size, quantity, name, number, logo placement, and preview image. Then attach the downloaded ZIP to your email.',
    actionLabel: 'Review Cart',
    actionPath: '/cart',
  },
];

export default function HelperBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeOptionId, setActiveOptionId] = useState(HELPER_OPTIONS[0].id);
  const location = useLocation();
  const navigate = useNavigate();

  const activeOption = useMemo(
    () => HELPER_OPTIONS.find((option) => option.id === activeOptionId) ?? HELPER_OPTIONS[0],
    [activeOptionId],
  );

  return (
    <div className={`helper-bot ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="helper-bot-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="helper-bot-panel"
      >
        <span className="helper-bot-trigger-icon" aria-hidden="true">+</span>
        <span className="helper-bot-trigger-copy">
          <strong>Helper Bot</strong>
          <small>Quick help only</small>
        </span>
      </button>

      {isOpen && (
        <section id="helper-bot-panel" className="helper-bot-panel" aria-label="Helper bot">
          <div className="helper-bot-header">
            <div>
              <p className="helper-bot-kicker">Finite Assistant</p>
              <h3>Choose a quick help topic</h3>
            </div>
            <button type="button" className="helper-bot-close" onClick={() => setIsOpen(false)} aria-label="Close helper bot">
              x
            </button>
          </div>

          <div className="helper-bot-grid">
            {HELPER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`helper-bot-option ${option.id === activeOption.id ? 'active' : ''}`}
                onClick={() => setActiveOptionId(option.id)}
              >
                <span>{option.label}</span>
                <small>{option.summary}</small>
              </button>
            ))}
          </div>

          <div className="helper-bot-response">
            <p>{activeOption.getResponse(location.pathname)}</p>
            {activeOption.actionPath && (
              <button
                type="button"
                className="helper-bot-action"
                onClick={() => {
                  navigate(activeOption.actionPath);
                  setIsOpen(false);
                }}
              >
                {activeOption.actionLabel}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
