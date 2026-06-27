const envelopeHTML = `
  <!-- ════════════════════════ ENVELOPE SCENE ════════════════════════ -->
  <div class="envelope-scene wave-bg" id="envelopeScene">

    <!-- Khmer textile strip (left) -->
    <div class="khmer-strip-left">
      <div class="khmer-strip-inner"></div>
      <div class="khmer-strip-lines-left"><span></span></div>
    </div>

    <div class="env-content">
      <span>
        <img src="./4x/logo.png" alt="" style="width: 40px; height:auto;">
      </span>
      <p class="cover-univ">Paragon International University</p>
      <h5 class="cover-h1">Commencement Ceremony</h5>
      <p class="cover-class">Class of 2026</p>

      <div class="envelope-art">
        <div class="env-body" id="envBody">
          <div class="env-flap"></div>
          <div class="env-left-tri"></div>
          <div class="env-right-tri"></div>
          <div class="env-bottom-tri"></div>

          <div class="env-letter">
            <div class="env-letter-preview">
              <p class="env-letter-preview-title">to our esteemed guest</p>
              <p class="env-letter-preview-name" id="envLetterName"></p>
            </div>
          </div>

          <!-- Wax seal -->
          <div class="env-seal" id="envSeal" onclick="sealClick()" role="button" tabindex="0"
            aria-label="Open invitation">
            <img src="SVG/Button.svg" alt="" style="height:80%; opacity:0.5;">
          </div>
        </div>
      </div>

      <p class="env-tap-hint" id="tapHint">Tap the seal to open</p>

    </div>

    <!-- Khmer textile strip (right) -->
    <div class="khmer-strip-right">
      <div class="khmer-strip-inner"></div>
      <div class="khmer-strip-lines-right"><span></span></div>
    </div>

  </div>
`;
