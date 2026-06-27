/* ═══════════════════════════════════════════════════════════
   PIU Commencement 2026 — Invitation card  (V2 layout)
   Same blue/cream design + fonts as the original; only the
   ARRANGEMENT is richer (date block, location, action buttons,
   RSVP, dress code, watermark).
   Keeps IDs invName / invPos / invCompany for personalization.
   ═══════════════════════════════════════════════════════════ */
const CAL_LINK =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=Paragon+International+University+Commencement+2026' +
  '&dates=20260815T073000Z/20260815T100000Z' +
  '&location=Sokha+Hotel,+Phnom+Penh' +
  '&details=Class+of+2026+Commencement+Ceremony';

const MAP_LINK = 'https://www.google.com/maps/search/?api=1&query=Sokha+Hotel+Phnom+Penh';

const invitationHTML = `
  <!-- Page 1: Formal Invitation (V2 layout, original design) -->
  <div class="page-invite inv2">
    <div class="inv-khmer-strip-left">
      <div class="inv-khmer-strip-inner"></div>
      <div class="inv-khmer-strip-lines-left"><span></span></div>
    </div>

    <!-- Decorative motif, bottom-left -->
    <div class="inv2-art-bl" aria-hidden="true"></div>

    <div class="inv-body">

      <!-- Crest -->
      <!-- <img class="inv2-crest" src="4x/logo.png" alt="Paragon International University" /> -->

      <!-- Invitation plate (original) -->
      <img src="4x/Invitation_plate@4x.png" alt="Invitation" class="inv2-plate" />

      <p class="inv-preamble">Paragon International University <br> has thehonor to invite</p>

      <div class="blue-orn">&#8212;&nbsp;&#10022;&nbsp;&#8212;</div>

      <h2 class="inv-name" id="invName">Distinguished Guest</h2>
      <p class="inv-pos" id="invPos" style="display:none;"></p>
      <p class="inv-company" id="invCompany" style="display:none;"></p>

      <div class="blue-orn">&#8212;&nbsp;&#10022;&nbsp;&#8212;</div>

      <p class="inv-body-text">  to the <span class="highlight-class">Commencement Ceremony</span> for the <span class="highlight-class">Class of 2026</span><br>
  as our esteemed guest on</p>

      <!-- Date block -->
      <div class="inv2-datebox">  
        <span class="inv2-corner tl"></span>
        <span class="inv2-corner tr"></span>
        <span class="inv2-corner bl"></span>
        <span class="inv2-corner br"></span>
        <div class="inv2-date-left">
          <span class="inv2-dow">Saturday</span>
          <span class="inv2-day">15</span>
          <span class="inv2-month">August 2026</span>
        </div>
        <div class="inv2-date-sep"><i></i><span>&#9670;</span><i></i></div>
        <div class="inv2-time"><span class="inv2-time-num">1:30</span><span class="inv2-time-mer">PM</span></div>
      </div>

      <!-- Location -->
      <div class="inv2-loc">
        <svg viewBox="0 0 24 24" class="inv2-ic-pin"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        <p class="inv2-venue">Sokha Hotel</p>
        <p class="inv2-city">Phnom Penh</p>
      </div>

      <!-- Action buttons -->
      <div class="inv2-actions">
        <a class="inv2-action" href="${CAL_LINK}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
          <span>Add to<br>Calendar</span>
        </a>
        <span class="inv2-action-sep"></span>
        <a class="inv2-action" href="${MAP_LINK}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>View<br>Location</span>
        </a>
      </div>

      <!-- RSVP -->
      <div class="inv2-rsvp-head"><span>Kindly RSVP at </span></div>
      <p class="inv2-phone">
        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        017 996 111 / 015 996 111
      </p>
      <p class="inv2-rsvp-sub">by Monday, 10 August 2026</p>

      <!-- Dress code -->
      <div class="inv2-dress">
        <svg viewBox="0 0 24 24"><path d="M12 9l-4-3 1.5 3L12 11l2.5-2L16 6l-4 3z"/><path d="M4 8l4 2-1 4 5 2 5-2-1-4 4-2"/></svg>
        <p><span>Dress Code</span><br>Formal</p>
      </div>

      
    </div>

    <div class="inv-khmer-strip-right">
      <div class="inv-khmer-strip-inner"></div>
      <div class="inv-khmer-strip-lines-right"><span></span></div>
    </div>
  </div>
`;
