// circle-of-fifths.js — SVG circle rendering and key selection

const CircleOfFifths = (() => {
  let selectedKey = null;
  let selectedMinorKey = null;
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

    // Outer ring (major keys)
    const outerR = 140;
    const innerR = 80;

    // Inner ring (minor keys)
    const minorOuterR = 80;
    const minorInnerR = 30;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('class', 'circle-of-fifths');

    const wedgeAngle = (2 * Math.PI) / 12;
    // Start from top (- PI/2) and offset by half a wedge so C is centered at top
    const startOffset = -Math.PI / 2 - wedgeAngle / 2;

    // Draw outer ring (major keys)
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

      svg.appendChild(text);
    });

    // Draw inner ring (minor keys)
    CIRCLE_OF_FIFTHS_MINOR.forEach((key, i) => {
      const angle1 = startOffset + i * wedgeAngle;
      const angle2 = angle1 + wedgeAngle;

      const ox1 = cx + minorOuterR * Math.cos(angle1);
      const oy1 = cy + minorOuterR * Math.sin(angle1);
      const ox2 = cx + minorOuterR * Math.cos(angle2);
      const oy2 = cy + minorOuterR * Math.sin(angle2);

      const ix1 = cx + minorInnerR * Math.cos(angle1);
      const iy1 = cy + minorInnerR * Math.sin(angle1);
      const ix2 = cx + minorInnerR * Math.cos(angle2);
      const iy2 = cy + minorInnerR * Math.sin(angle2);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = [
        `M ${ox1} ${oy1}`,
        `A ${minorOuterR} ${minorOuterR} 0 0 1 ${ox2} ${oy2}`,
        `L ${ix2} ${iy2}`,
        `A ${minorInnerR} ${minorInnerR} 0 0 0 ${ix1} ${iy1}`,
        'Z'
      ].join(' ');
      path.setAttribute('d', d);
      path.setAttribute('class', 'wedge-inner');
      path.setAttribute('data-minor-key', key);

      path.addEventListener('click', () => selectMinorKey(key));

      svg.appendChild(path);

      // Label
      const labelR = (minorOuterR + minorInnerR) / 2;
      const midAngle = angle1 + wedgeAngle / 2;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lx);
      text.setAttribute('y', ly);
      text.setAttribute('class', 'wedge-label-inner');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('data-minor-key', key);
      text.textContent = MINOR_KEY_DISPLAY_NAMES[key];

      svg.appendChild(text);
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  function selectKey(key) {
    selectedKey = key;
    selectedMinorKey = null;
    updateHighlight();
    if (onKeySelect) onKeySelect(key);
  }

  function selectMinorKey(key) {
    selectedMinorKey = key;
    selectedKey = null;
    updateHighlight();
    if (onKeySelect) onKeySelect(key, 'aeolian');
  }

  function updateHighlight() {
    document.querySelectorAll('.wedge').forEach(el => {
      el.classList.toggle('selected', el.getAttribute('data-key') === selectedKey);
    });
    document.querySelectorAll('.wedge-inner').forEach(el => {
      el.classList.toggle('selected', el.getAttribute('data-minor-key') === selectedMinorKey);
    });
  }

  function setSelected(key) {
    selectedKey = key;
    selectedMinorKey = null;
    updateHighlight();
  }

  return { init, setSelected };
})();
