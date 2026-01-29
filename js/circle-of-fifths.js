// circle-of-fifths.js — SVG circle rendering and key selection

const CircleOfFifths = (() => {
  let selectedKey = null;
  let onKeySelect = null;

  function init(containerId, callback) {
    onKeySelect = callback;
    render(containerId);
  }

  function render(containerId) {
    const container = document.getElementById(containerId);
    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const outerR = 140;
    const innerR = 70;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('class', 'circle-of-fifths');

    const wedgeAngle = (2 * Math.PI) / 12;
    // Start from top (- PI/2) and offset by half a wedge so C is centered at top
    const startOffset = -Math.PI / 2 - wedgeAngle / 2;

    CIRCLE_OF_FIFTHS.forEach((key, i) => {
      const angle1 = startOffset + i * wedgeAngle;
      const angle2 = angle1 + wedgeAngle;

      // Outer arc points
      const ox1 = cx + outerR * Math.cos(angle1);
      const oy1 = cy + outerR * Math.sin(angle1);
      const ox2 = cx + outerR * Math.cos(angle2);
      const oy2 = cy + outerR * Math.sin(angle2);

      // Inner arc points
      const ix1 = cx + innerR * Math.cos(angle1);
      const iy1 = cy + innerR * Math.sin(angle1);
      const ix2 = cx + innerR * Math.cos(angle2);
      const iy2 = cy + innerR * Math.sin(angle2);

      // Path: outer arc → line to inner → inner arc (reverse) → close
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = [
        `M ${ox1} ${oy1}`,
        `A ${outerR} ${outerR} 0 0 1 ${ox2} ${oy2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerR} ${innerR} 0 0 0 ${ix1} ${iy1}`,
        'Z'
      ].join(' ');
      path.setAttribute('d', d);
      path.setAttribute('class', 'wedge');
      path.setAttribute('data-key', key);

      path.addEventListener('click', () => selectKey(key));

      svg.appendChild(path);

      // Label
      const labelR = (outerR + innerR) / 2;
      const midAngle = angle1 + wedgeAngle / 2;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lx);
      text.setAttribute('y', ly);
      text.setAttribute('class', 'wedge-label');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('data-key', key);
      text.textContent = KEY_DISPLAY_NAMES[key];

      text.addEventListener('click', () => selectKey(key));

      svg.appendChild(text);
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  function selectKey(key) {
    selectedKey = key;
    updateHighlight();
    if (onKeySelect) onKeySelect(key);
  }

  function updateHighlight() {
    document.querySelectorAll('.wedge').forEach(el => {
      el.classList.toggle('selected', el.getAttribute('data-key') === selectedKey);
    });
  }

  function setSelected(key) {
    selectedKey = key;
    updateHighlight();
  }

  return { init, setSelected };
})();
